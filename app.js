// Khởi tạo ứng dụng
async function initializeApp() {
    try {
        await sheetsApi.initialize();
        console.log('🚀 Google Sheets API đã sẵn sàng');
        setupEventListeners();
        await updateData();
    } catch (error) {
        console.error('❌ Lỗi khởi tạo:', error);
        document.getElementById('error-message').innerHTML = 
            `<div class="alert alert-danger">
                Có lỗi xảy ra khi kết nối với Google Sheets. 
                Vui lòng tải lại trang hoặc liên hệ admin.
                <br>Chi tiết: ${error.message}
            </div>`;
    }
}

// Thiết lập các event listeners
function setupEventListeners() {
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    const monthSelector = document.getElementById('monthSelector');
    for (let i = 0; i < 12; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const option = document.createElement('option');
        option.value = value;
        option.text = `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
        if (value === currentMonth) {
            option.selected = true;
        }
        monthSelector.appendChild(option);
    }

    monthSelector.addEventListener('change', updateData);
}

// Cập nhật dữ liệu
async function updateData() {
    try {
        const month = document.getElementById('monthSelector').value;
        const data = await sheetsApi.getAllData(month);
        const totals = sheetsApi.calculateTotals(data);
        
        // Cập nhật các thẻ tổng hợp
        document.getElementById('tongNganSach').textContent = totals.tongNganSach.toLocaleString('vi-VN') + 'đ';
        document.getElementById('tongChiTieu').textContent = totals.tongChiTieu.toLocaleString('vi-VN') + 'đ';
        document.getElementById('conLai').textContent = (totals.tongNganSach - totals.tongChiTieu).toLocaleString('vi-VN') + 'đ';
        document.getElementById('tietKiem').textContent = totals.tongTietKiem.toLocaleString('vi-VN') + 'đ';

        // Cập nhật bảng
        updateTable('keHoachTable', data.keHoach);
        updateTable('chiTieuTable', data.chiTieu);

        // Cập nhật biểu đồ
        const chartData = sheetsApi.getChartData(data);
        updateCharts(chartData);

    } catch (error) {
        console.error('❌ Lỗi khi cập nhật dữ liệu:', error);
        document.getElementById('error-message').innerHTML = 
            `<div class="alert alert-danger">
                Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.
                <br>Chi tiết: ${error.message}
            </div>`;
    }
}

// Cập nhật bảng
function updateTable(tableId, data) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = '';
    
    if (!data || !data.length) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="5" class="text-center">Không có dữ liệu</td>`;
        tbody.appendChild(tr);
        return;
    }

    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = row.map(cell => `<td>${cell || ''}</td>`).join('');
        tbody.appendChild(tr);
    });
}

// Cập nhật biểu đồ
function updateCharts(chartData) {
    // Biểu đồ chi tiêu
    const expenseCtx = document.getElementById('expenseChart').getContext('2d');
    if (window.expenseChart) {
        window.expenseChart.destroy();
    }
    window.expenseChart = new Chart(expenseCtx, {
        type: 'pie',
        data: {
            labels: chartData.expenseChart.labels,
            datasets: [{
                data: chartData.expenseChart.data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                    '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Biểu đồ tiết kiệm
    const savingCtx = document.getElementById('savingChart').getContext('2d');
    if (window.savingChart) {
        window.savingChart.destroy();
    }
    window.savingChart = new Chart(savingCtx, {
        type: 'line',
        data: {
            labels: chartData.savingChart.labels,
            datasets: [{
                label: 'Tiết kiệm',
                data: chartData.savingChart.data,
                borderColor: '#36A2EB',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Khởi tạo khi DOM đã load xong
document.addEventListener('DOMContentLoaded', initializeApp);