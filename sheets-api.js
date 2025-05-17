class GoogleSheetsAPI {
    constructor() {
        this.spreadsheetId = '1d-laKM9AZDEfxxChXI_q4xUcqxPGVs7GUZNHmptpRPE';
        this.initialized = false;
        this.lastUpdate = '2025-05-17 07:16:21';
        this.username = 'LowK-07';
        this._initPromise = null;
    }

    async initialize() {
        if (this._initPromise) return this._initPromise;

        this._initPromise = new Promise((resolve, reject) => {
            gapi.load('client', async () => {
                try {
                    await gapi.client.init({
                        apiKey: 'AIzaSyDFJfc0Ay7Q8b--esNV86OCa8yLeC3n7FQ',
                        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
                    });

                    this.initialized = true;
                    console.log(`✅ Google Sheets API khởi tạo thành công
    🕒 Cập nhật lần cuối: ${this.lastUpdate}
    👤 User: ${this.username}`);
                    resolve();
                } catch (error) {
                    console.error('❌ Lỗi khởi tạo Google Sheets API:', error);
                    reject(new Error(`Lỗi khởi tạo API: ${error.message}`));
                }
            });
        });

        return this._initPromise;
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

            console.log(`📊 Lấy dữ liệu từ range ${range}:`, response.result.values);
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

            console.log('📋 Raw Data:', {
                keHoach: keHoach,
                nganSach: nganSach,
                chiTieu: chiTieu,
                tietKiem: tietKiem
            });

            console.log(`📊 Đã lấy dữ liệu thành công
    📅 Tháng: ${month || 'Tất cả'}
    📝 Số mục kế hoạch: ${keHoach?.length || 0}
    💰 Số mục ngân sách: ${nganSach?.length || 0}
    💸 Số mục chi tiêu: ${chiTieu?.length || 0}
    🏦 Số mục tiết kiệm: ${tietKiem?.length || 0}`);

            const filteredData = {
                keHoach: this.filterByMonth(keHoach, month),
                nganSach: this.filterByMonth(nganSach, month),
                chiTieu: this.filterByMonth(chiTieu, month),
                tietKiem: this.filterByMonth(tietKiem, month)
            };

            console.log('🔍 Filtered Data:', filteredData);
            return filteredData;
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

    sumColumn(data, colIndex) {
        if (!data || !Array.isArray(data)) return 0;
        return data.reduce((sum, row) => {
            if (!row[colIndex]) return sum;
            const rawValue = String(row[colIndex]).replace(/[^\d.-]/g, '');
            const value = parseFloat(rawValue) || 0;
            console.log(`🔢 Processing value: "${row[colIndex]}" -> ${value}`);
            return sum + value;
        }, 0);
    }

    calculateTotals(data) {
        try {
            console.log('💭 Calculating totals for:', data);

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

    getChartData(data) {
        try {
            const categories = {};
            if (data.chiTieu) {
                data.chiTieu.forEach(row => {
                    const category = row[3] || 'Khác';
                    const amount = parseFloat(String(row[2]).replace(/[^\d.-]/g, '')) || 0;
                    categories[category] = (categories[category] || 0) + amount;
                });
            }

            const savings = data.tietKiem ? data.tietKiem.map(row => ({
                month: row[0],
                amount: parseFloat(String(row[3]).replace(/[^\d.-]/g, '')) || 0
            })) : [];

            console.log('📊 Chart Data:', {
                categories: categories,
                savings: savings
            });

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

// Khởi tạo instance
const sheetsApi = new GoogleSheetsAPI();
