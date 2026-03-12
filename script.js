console.log('🚀 script.js mulai diload');
// ==========================================
// 1. PENGATURAN CACHE & VERSI
// ==========================================
const VERSION = "1.2"; 
if (localStorage.getItem('app_version') !== VERSION) {
    localStorage.clear();
    localStorage.setItem('app_version', VERSION);
}

let currentUser = null;
let isLoginMode = true;

// Inisialisasi user dari localStorage (hanya sekali)
try {
    const savedUser = localStorage.getItem('cee_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
} catch (e) {
    console.log('Error parsing user:', e);
}

// ==========================================
// 2. INISIALISASI
// ==========================================
function initApp() {
    function initApp() {
    console.log('✅ initApp() DIPANGGIL - Baris 1');
    updateNavbar();
    console.log('✅ updateNavbar selesai');
    muatMenu();
    console.log('✅ muatMenu selesai');
    cekMobilePopup();
    console.log('✅ cekMobilePopup selesai');
    initAdminTrigger();
    console.log('✅ initAdminTrigger selesai');
}
    
    // Cek admin session
    try {
        const savedAdmin = localStorage.getItem('cee_admin');
        if (savedAdmin) {
            currentAdmin = JSON.parse(savedAdmin);
            const fab = document.getElementById('admin-fab');
            if (fab) fab.classList.remove('hidden');
        }
    } catch (e) {
        console.log('Error parsing admin:', e);
    }
}

// ==========================================
// 3. FUNGSI MODAL LOGIN
// ==========================================
function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // Reset form
        const username = document.getElementById('login-username');
        const phone = document.getElementById('login-phone');
        const location = document.getElementById('login-location');
        
        if (username) username.value = '';
        if (phone) phone.value = '';
        if (location) location.value = '';
        
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

    if (!title || !desc || !registerFields || !toggleText || !toggleLink || !submitBtn) {
        return;
    }

    if (isLoginMode) {
        title.textContent = '👋 Selamat Datang Kembali!';
        desc.textContent = 'Masuk untuk melanjutkan pemesanan.';
        registerFields.classList.add('hidden');
        toggleText.textContent = 'Belum punya akun?';
        toggleLink.textContent = 'Daftar di sini';
        submitBtn.textContent = 'Masuk & Belanja';
    } else {
        title.textContent = '📝 Daftar Akun Baru';
        desc.textContent = 'Isi data diri untuk memudahkan pengantaran.';
        registerFields.classList.remove('hidden');
        toggleText.textContent = 'Sudah punya akun?';
        toggleLink.textContent = 'Masuk di sini';
        submitBtn.textContent = 'Daftar & Belanja';
    }
}

// ==========================================
// 4. FUNGSI SAVE LOGIN
// ==========================================
async function saveLogin() {
    const usernameInput = document.getElementById('login-username');
    const phoneInput = document.getElementById('login-phone');
    const locationInput = document.getElementById('login-location');
    
    if (!usernameInput || !phoneInput) return;
    
    const username = usernameInput.value.trim();
    const phone = phoneInput.value.trim();
    const location = locationInput ? locationInput.value.trim() : '';

    if (!username) { alert('Nama harus diisi!'); return; }
    if (!phone) { alert('Nomor WhatsApp harus diisi!'); return; }
    if (!isLoginMode && !location) { alert('Alamat harus diisi!'); return; }

    const userData = {
        username: username,
        phone: phone,
        location: location || 'Belum diisi',
        loginTime: new Date().toISOString()
    };

    const submitBtn = document.getElementById('btn-auth-submit');
    if (!submitBtn) return;
    
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Menyimpan...';
    submitBtn.disabled = true;

    try {
        if (!isLoginMode) {
            const response = await fetch('/.netlify/functions/save-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal menyimpan');
            }
        }

        localStorage.setItem('cee_user', JSON.stringify(userData));
        currentUser = userData;
        updateNavbar();
        closeModal();
        alert(`Selamat datang ${username}!`);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Gagal: ' + error.message);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// ==========================================
// 5. FUNGSI UPDATE NAVBAR
// ==========================================
function updateNavbar() {
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

function logout() { 
    localStorage.removeItem('cee_user'); 
    currentUser = null;
    updateNavbar();
}

// ==========================================
// 6. FUNGSI MENU
// ==========================================
async function muatMenu() {
    console.log('📢 muatMenu() DIMULAI');
    const container = document.getElementById('menu-container');
    console.log('📢 Container:', container);
    if (!container) return;

    try {
        const response = await fetch('/.netlify/functions/get-produk');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

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
    } catch (e) {
        console.error('Error loading menu:', e);
        container.innerHTML = '<p style="text-align:center; padding:50px; color:red;">Gagal memuat menu. Cek koneksi database.</p>';
    }
}

// ==========================================
// 7. FUNGSI DETAIL PRODUK
// ==========================================
function openDetail(produk) {
    const panel = document.getElementById('side-panel');
    const body = document.getElementById('panel-body');
    if (!panel || !body) return;
    
    const orderID = "CEE-" + Math.floor(1000 + Math.random() * 9000);

    body.innerHTML = `
        <div style="padding:20px;">
            <div style="display:flex; justify-content:flex-end;">
                <span onclick="closePanel()" style="font-size:30px; cursor:pointer; color:#999; background:#f5f5f5; width:40px; height:40px; display:flex; align-items:center; justify-content:center; border-radius:50%;">&times;</span>
            </div>
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

function closePanel() { 
    const panel = document.getElementById('side-panel');
    if (panel) panel.classList.add('hidden');
}

// ==========================================
// 8. FUNGSI PROSES ORDER
// ==========================================
function prosesOrder(namaProduk, orderID, harga) {
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
    const nomorAdmin = "6287823700686";
    
    window.open(`https://wa.me/${nomorAdmin}?text=${encodedPesan}`, '_blank');
    setTimeout(() => closePanel(), 1000);
}

// ==========================================
// 9. FUNGSI POPUP ASIDE
// ==========================================
function cekMobilePopup() {
    if (window.innerWidth <= 768) {
        const aside = document.getElementById('aside-info');
        const overlay = document.getElementById('aside-overlay');
        
        if (aside && overlay) {
            aside.classList.add('show-popup');
            overlay.classList.add('active');
        }
    }
}

function closeAsidePopup() {
    const aside = document.getElementById('aside-info');
    const overlay = document.getElementById('aside-overlay');
    
    if (aside && overlay) {
        aside.classList.remove('show-popup');
        overlay.classList.remove('active');
    }
}

function scrollToJajan() { 
    const jajan = document.getElementById('jajan');
    if (jajan) jajan.scrollIntoView({ behavior: 'smooth' }); 
}

// ==========================================
// 10. CLICK OUTSIDE MODAL
// ==========================================
window.onclick = function(event) {
    const modal = document.getElementById('login-modal');
    if (event.target === modal) {
        closeModal();
    }
}

// ==========================================
// 11. ADMIN SYSTEM (SEDERHANA)
// ==========================================

function initAdminTrigger() {
    const logo = document.querySelector('.nav-brand a');
    if (logo) {
        logo.addEventListener('dblclick', function(e) {
            e.preventDefault();
            openAdminLogin();
        });
    }
}

function openAdminLogin() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) {
        modal.classList.remove('hidden');
        
        const secret = document.getElementById('admin-secret-code');
        const phone = document.getElementById('admin-phone');
        
        if (secret) secret.value = '';
        if (phone) phone.value = '';
    }
}

function closeAdminModal() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.classList.add('hidden');
}

async function verifyAdmin() {
    const secret = document.getElementById('admin-secret-code');
    const phone = document.getElementById('admin-phone');
    
    if (!secret || !phone) return;
    
    const secretValue = secret.value.trim();
    const phoneValue = phone.value.trim();

    if (!secretValue || !phoneValue) {
        alert('Kode rahasia dan No. HP harus diisi!');
        return;
    }

    try {
        const response = await fetch('/.netlify/functions/admin-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret: secretValue, phone: phoneValue })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login gagal');
        }

        currentAdmin = data.admin;
        localStorage.setItem('cee_admin', JSON.stringify(data.admin));
        closeAdminModal();
        
        const fab = document.getElementById('admin-fab');
        if (fab) fab.classList.remove('hidden');
        
        alert(`Selamat datang, ${data.admin.name}!`);

    } catch (error) {
        console.error('Login error:', error);
        alert('Login gagal: ' + error.message);
    }
}

function openAdminPanel() {
    alert('Fitur admin panel akan segera hadir!');
}

function closeAdminPanel() {
    const panel = document.getElementById('admin-panel');
    if (panel) panel.classList.add('hidden');
}

// ==========================================
// 12. JALANKAN INISIALISASI (HANYA SEKALI)
// ==========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp(); // DOM already loaded
}
