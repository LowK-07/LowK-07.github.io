document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo tháng hiện tại
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Populate month selector
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

    // Update data when month changes
    monthSelector.addEventListener('change', updateData);

    // Initial data load
    updateData();
});

async function updateData() {
    try {
        const month = document.getElementById('monthSelector').value;
        const data = await sheetsApi.getAllData(month);
        const totals = sheetsApi.calculateTotals(data);
        
        // Update summary cards
        document.getElementById('tongNganSach').textContent = totals.tongNganSach.toLocaleString('vi-VN') + 'đ';
        document.getElementById('tongChiTieu').textContent = totals.tongChiTieu.toLocaleString('vi-VN') + 'đ';
        document.getElementById('conLai').textContent = (totals.tongNganSach - totals.tongChiTieu).toLocaleString('vi-VN') + 'đ';
        document.getElementById('tietKiem').textContent = totals.tongTietKiem.toLocaleString('vi-VN') + 'đ';

        // Update tables
        updateTable('keHoachTable', data.keHoach);
        updateTable('chiTieuTable', data.chiTieu);

        // Update charts
        const chartData = sheetsApi.getChartData(data);
        updateCharts(chartData);

    } catch (error) {
        console.error('Lỗi khi cập nhật dữ liệu:', error);
        document.getElementById('error-message').innerHTML = 
            `<div class="alert alert-danger">
                Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.
                <br>Chi tiết: ${error.message}
            </div>`;
    }
}

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
        tr.innerHTML = row.map(cell => `<td>${cell}</td>`).join('');
        tbody.appendChild(tr);
    });
}

function updateCharts(chartData) {
    // Update Expense Chart
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

    // Update Saving Chart
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
