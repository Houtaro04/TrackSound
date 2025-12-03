console.log("Script đang khởi động... (Search: iTunes | Genre: Deezer Hybrid)");

// ==========================================
// 1. CẤU HÌNH & BIẾN TOÀN CỤC
// ==========================================
const carousel = document.getElementById('carousel');
let carouselIndex = 1;
let allTracks = []; 

/* CẤU HÌNH NGUỒN NHẠC CHO CÁC NÚT THỂ LOẠI
   - V-pop/K-pop: Dùng iTunes Top Charts (để không bị sai nhạc như Deezer)
   - Còn lại: Dùng Deezer Charts (vì Deezer phân loại Rock/Jazz/EDM rất tốt)
*/
const GENRE_CONFIG = {
    // --- NHẠC QUỐC TẾ (Dùng Deezer) ---
    'All':      { source: 'deezer', type: 'chart', id: 0 },
    'Tất cả':   { source: 'deezer', type: 'chart', id: 0 },
    'US-UK':    { source: 'deezer', type: 'playlist', id: 1282483245 }, 
    'Rock':     { source: 'deezer', type: 'chart', id: 152 },
    'Jazz':     { source: 'deezer', type: 'chart', id: 129 },
    'EDM':      { source: 'deezer', type: 'chart', id: 113 },
    'Rap / Hip-hop': { source: 'deezer', type: 'chart', id: 116 },
    'Lofi':     { source: 'deezer', type: 'search', query: 'lofi beats' },

    // --- NHẠC Á (Dùng iTunes Top Charts cho chuẩn) ---
    'V-pop':    { source: 'itunes_top', store: 'vn' }, 
    'K-pop':    { source: 'itunes_top', store: 'kr' } 
};

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
// 2. HÀM HỖ TRỢ GỌI API
// ==========================================

// Deezer JSONP (Dùng cho Thể loại)
function fetchDeezerJSONP(url) {
    return new Promise((resolve, reject) => {
        const callbackName = 'deezer_cb_' + Math.round(100000 * Math.random());
        window[callbackName] = function(data) {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(data);
        };
        const script = document.createElement('script');
        const separator = url.indexOf('?') >= 0 ? '&' : '?';
        script.src = url + separator + 'output=jsonp&callback=' + callbackName;
        script.onerror = (e) => {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(e);
        };
        document.body.appendChild(script);
    });
}

// iTunes Top Charts RSS (Dùng cho nút V-pop/K-pop)
async function fetchItunesTop(store = 'vn') {
    const url = `https://itunes.apple.com/${store}/rss/topsongs/limit=100/json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('iTunes Feed Error');
    return await res.json();
}

// ==========================================
// 3. GIAO DIỆN USER
// ==========================================
const signInButton = document.getElementById('signInBtn');
const createAccountButton = document.getElementById('createAccountBtn');

function updateUIForLoggedInUser(user) {
    const headerRight = document.querySelector('.header__right');
    if (!headerRight) return;
    headerRight.innerHTML = ''; 

    const uploadBtn = document.createElement('div');
    uploadBtn.className = 'uploadButton';
    uploadBtn.textContent = 'Upload';
    uploadBtn.style.cursor = 'pointer';
    
    uploadBtn.onclick = () => {
        const modal = document.getElementById('uploadModal');
        if (modal) modal.style.display = 'flex';
    };

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

auth.onAuthStateChanged(async (user) => {
    if (user) {
        const heroSection = document.querySelector('.frontHero');
        if (heroSection) heroSection.style.display = 'none';
        
        const idToken = await user.getIdToken();
        const response = await fetch('/api/auth/google-login', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ idToken })
        });
        if (response.ok) updateUIForLoggedInUser(await response.json());
    } else {
        const heroSection = document.querySelector('.frontHero');
        if (heroSection) heroSection.style.display = 'block';
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
// 4. LOGIC UPLOAD
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

if (modalCoverInput) {
    modalCoverInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            previewImage.src = URL.createObjectURL(file);
            previewImage.style.display = 'block';
        }
    });
}

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

if (confirmUploadBtn) {
    confirmUploadBtn.addEventListener('click', async () => {
        const audioFile = modalAudioInput.files[0];
        const coverFile = modalCoverInput.files[0];
        const title = uploadTitleInput.value.trim();

        if (!audioFile) { alert("Vui lòng chọn file nhạc!"); return; }
        const user = firebase.auth().currentUser;
        if (!user) { alert("Cần đăng nhập!"); return; }

        uploadModal.style.display = 'none';
        if(loadingScreen) loadingScreen.style.display = 'flex';

        const formData = new FormData();
        formData.append("file", audioFile);
        formData.append("title", title || audioFile.name);
        formData.append("artistId", user.uid);
        formData.append("artistName", user.displayName || "Unknown");
        if (coverFile) formData.append("coverImage", coverFile);

        try {
            const res = await fetch('http://localhost:8080/api/tracks/upload', {
                method: 'POST', body: formData
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
// 5. LOGIC CHUYỂN ĐỔI THỂ LOẠI (DÙNG GENRE CONFIG)
// ==========================================

async function switchGenre(genreName) {
    document.querySelectorAll('.genre-chip').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText === genreName) btn.classList.add('active');
    });

    const trackListContainer = document.querySelector('.badgeList');
    const config = GENRE_CONFIG[genreName] || GENRE_CONFIG['All'];
    const sourceName = config.source === 'itunes_top' ? 'Apple Music Top Charts' : 'Deezer';
    
    trackListContainer.innerHTML = `<p style="text-align:center; padding:40px; width:100%;">Đang tải nhạc ${genreName} từ ${sourceName}...</p>`;

    try {
        let tracks = [];

        // === NGUỒN ITUNES TOP CHARTS (Cho V-pop, K-pop) ===
        if (config.source === 'itunes_top') {
            const data = await fetchItunesTop(config.store);
            const entries = data.feed.entry || [];
            
            tracks = entries.map(entry => {
                const images = entry['im:image'];
                let imgUrl = images[images.length - 1].label;
                imgUrl = imgUrl.replace(/\/\d+x\d+bb/, "/600x600bb");

                return {
                    id: entry.id.attributes['im:id'],
                    title: entry['im:name'].label,
                    artistName: entry['im:artist'].label,
                    coverUrl: imgUrl,
                    fileUrl: entry.link[1].attributes.href,
                    artistId: 'itunes_artist'
                };
            });

        } 
        // === NGUỒN DEEZER (Cho nhạc Tây & Các thể loại còn lại) ===
        else {
            let deezerUrl = '';
            let limit = 200; 

            if (config.type === 'chart') {
                deezerUrl = `https://api.deezer.com/chart/${config.id}/tracks?limit=${limit}`;
            } else if (config.type === 'playlist') {
                deezerUrl = `https://api.deezer.com/playlist/${config.id}/tracks?limit=${limit}`;
            } else if (config.type === 'search') {
                deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(config.query)}&limit=${limit}`;
            }

            const data = await fetchDeezerJSONP(deezerUrl);
            let rawTracks = [];
            if (data.data) rawTracks = data.data;
            else if (data.tracks && data.tracks.data) rawTracks = data.tracks.data;

            tracks = rawTracks.map(t => ({
                id: t.id,
                title: t.title,
                artistName: t.artist ? t.artist.name : "Unknown",
                coverUrl: t.album ? (t.album.cover_xl || t.album.cover_medium) : 'https://via.placeholder.com/300',
                fileUrl: t.preview,
                artistId: 'deezer_artist'
            }));
        }

        renderGenreTracks(tracks);

    } catch (e) {
        console.error("Lỗi tải nhạc:", e);
        trackListContainer.innerHTML = '<p style="text-align:center; width:100%;">Lỗi kết nối. Vui lòng thử lại.</p>';
    }
}

// ==========================================
// 6. LOGIC TÌM KIẾM (DÙNG ITUNES SEARCH API)
// ==========================================

async function searchAndRender(query) {
    const trackListContainer = document.querySelector('.badgeList');
    // Bỏ active của các nút thể loại
    document.querySelectorAll('.genre-chip').forEach(btn => btn.classList.remove('active'));
    trackListContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Đang tìm kiếm trong kho nhạc và iTunes...</p>';

    const lowerQuery = query.toLowerCase();

    try {
        // --- BƯỚC 1: TÌM TRONG LOCAL (Nhạc bạn Upload) ---
        const localPromise = fetch('http://localhost:8080/api/tracks').then(async res => {
            if (!res.ok) return [];
            const allLocal = await res.json();
            
            // Lọc nhạc Local
            return allLocal.filter(t => {
                const titleMatch = t.title && t.title.toLowerCase().includes(lowerQuery);
                const artistMatch = t.artistName && t.artistName.toLowerCase().includes(lowerQuery);
                return titleMatch || artistMatch;
            }).map(t => ({
                id: t.id,
                title: t.title,
                artistName: t.artistName || "Unknown",
                coverUrl: t.coverUrl || 'https://via.placeholder.com/300',
                fileUrl: t.fileUrl,
                artistId: t.artistId 
            }));
        }).catch(e => {
            console.error("Lỗi tìm kiếm Local:", e);
            return [];
        });

        // --- BƯỚC 2: TÌM TRÊN ITUNES API (Thay vì Deezer) ---
        // iTunes Search API rất mạnh khoản tìm tiếng Việt và tên nghệ sĩ
        const itunesPromise = fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=50&media=music&entity=song`)
            .then(res => res.json())
            .then(data => {
                return (data.results || []).map(t => ({
                    id: t.trackId,
                    title: t.trackName,
                    artistName: t.artistName,
                    // Hack lấy ảnh chất lượng cao 600x600 từ link 100x100
                    coverUrl: t.artworkUrl100 ? t.artworkUrl100.replace('100x100', '600x600') : 'https://via.placeholder.com/300',
                    fileUrl: t.previewUrl,
                    artistId: 'itunes_artist'
                }));
            })
            .catch(e => {
                console.error("Lỗi tìm kiếm iTunes:", e);
                return [];
            });

        // --- BƯỚC 3: GỘP KẾT QUẢ (LOCAL LÊN TRƯỚC) ---
        const [localTracks, itunesTracks] = await Promise.all([localPromise, itunesPromise]);
        
        const combinedTracks = [...localTracks, ...itunesTracks];

        if (combinedTracks.length === 0) {
            trackListContainer.innerHTML = `<p style="text-align:center; padding:20px;">Không tìm thấy bài hát nào cho từ khóa "${query}".</p>`;
        } else {
            renderGenreTracks(combinedTracks);
        }

    } catch (error) {
        console.error("Lỗi hệ thống tìm kiếm:", error);
        trackListContainer.innerHTML = '<p style="color:red; text-align:center">Có lỗi xảy ra khi tìm kiếm.</p>';
    }
}

// ==========================================
// 7. RENDER & PLAYER
// ==========================================

function renderGenreTracks(tracks) {
    const trackListContainer = document.querySelector('.badgeList');
    trackListContainer.innerHTML = ''; 

    if (!tracks || tracks.length === 0) {
        trackListContainer.innerHTML = '<p style="text-align:center; width:100%;">Không tìm thấy bài hát nào.</p>';
        return;
    }

    allTracks = tracks; 
    
    tracks.forEach(track => {
        let image = track.coverUrl;
        let title = track.title;
        let artist = track.artistName;
        let audioUrl = track.fileUrl;
        
        let isOwner = false;
        // Kiểm tra quyền (chỉ áp dụng cho nhạc Local)
        if (firebase.auth().currentUser && track.artistId !== 'deezer_artist' && track.artistId !== 'itunes_artist') {
            isOwner = (track.artistId === firebase.auth().currentUser.uid);
        }

        const sTitle = title ? title.replace(/'/g, "\\'") : "";
        const sArtist = artist ? artist.replace(/'/g, "\\'") : "";

        let optionsHTML = '';
        if (isOwner) {
             optionsHTML = `
                <div class="track-options">
                    <button class="track-options-btn" onclick="event.stopPropagation(); toggleTrackMenu('${track.id}')">⋮</button>
                    <div id="menu-${track.id}" class="track-options-menu">
                        <div class="track-options-item" onclick="event.stopPropagation(); requestEditTitle('${track.id}', '${sTitle}')">✎ Sửa tên</div>
                        <div class="track-options-item" onclick="event.stopPropagation(); requestDeleteTrack('${track.id}')" style="color:red;">🗑 Xóa nhạc</div>
                    </div>
                </div>`;
        }

        const html = `
            <div class="badgeItem" style="position: relative;">
              ${optionsHTML}
              <div class="image-container" onclick="playNow('${audioUrl}', '${sTitle}', '${sArtist}', '${image}')" style="position:relative; cursor:pointer;">
                  <img src="${image}" alt="${title}" onerror="this.src='https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300'">
                  <div class="play-overlay" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:#f50; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.3);">
                      <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
              </div>
              <div class="badgeItem__info">
                <div class="badgeItem__title" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${title}">${title}</div>
                <div class="badgeItem__artist" style="${isOwner ? 'color:orangered; font-weight:bold' : ''}">
                    ${artist} ${isOwner ? '(Tôi)' : ''}
                </div>
                <button class="sc-button-cta sc-button-loadmore" onclick="playNow('${audioUrl}', '${sTitle}', '${sArtist}', '${image}')" style="display:block; width:100%; margin-top:10px; padding:8px;">Phát Ngay</button>
              </div>
            </div>`;
        
        trackListContainer.insertAdjacentHTML('beforeend', html);
    });
}

function playNow(url, title, artist, image) {
    if (!checkAuthAndRedirect()) return;
    
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
        
        const normalized = myTracks.map(t => ({
            id: t.id,
            title: t.title,
            artistName: t.artistName,
            coverUrl: t.coverUrl,
            fileUrl: t.fileUrl,
            artistId: t.artistId
        }));

        renderGenreTracks(normalized); 
        
    } catch (e) { console.error(e); }
}

// ==========================================
// 8. TIỆN ÍCH & KHỞI TẠO
// ==========================================

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
            loadMyProfile(user); 
        } else {
            const txt = await response.text();
            alert("Lỗi khi xóa: " + txt);
        }
    } catch (error) { console.error("Lỗi xóa:", error); alert("Lỗi kết nối đến server."); }
}

async function requestEditTitle(trackId, oldTitle) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const newTitle = prompt("Nhập tên mới cho bài hát:", oldTitle);
    
    if (newTitle && newTitle.trim() !== "" && newTitle !== oldTitle) {
        try {
            const response = await fetch(`http://localhost:8080/api/tracks/${trackId}?artistId=${user.uid}&newTitle=${encodeURIComponent(newTitle)}`, {
                method: 'PUT'
            });
            if (response.ok) {
                alert("Đổi tên thành công!");
                loadMyProfile(user); 
            } else {
                alert("Lỗi đổi tên: " + await response.text());
            }
        } catch (e) { console.error(e); alert("Lỗi mạng."); }
    }
}

function checkAuthAndRedirect() {
    const user = firebase.auth().currentUser;
    if (!user) {
        signInWithGoogle(); 
        return false;
    }
    return true;
}

const sForm = document.querySelector('.headerSearch');
if(sForm) sForm.addEventListener('submit', (e) => { 
    e.preventDefault(); 
    if (!checkAuthAndRedirect()) return;
    const v = document.querySelector('.headerSearch__input').value; 
    if(v.trim()) searchAndRender(v); 
});

const staticUploadBtn = document.querySelector('a.uploadButton');
if (staticUploadBtn) {
    staticUploadBtn.addEventListener('click', (e) => {
        e.preventDefault(); 
        if (checkAuthAndRedirect()) {
            const modal = document.getElementById('uploadModal');
            if (modal) modal.style.display = 'flex';
        }
    });
}

function toggleTrackMenu(trackId) {
    document.querySelectorAll('.track-options-menu').forEach(menu => {
        if (menu.id !== `menu-${trackId}`) menu.classList.remove('show');
    });
    const menu = document.getElementById(`menu-${trackId}`);
    if (menu) menu.classList.toggle('show');
}
window.addEventListener('click', () => {
    document.querySelectorAll('.track-options-menu').forEach(menu => menu.classList.remove('show'));
});

const closePlayerBtn = document.getElementById('closePlayerBtn');
if (closePlayerBtn) {
    closePlayerBtn.addEventListener('click', () => {
        const mainAudioPlayer = document.getElementById('mainAudio');
        if (mainAudioPlayer) {
            mainAudioPlayer.pause();
            mainAudioPlayer.currentTime = 0;
        }
        const musicPlayerBar = document.getElementById('musicPlayer');
        if (musicPlayerBar) musicPlayerBar.classList.remove('active');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const heroButtons = document.querySelectorAll('.frontHero .sc-button');
    heroButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (checkAuthAndRedirect()) {
                if (btn.textContent.includes('Upload')) {
                    const modal = document.getElementById('uploadModal');
                    if (modal) modal.style.display = 'flex';
                } else {
                    document.querySelector('.trendingTracks').scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // MẶC ĐỊNH: Load "Tất cả" (Deezer Chart)
    switchGenre('All');
});