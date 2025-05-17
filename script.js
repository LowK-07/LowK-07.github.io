// Khởi tạo biến cho nhạc nền
const bgMusic = document.getElementById('bgMusic');
let isMusicPlaying = false;

// Hàm điều khiển nhạc
function toggleMusic() {
    if (isMusicPlaying) {
        bgMusic.pause();
        isMusicPlaying = false;
    } else {
        bgMusic.play();
        isMusicPlaying = true;
    }
}

// Tích hợp Google Sheets
function initGoogleSheets() {
    const sheetId = '1ADc7IZVjqqRGthwMc81oqkjsz-dl-7pXB5Lrzhk8mvA'; // Thay thế bằng ID Google Sheet của bạn
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit?usp=sharing`;
    document.getElementById('googleSheet').src = sheetUrl;
}

// Xử lý form ghi chép
document.getElementById('transactionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    // Thêm logic xử lý dữ liệu form ở đây
    // Có thể sử dụng Google Sheets API để cập nhật dữ liệu
});

// Khởi tạo trang
document.addEventListener('DOMContentLoaded', function() {
    initGoogleSheets();
});
