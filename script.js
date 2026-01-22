let currentProduct = {};
let basePrice = 0;

// 1. SCROLL HALUS
function scrollToJajan() {
    document.getElementById('jajan').scrollIntoView({ behavior: 'smooth' });
}

// 2. AMBIL DATA DARI DATABASE
async function muatMenu() {
    const container = document.getElementById('menu-container');
    try {
        const response = await fetch('/.netlify/functions/get-produk');
        if (!response.ok) throw new Error('Gagal ambil data');
        const data = await response.json();
        
        container.innerHTML = ''; 
        if (data.length === 0) {
            container.innerHTML = '<p>Menu belum tersedia.</p>';
            return;
        }

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            
            // Klik kartu untuk buka modal
            card.onclick = () => openModal(item);

            // REVISI GAMBAR: Mengutamakan gambar_url dari database
            card.innerHTML = `
                <div class="card-img-container">
                    <img src="${item.gambar_url}" onerror="this.src='https://via.placeholder.com/300?text=Cee+Milincius'" alt="${item.nama}">
                    <span class="badge-kategori">${item.kategori || 'Menu'}</span>
                </div>
                <div class="card-info">
                    <h3>${item.nama}</h3>
                    <p class="price-tag">Rp ${Number(item.harga).toLocaleString('id-ID')}</p>
                    <span class="btn-pilih">Pilih Varian</span>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        container.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
    }
}

// 3. LOGIKA MODAL (ALA SHOPEE)
function openModal(produk) {
    currentProduct = produk;
    basePrice = Number(produk.harga);
    
    // Isi info produk di modal
    document.getElementById('modal-info').innerHTML = `
        <img src="${produk.gambar_url}" class="modal-img">
        <h2>${produk.nama}</h2>
        <p class="modal-desc">${produk.deskripsi || 'Jajanan hits kualitas premium.'}</p>
    `;

    // Render pilihan varian berdasarkan kategori
    renderDynamicOptions(produk.kategori);
    hitungTotal();
    
    document.getElementById('product-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function renderDynamicOptions(kategori) {
    const container = document.getElementById('dynamic-options-container');
    let html = '';

    if (kategori === 'Si Manis') {
        html = `
            <p class="label-opsi">Pilih Rasa:</p>
            <div class="option-grid">
                <label><input type="radio" name="rasa" value="Coklat" checked> Coklat</label>
                <label><input type="radio" name="rasa" value="Taro"> Taro</label>
                <label><input type="radio" name="rasa" value="Matcha"> Matcha</label>
            </div>
            <p class="label-opsi">Extra Topping (+2rb):</p>
            <div class="option-grid">
                <label><input type="checkbox" name="topping" value="Keju" onchange="hitungTotal()"> Keju</label>
                <label><input type="checkbox" name="topping" value="Oreo" onchange="hitungTotal()"> Oreo</label>
            </div>`;
    } else if (kategori === 'Si Pedas Gurih') {
        html = `
            <p class="label-opsi">Level Pedas:</p>
            <div class="option-grid">
                <label><input type="radio" name="rasa" value="Original" checked> Ori</label>
                <label><input type="radio" name="rasa" value="Pedas Dikit"> Dikit</label>
                <label><input type="radio" name="rasa" value="Pedas Nampol"> Nampol</label>
            </div>
            <p class="label-opsi">Tambahan:</p>
            <div class="option-grid">
                <label><input type="checkbox" name="topping" value="Chili Oil" onchange="hitungTotal()"> Chili Oil</label>
            </div>`;
    } else {
        html = `<input type="hidden" name="rasa" value="Default">`;
    }
    container.innerHTML = html;
}

function closeModal() {
    document.getElementById('product-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function hitungTotal() {
    const toppings = document.querySelectorAll('input[name="topping"]:checked');
    let total = basePrice + (toppings.length * 2000);
    document.getElementById('modal-total-price').innerText = total.toLocaleString('id-ID');
}

// 4. KIRIM WA DENGAN VARIAN LENGKAP
function kirimWA() {
    const rasaEl = document.querySelector('input[name="rasa"]:checked') || document.querySelector('input[name="rasa"]');
    const rasa = rasaEl ? rasaEl.value : '-';
    const toppings = Array.from(document.querySelectorAll('input[name="topping"]:checked')).map(t => t.value);
    
    let total = basePrice + (toppings.length * 2000);
    
    let pesan = `Halo Cee Milincius! 👋%0A%0A*PESANAN BARU*%0A`;
    pesan += `--------------------------%0A`;
    pesan += `*Produk:* ${currentProduct.nama}%0A`;
    pesan += `*Varian:* ${rasa}%0A`;
    if (toppings.length > 0) pesan += `*Topping:* ${toppings.join(', ')}%0A`;
    pesan += `--------------------------%0A`;
    pesan += `*Total: Rp ${total.toLocaleString('id-ID')}*%0A%0A`;
    pesan += `Tolong diproses ya kak!`;

    window.open(`https://wa.me/6285814211259?text=${pesan}`, '_blank');
}

document.addEventListener('DOMContentLoaded', muatMenu);
