// Khởi tạo ứng dụng
async function initializeApp() {
    try {
        await sheetsApi.initialize();
        console.log('🚀 Google Sheets API đã sẵn sàng');
        setupEventListeners();
        initializeMusic();
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

// Khởi tạo âm nhạc
function initializeMusic() {
    const music = document.getElementById('backgroundMusic');
    const musicControl = document.getElementById('musicControl');
    let isPlaying = false;

    musicControl.innerHTML = '<i class="fas fa-volume-up"></i><i class="fas fa-volume-mute"></i>';
    musicControl.classList.add('muted');

    musicControl.addEventListener('click', () => {
        if (isPlaying) {
            music.pause();
            musicControl.classList.add('muted');
        } else {
            music.play().catch(error => {
                console.log('🎵 Autoplay prevented:', error);
            });
            musicControl.classList.remove('muted');
        }
        isPlaying = !isPlaying;
    });

    document.addEventListener('DOMContentLoaded', () => {
        music.volume = 0.5;
        console.log('🎵 Music initialized');
    });
}

// Khởi tạo khi DOM đã load xong
document.addEventListener('DOMContentLoaded', initializeApp);