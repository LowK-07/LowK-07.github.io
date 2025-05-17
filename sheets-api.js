class GoogleSheetsAPI {
    constructor() {
        // Sử dụng spreadsheetId của bạn
        this.spreadsheetId = '1d-laKM9AZDEfxxChXI_q4xUcqxPGVs7GUZNHmptpRPE';
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            const auth = new google.auth.GoogleAuth({
                // Sử dụng biến môi trường hoặc tham số cấu hình từ server
                credentials: await this.getCredentials(),
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
            });

            this.sheets = google.sheets({ version: 'v4', auth });
            this.initialized = true;
            console.log('✅ Google Sheets API đã được khởi tạo thành công');
        } catch (error) {
            console.error('❌ Lỗi khởi tạo Google Sheets API:', error);
            throw error;
        }
    }

    async getCredentials() {
        // Trong môi trường production, credentials nên được lưu trữ an toàn
        // và truy xuất thông qua API bảo mật
        return {
            type: "service_account",
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            universe_domain: "googleapis.com"
            // Các thông tin nhạy cảm khác được lưu trữ an toàn
        };
    }

    async getData(range) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: range,
            });

            return response.data.values || [];
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
        // Dữ liệu cho biểu đồ chi tiêu theo danh mục
        const categories = {};
        if (data.chiTieu) {
            data.chiTieu.forEach(row => {
                const category = row[3] || 'Khác';
                const amount = parseFloat(row[2]) || 0;
                categories[category] = (categories[category] || 0) + amount;
            });
        }

        // Dữ liệu cho biểu đồ tiết kiệm theo tháng
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

    async validateConnection() {
        try {
            await this.initialize();
            const testData = await this.getData('KẾ HOẠCH CHI TIÊU CHUNG!A1:A1');
            return {
                success: true,
                message: '✅ Kết nối thành công với Google Sheets API',
                data: testData
            };
        } catch (error) {
            return {
                success: false,
                message: '❌ Lỗi kết nối với Google Sheets API',
                error: error.message
            };
        }
    }

    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }
}

// Khởi tạo API
const sheetsApi = new GoogleSheetsAPI();

// Thêm hàm test connection
async function testConnection() {
    const result = await sheetsApi.validateConnection();
    console.log(result.message);
    if (!result.success) {
        console.error('Chi tiết lỗi:', result.error);
    }
}

// Export để sử dụng trong các file khác
export { sheetsApi, testConnection };
