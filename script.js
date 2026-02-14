// Letakkan di baris paling atas fixing.js
const VERSION = "1.1"; 
if (localStorage.getItem('app_version') !== VERSION) {
    localStorage.clear(); // Hapus cache lama
    localStorage.setItem('app_version', VERSION);
}

let currentUser = JSON.parse(localStorage.getItem('cee_user')) || null;
let isRegisterMode = false;

function initApp() {
    updateNavbar();
    muatMenu();
}

function updateNavbar() {
    const userDisplay = document.getElementById('user-display');
    if (currentUser && userDisplay) {
        userDisplay.innerHTML = `
            <div class="user-info-nav">
                <span style="font-size:0.8rem;">Halo, <b>${currentUser.username}</b></span>
                <button class="btn-login-nav" style="background:#ff4444; padding:4px 8px; font-size:0.7rem;" onclick="logout()">Logout</button>
            </div>
        `;
    }
}

async function muatMenu() {
    const container = document.getElementById('menu-container');
    try {
        // Memanggil Netlify Function kamu untuk ambil produk
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
        container.innerHTML = '<p>Gagal memuat menu. Cek koneksi Neon Database.</p>';
    }
}

function openDetail(produk) {
    const panel = document.getElementById('side-panel');
    const body = document.getElementById('panel-body');
    const orderID = "CEE-" + Math.floor(1000 + Math.random() * 9000);

    body.innerHTML = `
        <div style="padding:20px;">
            <img src="${produk.gambar_url}" style="width:100%; border-radius:15px; height:220px; object-fit:cover;">
            <div style="display:flex; justify-content:space-between; margin-top:15px;">
                <h2>${produk.nama}</h2>
                <h2 style="color:#ff9800">Rp ${Number(produk.harga).toLocaleString('id-ID')}</h2>
            </div>
            <p style="color:#666; margin:15px 0; font-size:0.9rem;">${produk.deskripsi || 'Jajanan premium pilihan.'}</p>
            <p style="font-size:0.8rem; color:#999;">ID Pesanan: ${orderID}</p>
        </div>
        <div class="panel-footer">
            <button class="btn-checkout-final" onclick="prosesOrder('${produk.nama}', '${orderID}')">
                Pesan via WhatsApp
            </button>
        </div>
    `;
    panel.classList.remove('hidden');
}

function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    document.getElementById('auth-title').innerText = isRegisterMode ? "Daftar Akun Baru" : "👋 Halo Milincius Lover!";
    document.getElementById('btn-auth-submit').innerText = isRegisterMode ? "Daftar Sekarang" : "Masuk & Belanja";
    document.getElementById('register-only-fields').classList.toggle('hidden');
    document.getElementById('toggle-link').innerText = isRegisterMode ? "Login di sini" : "Daftar di sini";
}

async function saveLogin() {
    const user = document.getElementById('login-username').value;
    const phone = document.getElementById('login-phone').value;
    const lokasi = document.getElementById('login-location')?.value || "Kediri";

    if(!user || !phone) return alert("Isi nama dan WA dulu ya!");

    const userData = { username: user, phone: phone, location: lokasi };
    
    // Simpan Lokal
    localStorage.setItem('cee_user', JSON.stringify(userData));

    // SIMPAN RAHASIA KE NEON VIA NETLIFY FUNCTION
    try {
        await fetch('/.netlify/functions/save-user', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    } catch (err) { console.error("Sync error"); }

    alert("Berhasil masuk!");
    location.reload();
}

function prosesOrder(nama, id) {
    if(!currentUser) return openLoginModal();
    const pesan = `*PESANAN BARU | ${id}*%0A*Produk:* ${nama}%0A*Nama:* ${currentUser.username}%0A*Lokasi:* ${currentUser.location}`;
    window.open(`https://wa.me/6285814211259?text=${pesan}`, '_blank');
}

function logout() { localStorage.removeItem('cee_user'); location.reload(); }
function openLoginModal() { document.getElementById('login-modal').classList.remove('hidden'); }
function closeModal() { document.getElementById('login-modal').classList.add('hidden'); }
function closePanel() { document.getElementById('side-panel').classList.add('hidden'); }
function scrollToJajan() { document.getElementById('jajan').scrollIntoView({ behavior: 'smooth' }); }

document.addEventListener('DOMContentLoaded', initApp);
