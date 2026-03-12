// ==========================================
// 1. PENGATURAN CACHE & VERSI (AGAR GAK ERROR)
// ==========================================
const VERSION = "1.2"; 
if (localStorage.getItem('app_version') !== VERSION) {
    localStorage.clear();
    localStorage.setItem('app_version', VERSION);
}

let currentUser = JSON.parse(localStorage.getItem('cee_user')) || null;
let isLoginMode = true; // Tambahkan ini di bagian atas file script.js, setelah deklarasi currentUser

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

    // Update badge kategori
    const badge = document.getElementById('panel-category-badge');
    if (badge) {
        badge.textContent = produk.kategori || 'HOT';
    }

    // Isi konten panel (jangan hapus header yang sudah ada)
    body.innerHTML = `
        <div style="padding:20px;">
            <img src="${produk.gambar_url}" style="width:100%; border-radius:15px; height:220px; object-fit:cover;" onerror="this.src='https://via.placeholder.com/400x220?text=No+Image'">
            
            <div style="display:flex; justify-content:space-between; margin-top:15px;">
                <h2>${produk.nama}</h2>
                <h2 style="color:#ff9800">Rp ${Number(produk.harga).toLocaleString('id-ID')}</h2>
            </div>
            
            <p style="color:#666; margin:15px 0;">${produk.deskripsi || 'Jajanan premium pilihan.'}</p>
            
            <div style="margin:20px 0;">
                <label style="font-weight:600; display:block; margin-bottom:10px;">Catatan (opsional):</label>
                <textarea id="order-notes" placeholder="Contoh: Pedas, Level 2, dll" style="width:100%; padding:12px; border:2px solid #eee; border-radius:10px; resize:none;" rows="3"></textarea>
            </div>
            
            <button class="btn-checkout-final" onclick="prosesOrder('${produk.nama}', '${orderID}', ${produk.harga})">
                <i class="fab fa-whatsapp"></i> Pesan via WhatsApp
            </button>
        </div>
    `;
    
    panel.classList.remove('hidden');
}

function prosesOrder(namaProduk, orderID, harga) {
    console.log('Memesan:', namaProduk, orderID);
    
    // Cek login
    if (!currentUser) {
        alert('Silakan login/daftar terlebih dahulu!');
        closePanel();
        openLoginModal();
        return;
    }

    const notes = document.getElementById('order-notes')?.value || '';
    const catatan = notes ? `\n*Catatan:* ${notes}` : '';

    const pesan = `Halo Kak, saya *${currentUser.username}* ingin memesan:
        
*Menu:* ${namaProduk}
*Harga:* Rp ${Number(harga).toLocaleString('id-ID')}
*ID Pesanan:* ${orderID}${catatan}

*Data Pemesan:*
📞 No. WhatsApp: ${currentUser.phone}
📍 Alamat: ${currentUser.location}

Mohon konfirmasi. Terima kasih! 🙏`;

    const encodedPesan = encodeURIComponent(pesan);
    const nomorAdmin = "6287823700686"; // Dari footer
    
    window.open(`https://wa.me/${nomorAdmin}?text=${encodedPesan}`, '_blank');
    
    setTimeout(() => closePanel(), 1000);
}



// ==========================================
// 5. FUNGSI PENDUKUNG (NAVBAR, LOGOUT, DLL)
// ==========================================
function updateNavbar() {
    const userDisplay = document.getElementById('user-display');
    if (!userDisplay) return;

    if (currentUser && currentUser.username) {
        // Tampilkan info user jika login
        userDisplay.innerHTML = `
            <div class="user-info-nav">
                <span>Halo, <b>${currentUser.username}</b></span>
                <button class="btn-login-nav" style="background:#ff4444;" onclick="logout()">Logout</button>
            </div>
        `;
    } else {
        // Tampilkan tombol login jika belum login
        userDisplay.innerHTML = `
            <button class="btn-login-nav" onclick="openLoginModal()">Daftar/Login</button>
        `;
    }
}

// ===========================
// FUNGSI MODAL LOGIN/REGISTER
// ===========================
function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('hidden');
        // Reset form
        document.getElementById('login-username').value = '';
        document.getElementById('login-phone').value = '';
        const locationField = document.getElementById('login-location');
        if (locationField) locationField.value = '';
        
        // Set ke mode default (login)
        isLoginMode = true;
        updateAuthModeDisplay();
    }
}

function closeModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    updateAuthModeDisplay();
}

function updateAuthModeDisplay() {
    const title = document.getElementById('auth-title');
    const desc = document.getElementById('auth-desc');
    const registerFields = document.getElementById('register-only-fields');
    const toggleText = document.getElementById('toggle-text');
    const toggleLink = document.getElementById('toggle-link');
    const submitBtn = document.getElementById('btn-auth-submit');

    if (isLoginMode) {
        // Mode Login
        title.textContent = '👋 Selamat Datang Kembali!';
        desc.textContent = 'Masuk untuk melanjutkan pemesanan.';
        registerFields.classList.add('hidden');
        toggleText.textContent = 'Belum punya akun?';
        toggleLink.textContent = 'Daftar di sini';
        submitBtn.textContent = 'Masuk & Belanja';
    } else {
        // Mode Register
        title.textContent = '📝 Daftar Akun Baru';
        desc.textContent = 'Isi data diri untuk memudahkan pengantaran.';
        registerFields.classList.remove('hidden');
        toggleText.textContent = 'Sudah punya akun?';
        toggleLink.textContent = 'Masuk di sini';
        submitBtn.textContent = 'Daftar & Belanja';
    }
}

function closePanel() { 
    const panel = document.getElementById('side-panel');
    if (panel) {
        panel.classList.add('hidden');
    }
}
function logout() { 
    localStorage.removeItem('cee_user'); 
    currentUser = null;    // ← TAMBAHKAN INI (reset variable)
    updateNavbar();        // ← TAMBAHKAN INI (update tampilan)
    // location.reload();  // Bisa dihapus karena sudah pakai updateNavbar
}
function scrollToJajan() { document.getElementById('jajan').scrollIntoView({ behavior: 'smooth' }); }

// Menjalankan aplikasi saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', initApp);

// Click outside modal to close
window.onclick = function(event) {
    const modal = document.getElementById('login-modal');
    if (event.target === modal) {
        closeModal();
    }
}

// =================
// FUNGSI SAVE LOGIN
// =================

async function saveLogin() {
    const username = document.getElementById('login-username').value.trim();
    const phone = document.getElementById('login-phone').value.trim();
    const locationInput = document.getElementById('login-location');
    const location = locationInput ? locationInput.value.trim() : '';

    // Validasi
    if (!username) {
        alert('Nama harus diisi!');
        return;
    }
    if (!phone) {
        alert('Nomor WhatsApp harus diisi!');
        return;
    }
    if (!isLoginMode && !location) {
        alert('Alamat harus diisi saat mendaftar!');
        return;
    }

    // Data user
    const userData = {
        username: username,
        phone: phone,
        location: location || 'Belum diisi',
        loginTime: new Date().toISOString()
    };

    // Tampilkan loading di button
    const submitBtn = document.getElementById('btn-auth-submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Menyimpan...';
    submitBtn.disabled = true;

    try {
        // Jika mode REGISTER, kirim ke database
        if (!isLoginMode) {
            console.log('Mengirim data ke database...');
            
            const response = await fetch('/.netlify/functions/save-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal menyimpan ke database');
            }

            const result = await response.json();
            console.log('Response dari database:', result);
        }

        // Simpan ke localStorage (untuk semua mode)
        localStorage.setItem('cee_user', JSON.stringify(userData));
        currentUser = userData;
        
        // Update navbar
        updateNavbar();
        
        // Tutup modal
        closeModal();
        
        alert(`Selamat datang ${username}! ${isLoginMode ? 'Login' : 'Pendaftaran'} berhasil.`);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Gagal: ' + error.message);
    } finally {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}
