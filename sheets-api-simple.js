class GoogleSheetsAPI {
    constructor(apiKey, spreadsheetId) {
        this.apiKey = apiKey;
        this.spreadsheetId = spreadsheetId;
        this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    }

    // Hàm lấy dữ liệu từ sheet
    async getData(range) {
        try {
            const url = `${this.baseUrl}/${this.spreadsheetId}/values/${range}?key=${this.apiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.values || [];
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu:', error);
            throw error;
        }
    }

    // Hàm lấy dữ liệu theo loại và tháng
    async getFinanceData(reportType, month) {
        try {
            // Xác định range dựa trên loại báo cáo
            let range;
            switch(reportType) {
                case 'income':
                    range = 'Thu nhập!A2:D';
                    break;
                case 'expense':
                    range = 'Chi tiêu!A2:D';
                    break;
                case 'saving':
                    range = 'Tiết kiệm!A2:D';
                    break;
                default:
                    range = 'Tổng quan!A2:D';
            }

            const data = await this.getData(range);
            
            // Lọc dữ liệu theo tháng
            if (month) {
                const [yearFilter, monthFilter] = month.split('-');
                return data.filter(row => {
                    const rowDate = new Date(row[0]);
                    return rowDate.getFullYear() === parseInt(yearFilter) &&
                           rowDate.getMonth() === parseInt(monthFilter) - 1;
                });
            }
            
            return data;
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu tài chính:', error);
            throw error;
        }
    }
}

// Khởi tạo với API key và Spreadsheet ID của bạn
const sheetsApi = new GoogleSheetsAPI(
    'YOUR_API_KEY',           // Thay thế bằng API key của bạn
    'YOUR_SPREADSHEET_ID'     // Thay thế bằng ID của Google Sheet của bạn
);
