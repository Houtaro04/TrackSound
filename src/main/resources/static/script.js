// --- XỬ LÝ CAROUSEL ---
const carousel = document.getElementById('carousel');
let index = 1;
setInterval(() => {
    index = (index + 1) % 3;
    if (carousel) {
        carousel.style.transform = `translateX(-${index * 25}%)`;
    }
}, 6000);

// --- CẤU HÌNH VÀ XỬ LÝ FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyBKfbTKlSTuPgqVTEVQEvZ0XNZzTwu2AKw", // API Key của bạn
    authDomain: "tracksound-93a54.firebaseapp.com",
    projectId: "tracksound-93a54",
    storageBucket: "tracksound-93a54.firebasestorage.app",
    messagingSenderId: "867088273750",
    appId: "1:867088273750:web:3e630ac9a980b8040b46f7"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Lấy các nút bấm
const signInButton = document.getElementById('signInBtn');
const createAccountButton = document.getElementById('createAccountBtn');

// Hàm cập nhật giao diện khi người dùng đăng nhập (Đã sửa lại để căn hàng ngang)
function updateUIForLoggedInUser(user) {
    const headerRight = document.querySelector('.header__right');
    if (!headerRight) return;

    headerRight.innerHTML = ''; 

    // 1. Tạo nút Upload
    const uploadLink = document.createElement('a');
    uploadLink.href = '/upload';
    uploadLink.className = 'uploadButton';
    uploadLink.textContent = 'Upload';

    // 2. Tạo container cho User Profile
    const userProfile = document.createElement('div');
    userProfile.className = 'user-profile';

    // 3. Tạo Avatar
    const userAvatar = document.createElement('img');
    userAvatar.src = user.picture; 
    userAvatar.alt = user.name;
    userAvatar.className = 'user-avatar';
    
    // Gắn sự kiện click vào Avatar để bật/tắt menu
    userAvatar.addEventListener('click', (e) => {
        e.stopPropagation(); // Ngăn sự kiện nổi bọt để window không đóng nó ngay lập tức
        const menu = userProfile.querySelector('.dropdown-menu');
        menu.classList.toggle('active');
    });

    // 4. Tạo Dropdown Menu
    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'dropdown-menu';

    // Item 1: Hồ sơ
    const profileLink = document.createElement('a');
    profileLink.className = 'dropdown-item';
    profileLink.href = '/profile'; // Link đến trang hồ sơ
    profileLink.textContent = 'Hồ sơ';

    // Item 2: Đăng xuất
    const logoutBtn = document.createElement('div');
    logoutBtn.className = 'dropdown-item';
    logoutBtn.textContent = 'Đăng xuất';
    
    // Xử lý sự kiện Đăng xuất
    logoutBtn.addEventListener('click', () => {
        firebase.auth().signOut().then(() => {
            console.log('Đã đăng xuất thành công');
            window.location.reload(); // Tải lại trang để về trạng thái chưa đăng nhập
        }).catch((error) => {
            console.error('Lỗi đăng xuất:', error);
        });
    });

    // Ghép các phần tử vào menu
    dropdownMenu.appendChild(profileLink);
    dropdownMenu.appendChild(logoutBtn);

    // Ghép Avatar và Menu vào container User Profile
    userProfile.appendChild(userAvatar);
    userProfile.appendChild(dropdownMenu);

    // Thêm vào Header
    headerRight.appendChild(uploadLink);
    headerRight.appendChild(userProfile);
}

// Hàm xử lý đăng nhập bằng Google
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();

    try {
        // 1. Mở cửa sổ popup đăng nhập của Google
        const result = await auth.signInWithPopup(provider);
        
        // 2. Lấy ID Token từ kết quả đăng nhập
        const idToken = await result.user.getIdToken();

        console.log("Lấy ID Token thành công:", idToken);

        // 3. Gửi ID Token đến backend để xác thực và tạo/đăng nhập tài khoản
        const response = await fetch('/api/auth/google-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken: idToken }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error('Lỗi từ backend: ' + errorText);
        }

        // 4. Nhận thông tin người dùng từ backend và xử lý
        const userInfo = await response.json();
        console.log('Đăng nhập thành công! Thông tin người dùng:', userInfo);
        
        // 5. Chuyển hướng về trang chủ. Trang sẽ tự tải lại và cập nhật giao diện.
        window.location.href = '/api';

    } catch (error) {
        console.error("Lỗi trong quá trình đăng nhập:", error);
        alert("Đã có lỗi xảy ra, vui lòng xem console để biết chi tiết.");
    }
}

// Lắng nghe sự thay đổi trạng thái đăng nhập
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Người dùng đã đăng nhập. Lấy thông tin từ backend và cập nhật UI.
        console.log("Người dùng đã đăng nhập, đang cập nhật UI...");
        const idToken = await user.getIdToken();
        
        // Gọi API để lấy thông tin user (đảm bảo đồng bộ với backend)
        const response = await fetch('/api/auth/google-login', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ idToken })
        });
        if (response.ok) {
            const userInfo = await response.json();
            updateUIForLoggedInUser(userInfo);
        }
    } else {
        // Người dùng chưa đăng nhập. Gắn sự kiện cho các nút.
        if (signInButton && createAccountButton) {
            signInButton.addEventListener('click', signInWithGoogle);
            createAccountButton.addEventListener('click', signInWithGoogle);
        }
    }
});

// Xử lý đóng dropdown khi click ra ngoài
window.addEventListener('click', (e) => {
    // Nếu click không trúng vào user-profile thì ẩn mọi menu đang mở
    if (!e.target.closest('.user-profile')) {
        const dropdowns = document.querySelectorAll('.dropdown-menu.active');
        dropdowns.forEach(menu => {
            menu.classList.remove('active');
        });
    }
});

async function loadSongs() {
    try {
        // Gọi API Spring Boot của bạn
        // Lưu ý: Controller map là /tracks nên đường dẫn là localhost:8080/tracks
        const response = await fetch('http://localhost:8080/api/tracks'); 
        
        // 1. Nếu server báo lỗi hoặc không có nội dung (204) thì dừng luôn
        if (!response.ok || response.status === 204) {
             console.log("Chưa có bài hát nào trong database.");
             return; 
        }

        // 2. Chỉ chuyển sang JSON khi chắc chắn có dữ liệu
        const text = await response.text(); 
        if (!text) return; // Nếu body rỗng thì thôi
        
        const songs = JSON.parse(text);
        const trackList = document.querySelector('.badgeList');
        trackList.innerHTML = ''; // Xóa dữ liệu mẫu cũ

        // Duyệt qua danh sách và hiển thị
        songs.forEach(song => {
            // Giả sử model Track của bạn có các trường: title, artistName, coverUrl (hoặc imageUrl)
            // Nếu bạn chưa có link ảnh bìa, có thể dùng ảnh mặc định
            const imageSrc = song.coverUrl ? song.coverUrl : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop';
            
            const html = `
                <div class="badgeItem">
                  <img src="${imageSrc}" alt="${song.title}">
                  <div class="badgeItem__info">
                    <div class="badgeItem__title">${song.title}</div>
                    <div class="badgeItem__artist">${song.artistName}</div>
                  </div>
                </div>
            `;
            trackList.insertAdjacentHTML('beforeend', html);
        });
    } catch (error) {
        console.error("Lỗi:", error);
    }
}

// Gọi hàm ngay khi trang web chạy
loadSongs();

// --- XỬ LÝ TÌM KIẾM NHẠC ---

const searchForm = document.querySelector('.headerSearch');
const searchInput = document.querySelector('.headerSearch__input');
const trackListContainer = document.querySelector('.badgeList');

if (searchForm) {
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const keyword = searchInput.value;
        if (keyword.trim()) {
            await searchAndRender(keyword);
        }
    });
}

// --- 1. HÀM PHÁT NHẠC (MỚI) ---
function playNow(url, title, artist, image) {
    const playerBar = document.getElementById('musicPlayer');
    const playerImg = document.getElementById('playerImg');
    const playerTitle = document.getElementById('playerTitle');
    const playerArtist = document.getElementById('playerArtist');
    const mainAudio = document.getElementById('mainAudio');

    // Cập nhật thông tin lên thanh Player
    playerImg.src = image;
    playerTitle.textContent = title;
    playerArtist.textContent = artist;
    
    // Gán link nhạc và phát
    mainAudio.src = url;
    mainAudio.play();

    // Hiện thanh player lên (nếu đang ẩn)
    playerBar.classList.add('active');
}

// --- 2. SỬA HÀM RENDER (CẬP NHẬT) ---
async function searchAndRender(query) {
    try {
        trackListContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Đang tìm kiếm...</p>';

        const response = await fetch(`http://localhost:8080/api/rapid/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
             trackListContainer.innerHTML = '<p style="text-align:center">Lỗi kết nối.</p>';
             return;
        }

        const data = await response.json();
        trackListContainer.innerHTML = ''; 

        const tracks = data.results || [];

        if (tracks.length === 0) {
            trackListContainer.innerHTML = '<p style="text-align:center">Không tìm thấy bài hát nào.</p>';
            return;
        }

        tracks.forEach(track => {
            // Lấy dữ liệu
            const image = track.artworkUrl100 ? track.artworkUrl100.replace('100x100', '600x600') : 'https://via.placeholder.com/300';
            const title = track.trackName;
            const artist = track.artistName;
            const audioUrl = track.previewUrl; 

            // Xử lý chuỗi để tránh lỗi khi đưa vào onclick (ví dụ tên bài có dấu nháy đơn ')
            // Chúng ta dùng replace để thêm dấu gạch chéo trước dấu nháy đơn
            const safeTitle = title.replace(/'/g, "\\'");
            const safeArtist = artist.replace(/'/g, "\\'");

            // --- TẠO HTML VỚI SỰ KIỆN ONCLICK ---
            // Khi bấm vào nút "Play" (hoặc cả thẻ), nó gọi hàm playNow()
            const html = `
                <div class="badgeItem">
                  <div class="image-container" style="position:relative; cursor:pointer;" 
                       onclick="playNow('${audioUrl}', '${safeTitle}', '${safeArtist}', '${image}')">
                      <img src="${image}" alt="${title}">
                      <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); 
                                  background:#f50; width:50px; height:50px; border-radius:50%; 
                                  display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.3);">
                          <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                  </div>

                  <div class="badgeItem__info">
                    <div class="badgeItem__title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</div>
                    <div class="badgeItem__artist">${artist}</div>
                    
                    <button class="sc-button-cta" 
                       onclick="playNow('${audioUrl}', '${safeTitle}', '${safeArtist}', '${image}')"
                       style="display:block; width:100%; margin-top:10px; cursor:pointer;">
                       Phát Ngay
                    </button>
                  </div>
                </div>
            `;
            trackListContainer.insertAdjacentHTML('beforeend', html);
        });

    } catch (error) {
        console.error("Lỗi:", error);
        trackListContainer.innerHTML = '<p style="color:red; text-align:center">Có lỗi xảy ra.</p>';
    }
}