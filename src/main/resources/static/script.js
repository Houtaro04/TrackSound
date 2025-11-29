console.log("Script đang khởi động...");

// ==========================================
// 1. CẤU HÌNH & BIẾN TOÀN CỤC
// ==========================================
const carousel = document.getElementById('carousel');
let carouselIndex = 1;
let allTracks = [];       
let currentIndex = 0;      
const ITEMS_PER_PAGE = 12; 

// Carousel tự động chạy
if (carousel) {
    setInterval(() => {
        carouselIndex = (carouselIndex + 1) % 3;
        carousel.style.transform = `translateX(-${carouselIndex * 25}%)`;
    }, 6000);
}

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBKfbTKlSTuPgqVTEVQEvZ0XNZzTwu2AKw", 
    authDomain: "tracksound-93a54.firebaseapp.com",
    projectId: "tracksound-93a54",
    storageBucket: "tracksound-93a54.firebasestorage.app",
    messagingSenderId: "867088273750",
    appId: "1:867088273750:web:3e630ac9a980b8040b46f7"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ==========================================
// 2. GIAO DIỆN USER
// ==========================================
const signInButton = document.getElementById('signInBtn');
const createAccountButton = document.getElementById('createAccountBtn');

function updateUIForLoggedInUser(user) {
    const headerRight = document.querySelector('.header__right');
    if (!headerRight) return;
    headerRight.innerHTML = ''; 

    // Nút Upload
    const uploadBtn = document.createElement('div');
    uploadBtn.className = 'uploadButton';
    uploadBtn.textContent = 'Upload';
    uploadBtn.style.cursor = 'pointer';
    
    uploadBtn.onclick = () => {
        const modal = document.getElementById('uploadModal');
        if (modal) modal.style.display = 'flex';
    };

    // User Profile
    const userProfile = document.createElement('div');
    userProfile.className = 'user-profile';
    const userAvatar = document.createElement('img');
    userAvatar.src = user.picture || 'https://via.placeholder.com/150'; 
    userAvatar.className = 'user-avatar';
    
    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'dropdown-menu';

    const profileBtn = createMenuItem('Hồ sơ của tôi', () => {
        loadMyProfile(user); 
        dropdownMenu.classList.remove('active');
    });

    const logoutBtn = createMenuItem('Đăng xuất', () => {
        firebase.auth().signOut().then(() => window.location.reload());
    });

    dropdownMenu.appendChild(profileBtn);
    dropdownMenu.appendChild(logoutBtn);
    userProfile.appendChild(userAvatar);
    userProfile.appendChild(dropdownMenu);
    headerRight.appendChild(uploadBtn);
    headerRight.appendChild(userProfile);

    userAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('active');
    });
}

function createMenuItem(text, onClick) {
    const item = document.createElement('div');
    item.textContent = text;
    item.style.padding = '10px';
    item.style.cursor = 'pointer';
    item.style.borderBottom = '1px solid #eee';
    item.onclick = onClick;
    return item;
}

// Auth Listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/auth/google-login', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ idToken })
        });
        if (response.ok) updateUIForLoggedInUser(await response.json());
    } else {
        if (signInButton) signInButton.addEventListener('click', signInWithGoogle);
        if (createAccountButton) createAccountButton.addEventListener('click', signInWithGoogle);
    }
});

async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
        const idToken = await result.user.getIdToken();
        const response = await fetch('/api/auth/google-login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken })
        });
        if (response.ok) window.location.href = '/api';
    } catch (error) { console.error(error); }
}

window.onclick = (e) => {
    if (!e.target.closest('.user-profile')) {
        document.querySelectorAll('.dropdown-menu.active').forEach(m => m.classList.remove('active'));
    }
};

// ==========================================
// 3. LOGIC UPLOAD FILE
// ==========================================
const modalAudioInput = document.getElementById('modalAudioInput'); 
const modalCoverInput = document.getElementById('modalCoverInput'); 
const uploadTitleInput = document.getElementById('uploadTitle');
const previewAudio = document.getElementById('previewAudio');
const previewImage = document.getElementById('previewImage');
const confirmUploadBtn = document.getElementById('confirmUploadBtn');
const cancelUploadBtn = document.getElementById('cancelUploadBtn');
const uploadModal = document.getElementById('uploadModal');
const loadingScreen = document.getElementById('uploadLoading');

// A. Chọn nhạc -> Hiện nghe thử
if (modalAudioInput) {
    modalAudioInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if(uploadTitleInput.value === "") {
                uploadTitleInput.value = file.name.replace(/\.[^/.]+$/, "");
            }
            previewAudio.src = URL.createObjectURL(file);
            previewAudio.style.display = 'block';
        }
    });
}

// B. Chọn ảnh -> Hiện xem trước
if (modalCoverInput) {
    modalCoverInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            previewImage.src = URL.createObjectURL(file);
            previewImage.style.display = 'block';
        }
    });
}

// C. Nút Hủy
if (cancelUploadBtn) {
    cancelUploadBtn.addEventListener('click', () => {
        uploadModal.style.display = 'none';
        modalAudioInput.value = '';
        modalCoverInput.value = '';
        uploadTitleInput.value = '';
        previewAudio.style.display = 'none';
        previewImage.style.display = 'none';
    });
}

// D. Nút XÁC NHẬN
if (confirmUploadBtn) {
    confirmUploadBtn.addEventListener('click', async () => {
        const audioFile = modalAudioInput.files[0];
        const coverFile = modalCoverInput.files[0];
        const title = uploadTitleInput.value.trim();

        if (!audioFile) {
            alert("Vui lòng chọn file nhạc!"); return;
        }

        const user = firebase.auth().currentUser;
        if (!user) { alert("Cần đăng nhập!"); return; }

        uploadModal.style.display = 'none';
        if(loadingScreen) loadingScreen.style.display = 'flex';

        const formData = new FormData();
        formData.append("file", audioFile);
        formData.append("title", title || audioFile.name);
        formData.append("artistId", user.uid);
        formData.append("artistName", user.displayName || "Unknown");
        if (coverFile) {
            formData.append("coverImage", coverFile);
        }

        try {
            const res = await fetch('http://localhost:8080/api/tracks/upload', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                alert("Tải lên thành công!");
                loadMyProfile(user); 
            } else {
                const txt = await res.text();
                alert("Lỗi: " + txt);
            }
        } catch (e) {
            console.error("Lỗi mạng:", e);
            alert("Lỗi mạng: Không kết nối được server.");
        } finally {
            if(loadingScreen) loadingScreen.style.display = 'none';
            modalAudioInput.value = '';
            modalCoverInput.value = '';
            uploadTitleInput.value = '';
            previewAudio.style.display = 'none';
            previewImage.style.display = 'none';
        }
    });
}

// ==========================================
// 4. PLAYER & HIỂN THỊ LIST NHẠC (ĐÃ SỬA LỖI ĐỎ)
// ==========================================
function playNow(url, title, artist, image) {
    // Sửa lỗi: Kiểm tra xem các phần tử có tồn tại không trước khi gán
    const playerBar = document.getElementById('musicPlayer');
    const pImg = document.getElementById('playerImg');
    const pTitle = document.getElementById('playerTitle');
    const pArtist = document.getElementById('playerArtist');
    const audio = document.getElementById('mainAudio');

    if (pImg) pImg.src = image;
    if (pTitle) pTitle.textContent = title;
    if (pArtist) pArtist.textContent = artist;
    
    if (audio) {
        audio.src = url;
        audio.play().catch(e => console.log("Chưa thể tự phát nhạc: ", e));
    }
    if (playerBar) playerBar.classList.add('active');
}

function renderTrackList(tracks) {
    const trackListContainer = document.querySelector('.badgeList');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    trackListContainer.innerHTML = ''; 
    allTracks = tracks || [];
    currentIndex = 0;

    if (allTracks.length === 0) {
        trackListContainer.innerHTML = '<p style="text-align:center">Không tìm thấy bài hát nào.</p>';
        if(loadMoreContainer) loadMoreContainer.style.display = 'none';
        return;
    }
    showMoreSongs();
}

function showMoreSongs() {
    const trackListContainer = document.querySelector('.badgeList');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const nextBatch = allTracks.slice(currentIndex, currentIndex + ITEMS_PER_PAGE);

    nextBatch.forEach(track => {
        let image = track.coverUrl || (track.artworkUrl100 ? track.artworkUrl100.replace('100x100', '600x600') : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300');
        let title = track.title || track.trackName;
        let artist = track.artistName;
        let audioUrl = track.fileUrl || track.previewUrl;
        
        // Kiểm tra xem bài hát có phải của mình không
        let isOwner = false;
        if (firebase.auth().currentUser && track.artistId) {
            isOwner = (track.artistId === firebase.auth().currentUser.uid);
        }

        const sTitle = title ? title.replace(/'/g, "\\'") : "";
        const sArtist = artist ? artist.replace(/'/g, "\\'") : "";

        // Nút Xóa (Chỉ hiện nếu là chủ sở hữu)
        let deleteBtnHTML = '';
        if (isOwner) {
            deleteBtnHTML = `
                <button onclick="event.stopPropagation(); requestDeleteTrack('${track.id}')" 
                        style="background: white; border: 1px solid red; color: red; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 5px;">
                    Xóa
                </button>
            `;
        }

        const html = `
            <div class="badgeItem">
              <div class="image-container" onclick="playNow('${audioUrl}', '${sTitle}', '${sArtist}', '${image}')" style="position:relative; cursor:pointer;">
                  <img src="${image}" alt="${title}" onerror="this.src='https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300'">
                  <div class="play-overlay" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:#f50; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.3);">
                      <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
              </div>
              <div class="badgeItem__info">
                <div class="badgeItem__title" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</div>
                <div class="badgeItem__artist" style="${isOwner ? 'color:orangered; font-weight:bold' : ''}">
                    ${artist} ${isOwner ? '(Tôi)' : ''}
                </div>
                
                <button class="sc-button-cta sc-button-loadmore" onclick="playNow('${audioUrl}', '${sTitle}', '${sArtist}', '${image}')" style="display:block; width:100%; margin-top:10px; padding:8px;">Phát Ngay</button>
                
                ${deleteBtnHTML} </div>
            </div>`;
        trackListContainer.insertAdjacentHTML('beforeend', html);
    });

    currentIndex += nextBatch.length;
    if (loadMoreContainer) loadMoreContainer.style.display = (currentIndex >= allTracks.length) ? 'none' : 'block';
}

// --- HÀM XỬ LÝ XÓA BÀI HÁT (MỚI) ---
async function requestDeleteTrack(trackId) {
    if (!confirm("Bạn có chắc chắn muốn xóa bài hát này không?")) return;

    const user = firebase.auth().currentUser;
    if (!user) { alert("Vui lòng đăng nhập lại."); return; }

    try {
        const response = await fetch(`http://localhost:8080/api/tracks/${trackId}?artistId=${user.uid}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert("Đã xóa bài hát!");
            loadMyProfile(user); // Tải lại danh sách
        } else {
            const txt = await response.text();
            alert("Lỗi khi xóa: " + txt);
        }
    } catch (error) {
        console.error("Lỗi xóa:", error);
        alert("Lỗi kết nối đến server.");
    }
}

// ==========================================
// 5. FETCH DATA
// ==========================================
async function searchAndRender(query) {
    const container = document.querySelector('.badgeList');
    container.innerHTML = '<p style="text-align:center; padding:20px;">Đang tìm...</p>';
    try {
        const res = await fetch(`http://localhost:8080/api/rapid/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        renderTrackList(data.results);
    } catch (e) { console.error(e); container.innerHTML='<p>Lỗi.</p>'; }
}

async function loadTrending() {
    document.querySelector('.trendingTracks').scrollIntoView({behavior:'smooth'});
    const container = document.querySelector('.badgeList');
    container.innerHTML = '<p style="text-align:center; padding:20px;">Loading Trending...</p>';
    try {
        const res = await fetch('http://localhost:8080/api/rapid/trending');
        const data = await res.json();
        renderTrackList(data.results);
    } catch (e) { console.error(e); }
}

async function loadSongs() {
    try {
        const res = await fetch('http://localhost:8080/api/tracks');
        if (!res.ok || res.status === 204) return;
        const text = await res.text();
        if (text) renderTrackList(JSON.parse(text));
    } catch (e) { console.error(e); }
}
loadSongs();

async function loadMyProfile(user) {
    document.querySelector('.frontHero').style.display = 'none';
    const title = document.querySelector('.trendingTracks__title');
    if(title) { title.textContent = `Hồ sơ của: ${user.name}`; title.style.textAlign = 'center'; }
    const container = document.querySelector('.badgeList');
    container.innerHTML = '<p style="text-align:center; padding:20px;">Loading Profile...</p>';
    try {
        const res = await fetch(`http://localhost:8080/api/tracks/artist/${user.uid}`);
        if(!res.ok) { container.innerHTML='<p>Chưa có bài nào.</p>'; return; }
        const myTracks = await res.json();
        renderTrackList(myTracks);
    } catch (e) { console.error(e); }
}

const sForm = document.querySelector('.headerSearch');
if(sForm) sForm.addEventListener('submit', (e) => { e.preventDefault(); const v=document.querySelector('.headerSearch__input').value; if(v.trim()) searchAndRender(v); });