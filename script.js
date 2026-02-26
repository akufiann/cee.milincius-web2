// ==========================================
// 1. PENGATURAN CACHE & VERSI (AGAR GAK ERROR)
// ==========================================
const VERSION = "1.2"; 
if (localStorage.getItem('app_version') !== VERSION) {
    localStorage.clear();
    localStorage.setItem('app_version', VERSION);
}

let currentUser = JSON.parse(localStorage.getItem('cee_user')) || null;

// ==========================================
// 2. INISIALISASI SAAT WEB DIBUKA
// ==========================================
function initApp() {
    updateNavbar();
    muatMenu();
    cekMobilePopup(); // <-- Ini fungsi buat munculin pop-up di HP
}

// ==========================================
// 3. LOGIKA POP-UP ASIDE (KHUSUS HP)
// ==========================================
function cekMobilePopup() {
    // Fungsi ini mengecek: Apakah layar user adalah layar HP?
    if (window.innerWidth <= 768) {
        const aside = document.getElementById('aside-info');
        const overlay = document.getElementById('aside-overlay');
        
        if (aside && overlay) {
            // Memberikan class 'show-popup' agar Aside muncul di tengah (cek CSS kamu)
            aside.classList.add('show-popup');
            overlay.classList.add('active');
        }
    }
}

// Fungsi untuk menutup pop-up saat tombol silang atau area gelap diklik
function closeAsidePopup() {
    const aside = document.getElementById('aside-info');
    const overlay = document.getElementById('aside-overlay');
    
    if (aside && overlay) {
        aside.classList.remove('show-popup');
        overlay.classList.remove('active');
    }
}

// ==========================================
// 4. LOGIKA MENU & DETAIL PRODUK
// ==========================================
async function muatMenu() {
    const container = document.getElementById('menu-container');
    try {
        const response = await fetch('/.netlify/functions/get-produk'); 
        const data = await response.json();
        
        container.innerHTML = '';
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            card.onclick = () => openDetail(item);
            card.innerHTML = `
                <img src="${item.gambar_url}" alt="${item.nama}">
                <div class="card-header-info">
                    <h3>${item.nama}</h3>
                    <span class="price">Rp ${Number(item.harga).toLocaleString('id-ID')}</span>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = '<p>Gagal memuat menu. Cek koneksi database.</p>';
    }
}

function openDetail(produk) {
    const panel = document.getElementById('side-panel');
    const body = document.getElementById('panel-body');
    const orderID = "CEE-" + Math.floor(1000 + Math.random() * 9000);

    body.innerHTML = `
        <div class="panel-header-right">
            <span class="close-panel-btn-right" onclick="closePanel()">&times;</span>
        </div>
        <div style="padding:20px; padding-top: 0;">
            <img src="${produk.gambar_url}" style="width:100%; border-radius:15px; height:220px; object-fit:cover;">
            <div style="display:flex; justify-content:space-between; margin-top:15px;">
                <h2>${produk.nama}</h2>
                <h2 style="color:#ff9800">Rp ${Number(produk.harga).toLocaleString('id-ID')}</h2>
            </div>
            <p style="color:#666; margin:15px 0; font-size:0.9rem;">${produk.deskripsi || 'Jajanan premium pilihan.'}</p>
        </div>
        <div class="panel-footer">
            <button class="btn-checkout-final" onclick="prosesOrder('${produk.nama}', '${orderID}')">
                Pesan via WhatsApp
            </button>
        </div>
    `;
    panel.classList.remove('hidden');
}

// ==========================================
// 5. FUNGSI PENDUKUNG (NAVBAR, LOGOUT, DLL)
// ==========================================
function updateNavbar() {
    const userDisplay = document.getElementById('user-display');
    if (currentUser && userDisplay) {
        userDisplay.innerHTML = `
            <div class="user-info-nav">
                <span>Halo, <b>${currentUser.username}</b></span>
                <button class="btn-login-nav" style="background:#ff4444;" onclick="logout()">Logout</button>
            </div>
        `;
    }
}

function closePanel() { document.getElementById('side-panel').classList.add('hidden'); }
function logout() { localStorage.removeItem('cee_user'); location.reload(); }
function scrollToJajan() { document.getElementById('jajan').scrollIntoView({ behavior: 'smooth' }); }

// Menjalankan aplikasi saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', initApp);
