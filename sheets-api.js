class GoogleSheetsAPI {
    constructor() {
        // ID của Google Sheet của bạn
        this.spreadsheetId = '1d-laKM9AZDEfxxChXI_q4xUcqxPGVs7GUZNHmptpRPE';
        this.initialized = false;
        this.lastUpdate = '2025-05-17 06:28:58';
        this.username = 'LowK-07';
    }

    async initialize() {
        if (this.initialized) return;

        try {
            await gapi.client.init({
                apiKey: 'AIzaSyDFJfc0Ay7Q8b--esNV86OCa8yLeC3n7FQ',
                discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            });

            this.initialized = true;
            console.log(`✅ Google Sheets API khởi tạo thành công
    🕒 Cập nhật lần cuối: ${this.lastUpdate}
    👤 User: ${this.username}`);
        } catch (error) {
            console.error('❌ Lỗi khởi tạo Google Sheets API:', error);
            throw new Error(`Lỗi khởi tạo API: ${error.message}`);
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
            throw new Error(`Lỗi lấy dữ liệu từ sheet: ${error.message}`);
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

            console.log(`📊 Đã lấy dữ liệu thành công
    📅 Tháng: ${month || 'Tất cả'}
    📝 Số mục kế hoạch: ${keHoach?.length || 0}
    💰 Số mục ngân sách: ${nganSach?.length || 0}
    💸 Số mục chi tiêu: ${chiTieu?.length || 0}
    🏦 Số mục tiết kiệm: ${tietKiem?.length || 0}`);

            return {
                keHoach: this.filterByMonth(keHoach, month),
                nganSach: this.filterByMonth(nganSach, month),
                chiTieu: this.filterByMonth(chiTieu, month),
                tietKiem: this.filterByMonth(tietKiem, month)
            };
        } catch (error) {
            console.error('❌ Lỗi khi lấy tất cả dữ liệu:', error);
            throw new Error(`Lỗi lấy toàn bộ dữ liệu: ${error.message}`);
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
        try {
            const totals = {
                tongNganSach: this.sumColumn(data.nganSach, 2),
                tongChiTieu: this.sumColumn(data.chiTieu, 2),
                tongTietKiem: this.sumColumn(data.tietKiem, 3)
            };

            console.log(`💵 Tổng kết:
    📈 Tổng ngân sách: ${totals.tongNganSach.toLocaleString('vi-VN')}đ
    📉 Tổng chi tiêu: ${totals.tongChiTieu.toLocaleString('vi-VN')}đ
    💰 Tổng tiết kiệm: ${totals.tongTietKiem.toLocaleString('vi-VN')}đ`);

            return totals;
        } catch (error) {
            console.error('❌ Lỗi khi tính tổng:', error);
            throw new Error(`Lỗi tính tổng: ${error.message}`);
        }
    }

    sumColumn(data, colIndex) {
        if (!data || !Array.isArray(data)) return 0;
        return data.reduce((sum, row) => {
            const value = parseFloat(row[colIndex]) || 0;
            return sum + value;
        }, 0);
    }

    getChartData(data) {
        try {
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

            console.log(`📊 Dữ liệu biểu đồ:
    🔍 Số danh mục chi tiêu: ${Object.keys(categories).length}
    📅 Số tháng tiết kiệm: ${savings.length}`);

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
        } catch (error) {
            console.error('❌ Lỗi khi tạo dữ liệu biểu đồ:', error);
            throw new Error(`Lỗi tạo biểu đồ: ${error.message}`);
        }
    }
}

// Khởi tạo instance của GoogleSheetsAPI
const sheetsApi = new GoogleSheetsAPI();

// Load Google API khi trang được load
gapi.load('client', async () => {
    try {
        await sheetsApi.initialize();
        console.log('🚀 Google Sheets API đã sẵn sàng');
    } catch (error) {
        console.error('❌ Lỗi khởi tạo API:', error);
        document.getElementById('error-message').innerHTML = 
            `<div class="alert alert-danger">
                Có lỗi xảy ra khi kết nối với Google Sheets. 
                Vui lòng tải lại trang hoặc liên hệ admin.
            </div>`;
    }
});
