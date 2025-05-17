let currentMonth = document.getElementById('monthPicker').value;
let expenseChart, savingChart;

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', async () => {
    await sheetsApi.initialize();
    await refreshData();
    setupCharts();
});

async function refreshData() {
    currentMonth = document.getElementById('monthPicker').value;
    const dataType = document.getElementById('dataType').value;
    
    try {
        const data = await sheetsApi.getAllData(currentMonth);
        updateDashboard(data);
        updateTable(dataType, data);
        updateCharts(data);
    } catch (error) {
        console.error('Lỗi khi refresh dữ liệu:', error);
        alert('Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.');
    }
}

function updateDashboard(data) {
    const totals = sheetsApi.calculateTotals(data);
    
    document.querySelector('#budgetCard .amount').textContent = 
        formatCurrency(totals.tongNganSach);
    document.querySelector('#expenseCard .amount').textContent = 
        formatCurrency(totals.tongChiTieu);
    document.querySelector('#savingCard .amount').textContent = 
        formatCurrency(totals.tongTietKiem);
}

function setupCharts() {
    // Biểu đồ chi tiêu theo danh mục
    const expenseCtx = document.getElementById('expenseChart').getContext('2d');
    expenseChart = new Chart(expenseCtx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#FF9ECD', '#FFB7D5', '#FFC9E0', '#FFD6E7', '#FFE4EE',
                    '#FFF0F5', '#FFF5F8', '#FFF9FB', '#FFEBEE', '#FFE0E6'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Chi tiêu theo Danh mục'
                }
            }
        }
    });

    // Biểu đồ tiết kiệm theo tháng
    const savingCtx = document.getElementById('savingChart').getContext('2d');
    savingChart = new Chart(savingCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Tiết kiệm',
                data: [],
                borderColor: '#FF9ECD',
                backgroundColor: 'rgba(255, 158, 205, 0.1)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Tiết kiệm theo Tháng'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateCharts(data) {
    const chartData = sheetsApi.getChartData(data);

    // Cập nhật biểu đồ chi tiêu
    expenseChart.data.labels = chartData.expenseChart.labels;
    expenseChart.data.datasets[0].data = chartData.expenseChart.data;
    expenseChart.update();

    // Cập nhật biểu đồ tiết kiệm
    savingChart.data.labels = chartData.savingChart.labels;
    savingChart.data.datasets[0].data = chartData.savingChart.data;
    savingChart.update();
}

function updateTable(dataType, data) {
    const table = document.getElementById('dataTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    
    let headers, rows;
    
    switch(dataType) {
        case 'KE_HOACH':
            headers = ['Ngày', 'Hoạt động', 'Số tiền', 'Ghi chú'];
            rows = data.keHoach;
            break;
        case 'NGAN_SACH':
            headers = ['Ngày', 'Nguồn tiền', 'Số tiền', 'Ghi chú'];
            rows = data.nganSach;
            break;
        case 'CHI_TIEU':
            headers = ['Ngày', 'Mô tả', 'Số tiền', 'Danh mục', 'Phương thức', 'Ghi chú'];
            rows = data.chiTieu;
            break;
        case 'TIET_KIEM':
            headers = ['Tháng', 'Ngân sách', 'Chi tiêu', 'Tiết kiệm', 'Ghi chú'];
            rows = data.tietKiem;
            break;
    }

    thead.innerHTML = `
        <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
        </tr>
    `;

    tbody.innerHTML = rows.map(row => `
        <tr>
            ${row.map((cell, index) => `
                <td>${index === 2 ? formatCurrency(cell) : cell}</td>
            `).join('')}
        </tr>
    `).join('');
}

async function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    try {
        const data = await sheetsApi.getAllData(currentMonth);
        const totals = sheetsApi.calculateTotals(data);
        
        // Tiêu đề
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('Báo cáo Tài chính Cá nhân', 105, 20, { align: 'center' });
        
        // Thông tin chung
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Tháng: ${currentMonth}`, 20, 30);
        doc.text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, 20, 40);
        
        // Tổng quan
        doc.text('Tổng quan:', 20, 55);
        doc.text(`Tổng ngân sách: ${formatCurrency(totals.tongNganSach)}`, 30, 65);
        doc.text(`Tổng chi tiêu: ${formatCurrency(totals.tongChiTieu)}`, 30, 75);
        doc.text(`Tiết kiệm: ${formatCurrency(totals.tongTietKiem)}`, 30, 85);
        
        // Bảng chi tiết
        const tableData = data.chiTieu.map(row => [
            row[0],
            row[1],
            formatCurrency(row[2]),
            row[3],
            row[4]
        ]);
        
        doc.autoTable({
            startY: 100,
            head: [['Ngày', 'Mô tả', 'Số tiền', 'Danh mục', 'Phương thức']],
            body: tableData,
            theme: 'grid',
            styles: {
                fontSize: 10,
                cellPadding: 5
            },
            headStyles: {
                fillColor: [255, 158, 205],
                textColor: [255, 255, 255]
            }
        });
        
        // Lưu file
        doc.save(`bao-cao-tai-chinh-${currentMonth}.pdf`);
    } catch (error) {
        console.error('Lỗi khi tạo PDF:', error);
        alert('Có lỗi xảy ra khi tạo PDF. Vui lòng thử lại.');
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Xử lý nhạc nền
let isMusicPlaying = false;
const bgMusic = document.getElementById('bgMusic');

function toggleMusic() {
    if (isMusicPlaying) {
        bgMusic.pause();
        isMusicPlaying = false;
    } else {
        bgMusic.play();
        isMusicPlaying = true;
    }
}
