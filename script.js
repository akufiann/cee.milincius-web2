/**
 * 1. FUNGSI SCROLL HALUS
 * Berjalan saat tombol 'Mulai Jajan' diklik
 */
function scrollToJajan() {
    const target = document.getElementById('jajan');
    if (target) {
        target.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

/**
 * 2. FUNGSI AMBIL DATA DARI DATABASE (NETLIFY FUNCTIONS)
 */
async function muatMenu() {
    const container = document.getElementById('menu-container');
    
    try {
        // Memanggil API Netlify yang terhubung ke Neon Postgres
        const response = await fetch('/.netlify/functions/get-produk');
        
        if (!response.ok) throw new Error('Gagal mengambil data dari server');
        
        const data = await response.json();
        
        // Bersihkan tulisan loading
        container.innerHTML = ''; 

        if (data.length === 0) {
            container.innerHTML = '<p class="loading">Belum ada menu tersedia.</p>';
            return;
        }

        // Loop data untuk membuat Card Menu
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            
            // Format harga ke Rupiah
            const hargaFormatted = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(item.harga);

            card.innerHTML = `
                <img src="${item.gambar_url || 'https://via.placeholder.com/300x200?text=Cee+Milincius'}" alt="${item.nama}" loading="lazy">
                <div class="card-info">
                    <h3>${item.nama}</h3>
                    <p>${hargaFormatted}</p>
                    <button class="btn-pesan" onclick="kirimWhatsApp('${item.nama}', '${item.harga}')">Pesan</button>
                </div>
            `;
            
            // Tambahkan event klik pada card agar bisa masuk ke "halaman" detail (opsional)
            card.addEventListener('click', (e) => {
                if(e.target.tagName !== 'BUTTON') {
                    console.log(`Melihat detail: ${item.nama}`);
                    // Di sini kamu bisa tambahkan logika popup/modal jika mau
                }
            });

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error Database:", error);
        container.innerHTML = `
            <div class="loading" style="color: red;">
                Gagal memuat menu. <br>
                <small>${error.message}</small>
            </div>`;
    }
}

/**
 * 3. FUNGSI KIRIM WHATSAPP
 * Mengarahkan pelanggan langsung ke chat WA kamu
 */
function kirimWhatsApp(namaProduk, harga) {
    const nomorWA = "6285814211259"; // <-- GANTI DENGAN NOMOR WA KAMU (Gunakan 62, bukan 0)
    const pesan = encodeURIComponent(
        `Halo Cee Milincius, saya mau pesan:\n\n` +
        `Produk: *${namaProduk}*\n` +
        `Harga: *Rp ${Number(harga).toLocaleString('id-ID')}*\n\n` +
        `Tolong diproses ya, terima kasih!`
    );
    
    window.open(`https://wa.me/${nomorWA}?text=${pesan}`, '_blank');
}

/**
 * 4. JALANKAN FUNGSI SAAT HALAMAN SELESAI DIMUAT
 */
document.addEventListener('DOMContentLoaded', muatMenu);
