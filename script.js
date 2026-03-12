// ==========================================
// SCRIPT.JS - VERSI MINIMAL (TESTING)
// ==========================================
console.log('🚀 script.js mulai diload');

// Variabel global (HANYA YANG DIPERLUKAN)
let currentUser = JSON.parse(localStorage.getItem('cee_user')) || null;
let isLoginMode = true;

// ==========================================
// FUNGSI INIT
// ==========================================
function initApp() {
    console.log('✅ initApp() DIPANGGIL');
    updateNavbar();
    muatMenu();
    cekMobilePopup();
}

// ==========================================
// FUNGSI UPDATE NAVBAR
// ==========================================
function updateNavbar() {
    console.log('✅ updateNavbar() DIPANGGIL');
    const userDisplay = document.getElementById('user-display');
    if (!userDisplay) return;

    if (currentUser && currentUser.username) {
        userDisplay.innerHTML = `
            <div class="user-info-nav">
                <span>Halo, <b>${currentUser.username}</b></span>
                <button class="btn-login-nav" style="background:#ff4444;" onclick="logout()">Logout</button>
            </div>
        `;
    } else {
        userDisplay.innerHTML = `
            <button class="btn-login-nav" onclick="openLoginModal()">Daftar/Login</button>
        `;
    }
}

// ==========================================
// FUNGSI MENU
// ==========================================
async function muatMenu() {
    console.log('📢 muatMenu() DIMULAI');
    const container = document.getElementById('menu-container');
    console.log('📢 Container:', container);
    
    if (!container) {
        console.log('❌ Container tidak ditemukan');
        return;
    }

    try {
        console.log('📢 Fetching produk...');
        const response = await fetch('/.netlify/functions/get-produk');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📢 Data produk:', data);

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:50px;">Belum ada menu tersedia.</p>';
            return;
        }

        container.innerHTML = '';
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            card.onclick = () => openDetail(item);
            card.innerHTML = `
                <img src="${item.gambar_url}" alt="${item.nama}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                <div class="card-header-info">
                    <h3>${item.nama}</h3>
                    <span class="price">Rp ${Number(item.harga).toLocaleString('id-ID')}</span>
                </div>
            `;
            container.appendChild(card);
        });
        console.log('✅ Menu selesai dirender');
    } catch (e) {
        console.error('❌ Error loading menu:', e);
        container.innerHTML = '<p style="text-align:center; padding:50px; color:red;">Gagal memuat menu. Cek koneksi database.</p>';
    }
}

// ==========================================
// FUNGSI MODAL LOGIN (MINIMAL)
// ==========================================
function openLoginModal() {
    console.log('📢 openLoginModal() DIPANGGIL');
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.add('hidden');
}

function openDetail(produk) {
    console.log('📢 openDetail() DIPANGGIL', produk.nama);
    alert('Fitur detail akan segera hadir: ' + produk.nama);
}

// ==========================================
// FUNGSI LAINNYA (MINIMAL)
// ==========================================
function cekMobilePopup() {
    console.log('✅ cekMobilePopup() DIPANGGIL');
    // Kosongkan dulu untuk testing
}

function logout() { 
    localStorage.removeItem('cee_user'); 
    currentUser = null;
    updateNavbar();
}

function closePanel() { 
    console.log('closePanel');
}

function scrollToJajan() { 
    console.log('scrollToJajan');
}

// ==========================================
// CLICK OUTSIDE MODAL
// ==========================================
window.onclick = function(event) {
    const modal = document.getElementById('login-modal');
    if (event.target === modal) {
        closeModal();
    }
}

// ==========================================
// JALANKAN INISIALISASI
// ==========================================
console.log('📢 Menambahkan event listener...');
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
console.log('📢 script.js selesai diload');
