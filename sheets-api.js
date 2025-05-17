class GoogleSheetsAPI {
    constructor(credentials) {
        this.credentials = credentials;
        this.spreadsheetId = '1d-laKM9AZDEfxxChXI_q4xUcqxPGVs7GUZNHmptpRPE'; // Thay thế bằng ID của Google Sheet của bạn
    }

    async initialize() {
        try {
            const auth = new google.auth.GoogleAuth({
                credentials: this.credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
            });

            this.sheets = google.sheets({ version: 'v4', auth });
            console.log('Google Sheets API đã được khởi tạo');
        } catch (error) {
            console.error('Lỗi khởi tạo Google Sheets API:', error);
            throw error;
        }
    }

    async getData(range) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: range,
            });
            return response.data.values || [];
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu:', error);
            throw error;
        }
    }

    async getAllData(month) {
        try {
            const [keHoach, nganSach, chiTieu, tietKiem] = await Promise.all([
                this.getData('KẾ HOẠCH CHI TIÊU CHUNG!A2:D'),
                this.getData('NGÂN SÁCH!A2:D'),
                this.getData('CHI TIÊU CỤ THỂ!A2:F'),
                this.getData('TIẾT KIỆM!A2:E')
            ]);

            return {
                keHoach: this.filterByMonth(keHoach, month),
                nganSach: this.filterByMonth(nganSach, month),
                chiTieu: this.filterByMonth(chiTieu, month),
                tietKiem: this.filterByMonth(tietKiem, month)
            };
        } catch (error) {
            console.error('Lỗi khi lấy tất cả dữ liệu:', error);
            throw error;
        }
    }

    filterByMonth(data, month) {
        if (!month) return data;
        
        const [year, monthNum] = month.split('-');
        return data.filter(row => {
            const rowDate = new Date(row[0]);
            return rowDate.getFullYear() === parseInt(year) &&
                   rowDate.getMonth() === parseInt(monthNum) - 1;
        });
    }

    calculateTotals(data) {
        return {
            tongNganSach: this.sumColumn(data.nganSach, 2),
            tongChiTieu: this.sumColumn(data.chiTieu, 2),
            tongTietKiem: this.sumColumn(data.tietKiem, 3)
        };
    }

    sumColumn(data, colIndex) {
        return data.reduce((sum, row) => {
            const value = parseFloat(row[colIndex]) || 0;
            return sum + value;
        }, 0);
    }

    getChartData(data) {
        // Dữ liệu cho biểu đồ chi tiêu theo danh mục
        const categories = {};
        data.chiTieu.forEach(row => {
            const category = row[3];
            const amount = parseFloat(row[2]) || 0;
            categories[category] = (categories[category] || 0) + amount;
        });

        // Dữ liệu cho biểu đồ tiết kiệm theo tháng
        const savings = data.tietKiem.map(row => ({
            month: row[0],
            amount: parseFloat(row[3]) || 0
        }));

        return {
            expenseChart: {
                labels: Object.keys(categories),
                data: Object.values(categories)
            },
            savingChart: {
                labels: savings.map(s => s.month),
                data: savings.map(s => s.amount)
            }
        };
    }
}

// Khởi tạo API với credentials từ file JSON
const credentials = {
    // Paste nội dung file JSON credentials của bạn vào đây
};

const sheetsApi = new GoogleSheetsAPI(credentials);
