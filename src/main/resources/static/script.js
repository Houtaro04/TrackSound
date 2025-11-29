// --- XỬ LÝ CAROUSEL ---
const carousel = document.getElementById('carousel');
let index = 1;
setInterval(() => {
    index = (index + 1) % 3;
    if (carousel) {
        carousel.style.transform = `translateX(-${index * 25}%)`;
    }
}, 6000);

// --- BIẾN TOÀN CỤC ĐỂ QUẢN LÝ PHÂN TRANG (MỚI THÊM) ---
let allTracks = [];        // Chứa danh sách tất cả bài hát tải về
let currentIndex = 0;      // Đánh dấu đang hiển thị đến bài nào
const ITEMS_PER_PAGE = 12; // Số bài hiển thị mỗi lần

// --- CẤU HÌNH VÀ XỬ LÝ FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyBKfbTKlSTuPgqVTEVQEvZ0XNZzTwu2AKw", 
    authDomain: "tracksound-93a54.firebaseapp.com",
    projectId: "tracksound-93a54",
    storageBucket: "tracksound-93a54.firebasestorage.app",
    messagingSenderId: "867088273750",
    appId: "1:867088273750:web:3e630ac9a980b8040b46f7"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const signInButton = document.getElementById('signInBtn');
const createAccountButton = document.getElementById('createAccountBtn');

// Hàm cập nhật giao diện khi người dùng đăng nhập
function updateUIForLoggedInUser(user) {
    const headerRight = document.querySelector('.header__right');
    if (!headerRight) return;

    headerRight.innerHTML = ''; 

    const uploadLink = document.createElement('a');
    uploadLink.href = '/upload';
    uploadLink.className = 'uploadButton';
    uploadLink.textContent = 'Upload';

    const userProfile = document.createElement('div');
    userProfile.className = 'user-profile';

    const userAvatar = document.createElement('img');
    userAvatar.src = user.picture; 
    userAvatar.alt = user.name;
    userAvatar.className = 'user-avatar';
    
    userAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = userProfile.querySelector('.dropdown-menu');
        if(menu) menu.classList.toggle('active');
    });

    // Dropdown Menu
    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'dropdown-menu'; // Lưu ý: Bạn cần CSS cho class này như bài trước đã làm

    // Tạo các item menu (ví dụ đơn giản)
    const logoutBtn = document.createElement('div');
    logoutBtn.textContent = 'Đăng xuất';
    logoutBtn.style.padding = '10px';
    logoutBtn.style.cursor = 'pointer';
    
    logoutBtn.addEventListener('click', () => {
        firebase.auth().signOut().then(() => {
            window.location.reload();
        });
    });

    dropdownMenu.appendChild(logoutBtn);
    userProfile.appendChild(userAvatar);
    userProfile.appendChild(dropdownMenu); // Nhớ thêm CSS cho dropdown-menu ẩn hiện

    headerRight.appendChild(uploadLink);
    headerRight.appendChild(userProfile);
}

// Hàm đăng nhập Google
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
        const idToken = await result.user.getIdToken();
        
        const response = await fetch('/api/auth/google-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: idToken }),
        });

        if (!response.ok) throw new Error('Lỗi backend');
        const userInfo = await response.json();
        window.location.href = '/api';
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
    }
}

auth.onAuthStateChanged(async (user) => {
    if (user) {
        const idToken = await user.getIdToken();
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
        if (signInButton) signInButton.addEventListener('click', signInWithGoogle);
        if (createAccountButton) createAccountButton.addEventListener('click', signInWithGoogle);
    }
});

// --- HÀM LOAD SONGS TỪ DATABASE CỦA BẠN ---
async function loadSongs() {
    try {
        const response = await fetch('http://localhost:8080/api/tracks'); 
        if (!response.ok || response.status === 204) return;

        const text = await response.text(); 
        if (!text) return; 
        
        const songs = JSON.parse(text);
        const trackList = document.querySelector('.badgeList');
        // Ẩn nút xem thêm nếu đang load nhạc từ DB (vì chưa làm phân trang cho DB)
        const loadMoreBtn = document.getElementById('loadMoreContainer');
        if(loadMoreBtn) loadMoreBtn.style.display = 'none';

        trackList.innerHTML = ''; 

        songs.forEach(song => {
            const imageSrc = song.coverUrl ? song.coverUrl : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop';
            // Dùng hàm playNow để phát nhạc
            const safeTitle = song.title ? song.title.replace(/'/g, "\\'") : "";
            const safeArtist = song.artistName ? song.artistName.replace(/'/g, "\\'") : "";
            
            const html = `
                <div class="badgeItem">
                  <div class="image-container" style="position:relative; cursor:pointer;" 
                       onclick="playNow('${song.fileUrl}', '${safeTitle}', '${safeArtist}', '${imageSrc}')">
                      <img src="${imageSrc}" alt="${song.title}">
                      <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); 
                                  background:#f50; width:50px; height:50px; border-radius:50%; 
                                  display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.3);">
                          <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                  </div>
                  <div class="badgeItem__info">
                    <div class="badgeItem__title">${song.title}</div>
                    <div class="badgeItem__artist">${song.artistName}</div>
                  </div>
                </div>
            `;
            trackList.insertAdjacentHTML('beforeend', html);
        });
    } catch (error) {
        console.error("Lỗi loadSongs:", error);
    }
}

loadSongs(); // Gọi khi tải trang

// --- HÀM PHÁT NHẠC ---
function playNow(url, title, artist, image) {
    const playerBar = document.getElementById('musicPlayer');
    const playerImg = document.getElementById('playerImg');
    const playerTitle = document.getElementById('playerTitle');
    const playerArtist = document.getElementById('playerArtist');
    const mainAudio = document.getElementById('mainAudio');

    if(playerImg) playerImg.src = image;
    if(playerTitle) playerTitle.textContent = title;
    if(playerArtist) playerArtist.textContent = artist;
    
    if(mainAudio) {
        mainAudio.src = url;
        mainAudio.play();
    }
    if(playerBar) playerBar.classList.add('active');
}

// --- 1. HÀM CHUẨN BỊ DỮ LIỆU & RESET (THAY THẾ renderTrackList CŨ) ---
function renderTrackList(tracks) {
    const trackListContainer = document.querySelector('.badgeList');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    
    // Reset lại mọi thứ khi có kết quả tìm kiếm mới
    trackListContainer.innerHTML = ''; 
    allTracks = tracks || [];
    currentIndex = 0;

    if (allTracks.length === 0) {
        trackListContainer.innerHTML = '<p style="text-align:center">Không tìm thấy bài hát nào.</p>';
        if(loadMoreContainer) loadMoreContainer.style.display = 'none';
        return;
    }

    // Gọi hàm hiển thị lô đầu tiên
    showMoreSongs();
}

// --- 2. HÀM HIỂN THỊ THÊM (MỚI) ---
function showMoreSongs() {
    const trackListContainer = document.querySelector('.badgeList');
    const loadMoreContainer = document.getElementById('loadMoreContainer');

    // Lấy ra các bài hát tiếp theo (12 bài)
    const nextBatch = allTracks.slice(currentIndex, currentIndex + ITEMS_PER_PAGE);

    nextBatch.forEach(track => {
        // Xử lý dữ liệu từ iTunes
        const image = track.artworkUrl100 ? track.artworkUrl100.replace('100x100', '600x600') : 'https://via.placeholder.com/300';
        const title = track.trackName;
        const artist = track.artistName;
        const audioUrl = track.previewUrl; 

        const safeTitle = title ? title.replace(/'/g, "\\'") : "";
        const safeArtist = artist ? artist.replace(/'/g, "\\'") : "";

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

    // Cập nhật vị trí
    currentIndex += nextBatch.length;

    // Ẩn/Hiện nút Xem thêm
    if (loadMoreContainer) {
        if (currentIndex >= allTracks.length) {
            loadMoreContainer.style.display = 'none';
        } else {
            loadMoreContainer.style.display = 'block';
        }
    }
}

// --- TÌM KIẾM ---
async function searchAndRender(query) {
    const trackListContainer = document.querySelector('.badgeList');
    try {
        trackListContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Đang tìm kiếm...</p>';
        // Ẩn nút xem thêm trong lúc tìm
        const btn = document.getElementById('loadMoreContainer');
        if(btn) btn.style.display = 'none';

        const response = await fetch(`http://localhost:8080/api/rapid/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        renderTrackList(data.results);
    } catch (error) {
        console.error("Lỗi:", error);
        trackListContainer.innerHTML = '<p style="color:red; text-align:center">Có lỗi xảy ra.</p>';
    }
}

const searchForm = document.querySelector('.headerSearch');
const searchInput = document.querySelector('.headerSearch__input');

if (searchForm) {
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const keyword = searchInput.value;
        if (keyword.trim()) await searchAndRender(keyword);
    });
}

// --- LOAD TRENDING ---
async function loadTrending() {
    const trackListContainer = document.querySelector('.badgeList');
    try {
        document.querySelector('.trendingTracks').scrollIntoView({ behavior: 'smooth' });
        trackListContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Đang tải danh sách Trending...</p>';
        
        const response = await fetch('http://localhost:8080/api/rapid/trending');
        const data = await response.json();
        
        renderTrackList(data.results);
    } catch (error) {
        console.error("Lỗi Trending:", error);
        trackListContainer.innerHTML = '<p style="color:red; text-align:center">Lỗi tải Trending.</p>';
    }
}