class GoogleSheetsAPI {
    constructor() {
        // ID của Google Sheet của bạn
        this.spreadsheetId = '1d-laKM9AZDEfxxChXI_q4xUcqxPGVs7GUZNHmptpRPE';
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            await gapi.client.init({
                apiKey: 'YOUR_API_KEY', // Thêm API key nếu cần
                discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            });

            this.initialized = true;
            console.log('✅ Google Sheets API đã được khởi tạo thành công');
        } catch (error) {
            console.error('❌ Lỗi khởi tạo Google Sheets API:', error);
            throw error;
        }
    }

    async getData(range) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: range,
            });

            return response.result.values || [];
        } catch (error) {
            console.error('❌ Lỗi khi lấy dữ liệu:', error);
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
            console.error('❌ Lỗi khi lấy tất cả dữ liệu:', error);
            throw error;
        }
    }

    filterByMonth(data, month) {
        if (!month || !data) return data;
        
        const [year, monthNum] = month.split('-');
        return data.filter(row => {
            if (!row[0]) return false;
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
        if (!data || !Array.isArray(data)) return 0;
        return data.reduce((sum, row) => {
            const value = parseFloat(row[colIndex]) || 0;
            return sum + value;
        }, 0);
    }

    getChartData(data) {
        const categories = {};
        if (data.chiTieu) {
            data.chiTieu.forEach(row => {
                const category = row[3] || 'Khác';
                const amount = parseFloat(row[2]) || 0;
                categories[category] = (categories[category] || 0) + amount;
            });
        }

        const savings = data.tietKiem ? data.tietKiem.map(row => ({
            month: row[0],
            amount: parseFloat(row[3]) || 0
        })) : [];

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

const sheetsApi = new GoogleSheetsAPI();

// Load Google API khi trang được load
gapi.load('client', async () => {
    try {
        await sheetsApi.initialize();
    } catch (error) {
        console.error('Lỗi khởi tạo API:', error);
    }
});