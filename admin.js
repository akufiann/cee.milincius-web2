// ============================================
// ADMIN PANEL JAVASCRIPT - File terpisah
// ============================================

// Admin state
let currentAdmin = null;
let adminProducts = [];

// ============================================
// INITIALIZATION
// ============================================
function initAdmin() {
    console.log('Admin module initialized');
    
    try {
        // Load admin session
        const savedAdmin = localStorage.getItem('cee_admin');
        if (savedAdmin) {
            currentAdmin = JSON.parse(savedAdmin);
            showAdminFAB();
        }
        
        // Setup admin trigger (double click logo)
        setupAdminTrigger();
        
    } catch (error) {
        console.error('Admin init error:', error);
    }
}

// ============================================
// ADMIN TRIGGER (Double click logo)
// ============================================
function setupAdminTrigger() {
    const logo = document.querySelector('.nav-brand a');
    if (logo) {
        logo.addEventListener('dblclick', function(e) {
            e.preventDefault();
            openAdminLoginModal();
        });
    }
}

// ============================================
// ADMIN LOGIN MODAL
// ============================================
function openAdminLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // Reset form
        const secretInput = document.getElementById('admin-secret-code');
        const phoneInput = document.getElementById('admin-phone');
        
        if (secretInput) secretInput.value = '';
        if (phoneInput) phoneInput.value = '';
    }
}

function closeAdminLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// ============================================
// VERIFY ADMIN LOGIN
// ============================================
async function verifyAdmin() {
    const secretInput = document.getElementById('admin-secret-code');
    const phoneInput = document.getElementById('admin-phone');
    
    if (!secretInput || !phoneInput) {
        alert('System error: Form tidak ditemukan');
        return;
    }
    
    const secret = secretInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!secret || !phone) {
        alert('Kode rahasia dan No. HP harus diisi!');
        return;
    }

    // Show loading
    const loginBtn = document.querySelector('#admin-login-modal .btn-save-login');
    const originalText = loginBtn.textContent;
    loginBtn.textContent = 'Memverifikasi...';
    loginBtn.disabled = true;

    try {
        const response = await fetch('/.netlify/functions/admin-auth', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ secret, phone })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Error ${response.status}`);
        }

        if (!data.success || !data.admin) {
            throw new Error('Response tidak valid');
        }

        // Save admin session
        currentAdmin = data.admin;
        localStorage.setItem('cee_admin', JSON.stringify(data.admin));
        
        // Close login modal
        closeAdminLoginModal();
        
        // Show FAB
        showAdminFAB();
        
        // Show success message
        showAdminToast(`Selamat datang, ${data.admin.name}!`, 'success');
        
        // Auto open admin panel
        setTimeout(() => openAdminPanel(), 500);

    } catch (error) {
        console.error('Admin login error:', error);
        alert('Login gagal: ' + error.message);
    } finally {
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    }
}

// ============================================
// SHOW/HIDE ADMIN FAB
// ============================================
function showAdminFAB() {
    const fab = document.getElementById('admin-fab');
    if (fab) {
        fab.classList.remove('hidden');
    }
}

function hideAdminFAB() {
    const fab = document.getElementById('admin-fab');
    if (fab) {
        fab.classList.add('hidden');
    }
}

// ============================================
// OPEN ADMIN PANEL
// ============================================
async function openAdminPanel() {
    if (!currentAdmin) {
        openAdminLoginModal();
        return;
    }

    const panel = document.getElementById('admin-panel');
    const body = document.getElementById('admin-panel-body');
    
    if (!panel || !body) return;
    
    // Show loading
    body.innerHTML = `
        <div style="text-align:center; padding:50px;">
            <div class="admin-spinner"></div>
            <p style="margin-top:20px; color:#666;">Memuat panel admin...</p>
        </div>
    `;
    
    panel.classList.remove('hidden');
    
    // Load dashboard
    await loadAdminDashboard();
}

function closeAdminPanel() {
    const panel = document.getElementById('admin-panel');
    if (panel) {
        panel.classList.add('hidden');
    }
}

// ============================================
// LOAD ADMIN DASHBOARD
// ============================================
async function loadAdminDashboard() {
    const body = document.getElementById('admin-panel-body');
    if (!body) return;
    
    try {
        // Load products
        await loadAdminProducts();
        
        // Render dashboard
        body.innerHTML = generateAdminDashboard();
        
        // Load admin list (jika ada)
        if (typeof loadAdminList === 'function') {
            loadAdminList();
        }
        
        // Refresh main menu TANPA mengganggu yang sudah ada
        if (typeof window.muatMenu === 'function') {
            // Panggil tanpa await agar tidak blocking
            window.muatMenu().catch(e => console.log('Menu refresh error:', e));
        }
        
    } catch (error) {
        console.error('Dashboard error:', error);
        body.innerHTML = `
            <div class="admin-card">
                <h3><i class="fas fa-exclamation-triangle"></i> Error</h3>
                <p style="color:#ff4444;">${error.message}</p>
                <button class="admin-btn admin-btn-primary" onclick="loadAdminDashboard()">
                    <i class="fas fa-sync"></i> Coba Lagi
                </button>
            </div>
        `;
    }
}

// ============================================
// GENERATE ADMIN DASHBOARD HTML
// ============================================
function generateAdminDashboard() {
    const stats = {
        totalProducts: adminProducts.length,
        totalAdmins: 0, // Will be updated
        lastUpdate: new Date().toLocaleString('id-ID')
    };
    
    return `
        <!-- Admin Info Card -->
        <div class="admin-card">
            <h3><i class="fas fa-user-shield"></i> Admin Info</h3>
            <div style="display:flex; align-items:center; gap:15px;">
                <div style="width:50px; height:50px; background:linear-gradient(135deg, #667eea, #764ba2); border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:20px;">
                    <i class="fas fa-crown"></i>
                </div>
                <div>
                    <h4 style="margin-bottom:5px;">${currentAdmin.name}</h4>
                    <p style="color:#666; font-size:0.9rem;">
                        <i class="fas fa-phone"></i> ${currentAdmin.phone} | 
                        <span class="badge" style="background:${currentAdmin.role === 'super' ? '#ff9800' : '#667eea'}; color:white; padding:3px 8px; border-radius:20px; font-size:0.8rem;">
                            ${currentAdmin.role === 'super' ? 'Super Admin' : 'Admin'}
                        </span>
                    </p>
                </div>
            </div>
            <button class="admin-btn admin-btn-danger" onclick="logoutAdmin()" style="width:100%; margin-top:15px;">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        </div>
        
        <!-- Stats Cards -->
        <div class="admin-stats-grid">
            <div class="admin-stat-card">
                <i class="fas fa-box" style="font-size:2rem;"></i>
                <div class="stat-value">${stats.totalProducts}</div>
                <div class="stat-label">Total Produk</div>
            </div>
            <div class="admin-stat-card" style="background:linear-gradient(135deg, #ff9800, #ff5722);">
                <i class="fas fa-users" style="font-size:2rem;"></i>
                <div class="stat-value" id="admin-count">0</div>
                <div class="stat-label">Total Admin</div>
            </div>
        </div>
        
        <!-- Admin Tabs -->
        <div class="admin-tabs">
            <button class="admin-tab active" onclick="switchAdminTab('products')">
                <i class="fas fa-box"></i> Produk
            </button>
            <button class="admin-tab" onclick="switchAdminTab('admins')">
                <i class="fas fa-users-cog"></i> Admin
            </button>
            <button class="admin-tab" onclick="switchAdminTab('settings')">
                <i class="fas fa-palette"></i> Tema
            </button>
        </div>
        
        <!-- Products Tab (default active) -->
        <div id="admin-products-tab" class="admin-tab-content">
            <div class="admin-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="margin-bottom:0; border-bottom:none; padding-bottom:0;">
                        <i class="fas fa-box"></i> Manajemen Produk
                    </h3>
                    <button class="admin-btn admin-btn-success" onclick="showAddProductForm()">
                        <i class="fas fa-plus"></i> Tambah
                    </button>
                </div>
                
                <div id="admin-products-list">
                    ${generateProductsList()}
                </div>
            </div>
        </div>
        
        <!-- Admins Tab (hidden) -->
        <div id="admin-admins-tab" class="admin-tab-content" style="display:none;">
            <div class="admin-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="margin-bottom:0; border-bottom:none; padding-bottom:0;">
                        <i class="fas fa-users-cog"></i> Daftar Admin
                    </h3>
                    ${currentAdmin.role === 'super' ? `
                        <button class="admin-btn admin-btn-success" onclick="showAddAdminForm()">
                            <i class="fas fa-user-plus"></i> Tambah Admin
                        </button>
                    ` : ''}
                </div>
                
                <div id="admin-list">
                    <div style="text-align:center; padding:20px;">
                        <div class="admin-spinner"></div>
                        <p>Memuat daftar admin...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Settings Tab (hidden) -->
        <div id="admin-settings-tab" class="admin-tab-content" style="display:none;">
            <div class="admin-card">
                <h3><i class="fas fa-palette"></i> Kustomisasi Tema</h3>
                
                <div class="admin-form-group">
                    <label>Gradient Warna (CSS)</label>
                    <input type="text" id="theme-gradient" value="135deg, #ff9800, #ff5722" 
                           placeholder="contoh: 135deg, #ff9800, #ff5722">
                </div>
                
                <div class="admin-form-group">
                    <label>URL Wallpaper</label>
                    <input type="url" id="theme-wallpaper" 
                           value="https://res.cloudinary.com/dur7r6ylh/image/upload/v1770983202/Desain_tanpa_judul_20260212_095802_0000_kfnann.jpg"
                           placeholder="https://...">
                </div>
                
                <button class="admin-btn admin-btn-primary" onclick="saveTheme()" style="width:100%;">
                    <i class="fas fa-save"></i> Simpan Tema
                </button>
            </div>
            
            <div class="admin-card">
                <h3><i class="fas fa-info-circle"></i> Informasi Sistem</h3>
                <p><strong>Last Update:</strong> ${stats.lastUpdate}</p>
                <p><strong>Database:</strong> Neon PostgreSQL</p>
                <p><strong>Environment:</strong> Netlify Functions</p>
            </div>
        </div>
    `;
}

// ============================================
// SWITCH ADMIN TABS
// ============================================
function switchAdminTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Hide all tabs
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // Show selected tab
    document.getElementById(`admin-${tab}-tab`).style.display = 'block';
}

// ============================================
// PRODUCT MANAGEMENT - VERSI AMAN
// ============================================
async function loadAdminProducts() {
    try {
        console.log('Loading admin products...');
        
        // Gunakan endpoint yang sama dengan script.js
        const response = await fetch('/.netlify/functions/get-produk');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Products loaded:', data);
        
        // Simpan ke variable global
        adminProducts = Array.isArray(data) ? data : [];
        return adminProducts;
        
    } catch (error) {
        console.error('Error loading products:', error);
        adminProducts = [];
        
        // Tampilkan error di panel admin (optional)
        const productsList = document.getElementById('admin-products-list');
        if (productsList) {
            productsList.innerHTML = `
                <div style="text-align:center; padding:30px; color:#ff4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size:2rem; margin-bottom:10px;"></i>
                    <p>Gagal memuat produk: ${error.message}</p>
                </div>
            `;
        }
        
        return [];
    }
}

function generateProductsList() {
    // Pastikan adminProducts adalah array
    const products = adminProducts || [];
    
    if (products.length === 0) {
        return `
            <div style="text-align:center; padding:30px;">
                <i class="fas fa-box-open" style="font-size:3rem; color:#ccc; margin-bottom:15px;"></i>
                <p style="color:#999;">Belum ada produk</p>
                <button class="admin-btn admin-btn-success" onclick="showAddProductForm()" style="margin-top:10px;">
                    <i class="fas fa-plus"></i> Tambah Produk
                </button>
            </div>
        `;
    }
    
    return products.map((product, index) => {
        // Validasi data produk
        const nama = product.nama || 'Produk';
        const harga = product.harga ? Number(product.harga).toLocaleString('id-ID') : '0';
        const kategori = product.kategori || 'Umum';
        const gambar = product.gambar_url || 'https://via.placeholder.com/60';
        const productId = product.id || index;
        
        return `
            <div class="admin-produk-item">
                <img src="${gambar}" class="admin-produk-img" onerror="this.src='https://via.placeholder.com/60'">
                <div class="admin-produk-info">
                    <h4>${nama}</h4>
                    <p>Rp ${harga} | ${kategori}</p>
                </div>
                <div class="admin-produk-actions">
                    <button onclick="editProduct(${index})" style="background:#ff9800; color:white; padding:8px 12px; border:none; border-radius:5px; cursor:pointer;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProduct(${productId})" style="background:#ff4444; color:white; padding:8px 12px; border:none; border-radius:5px; cursor:pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function showAddProductForm() {
    const body = document.getElementById('admin-panel-body');
    body.innerHTML = `
        <div class="admin-card">
            <h3><i class="fas fa-plus-circle"></i> Tambah Produk Baru</h3>
            
            <div class="admin-form-group">
                <label>Nama Produk <span style="color:#ff4444;">*</span></label>
                <input type="text" id="product-name" placeholder="Contoh: Milky Pop Ice">
            </div>
            
            <div class="admin-form-group">
                <label>Harga (Rp) <span style="color:#ff4444;">*</span></label>
                <input type="number" id="product-price" placeholder="5000">
            </div>
            
            <div class="admin-form-group">
                <label>Kategori</label>
                <input type="text" id="product-category" placeholder="Minuman, Makanan, dll">
            </div>
            
            <div class="admin-form-group">
                <label>URL Gambar <span style="color:#ff4444;">*</span></label>
                <input type="url" id="product-image" placeholder="https://...">
            </div>
            
            <div class="admin-form-group">
                <label>Deskripsi</label>
                <textarea id="product-description" rows="3" placeholder="Deskripsi produk..."></textarea>
            </div>
            
            <div style="display:flex; gap:10px;">
                <button class="admin-btn admin-btn-primary" onclick="saveProduct()">
                    <i class="fas fa-save"></i> Simpan
                </button>
                <button class="admin-btn admin-btn-secondary" onclick="loadAdminDashboard()">
                    Batal
                </button>
            </div>
        </div>
    `;
}

async function saveProduct() {
    // Ambil nilai form
    const nameInput = document.getElementById('product-name');
    const priceInput = document.getElementById('product-price');
    const categoryInput = document.getElementById('product-category');
    const imageInput = document.getElementById('product-image');
    const descInput = document.getElementById('product-description');
    
    if (!nameInput || !priceInput || !imageInput) {
        alert('Form tidak lengkap!');
        return;
    }
    
    const name = nameInput.value.trim();
    const price = priceInput.value.trim();
    const category = categoryInput ? categoryInput.value.trim() : '';
    const image = imageInput.value.trim();
    const description = descInput ? descInput.value.trim() : '';

    // Validasi
    if (!name) {
        alert('Nama produk harus diisi!');
        return;
    }
    if (!price) {
        alert('Harga harus diisi!');
        return;
    }
    if (!image) {
        alert('URL gambar harus diisi!');
        return;
    }

    // Validasi harga harus angka
    const hargaNumber = parseInt(price);
    if (isNaN(hargaNumber) || hargaNumber <= 0) {
        alert('Harga harus angka yang valid!');
        return;
    }

    // Tampilkan loading
    const saveBtn = event.target;
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = 'Menyimpan...';
    saveBtn.disabled = true;

    try {
        const productData = {
            nama: name,
            harga: hargaNumber,
            kategori: category || 'Umum',
            gambar_url: image,
            deskripsi: description || '',
            admin_phone: currentAdmin ? currentAdmin.phone : 'system'
        };
        
        console.log('Saving product:', productData);
        
        // Kirim ke server
        const response = await fetch('/.netlify/functions/admin-produk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `Error ${response.status}`);
        }

        // Success
        alert('Produk berhasil ditambahkan!');
        
        // Reload dashboard
        await loadAdminDashboard();
        
        // Refresh main menu
        if (typeof window.muatMenu === 'function') {
            window.muatMenu();
        }

    } catch (error) {
        console.error('Save error:', error);
        alert('Gagal menyimpan: ' + error.message);
    } finally {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

function editProduct(index) {
    const product = adminProducts[index];
    
    const body = document.getElementById('admin-panel-body');
    body.innerHTML = `
        <div class="admin-card">
            <h3><i class="fas fa-edit"></i> Edit Produk</h3>
            
            <div class="admin-form-group">
                <label>Nama Produk</label>
                <input type="text" id="product-name" value="${product.nama}">
            </div>
            
            <div class="admin-form-group">
                <label>Harga (Rp)</label>
                <input type="number" id="product-price" value="${product.harga}">
            </div>
            
            <div class="admin-form-group">
                <label>Kategori</label>
                <input type="text" id="product-category" value="${product.kategori || ''}">
            </div>
            
            <div class="admin-form-group">
                <label>URL Gambar</label>
                <input type="url" id="product-image" value="${product.gambar_url}">
            </div>
            
            <div class="admin-form-group">
                <label>Deskripsi</label>
                <textarea id="product-description" rows="3">${product.deskripsi || ''}</textarea>
            </div>
            
            <div style="display:flex; gap:10px;">
                <button class="admin-btn admin-btn-primary" onclick="updateProduct(${product.id})">
                    <i class="fas fa-save"></i> Update
                </button>
                <button class="admin-btn admin-btn-secondary" onclick="loadAdminDashboard()">
                    Batal
                </button>
            </div>
        </div>
    `;
}

async function updateProduct(productId) {
    const name = document.getElementById('product-name')?.value.trim();
    const price = document.getElementById('product-price')?.value.trim();
    const category = document.getElementById('product-category')?.value.trim();
    const image = document.getElementById('product-image')?.value.trim();
    const description = document.getElementById('product-description')?.value.trim();

    if (!name || !price || !image) {
        alert('Nama, harga, dan gambar harus diisi!');
        return;
    }

    const updateBtn = event.target;
    const originalText = updateBtn.innerHTML;
    updateBtn.innerHTML = '<span class="admin-spinner"></span> Mengupdate...';
    updateBtn.disabled = true;

    try {
        const response = await fetch('/.netlify/functions/admin-produk', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: productId,
                nama: name,
                harga: parseInt(price),
                kategori: category || 'Umum',
                gambar_url: image,
                deskripsi: description || '',
                admin_phone: currentAdmin.phone
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Gagal update');
        }

        showAdminToast('Produk berhasil diupdate!', 'success');
        await loadAdminDashboard();
        
        // Refresh main menu
        if (typeof muatMenu === 'function') {
            muatMenu();
        }

    } catch (error) {
        console.error('Error updating product:', error);
        alert('Gagal update: ' + error.message);
    } finally {
        updateBtn.innerHTML = originalText;
        updateBtn.disabled = false;
    }
}

async function deleteProduct(productId) {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    
    try {
        const response = await fetch('/.netlify/functions/admin-produk', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: productId,
                admin_phone: currentAdmin.phone
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Gagal hapus');
        }

        showAdminToast('Produk berhasil dihapus!', 'success');
        await loadAdminDashboard();
        
        // Refresh main menu
        if (typeof muatMenu === 'function') {
            muatMenu();
        }

    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Gagal hapus: ' + error.message);
    }
}

// ============================================
// ADMIN MANAGEMENT
// ============================================
async function loadAdminList() {
    try {
        const response = await fetch('/.netlify/functions/admin-manage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getAdmins' })
        });

        const admins = await response.json();
        
        const adminCount = document.getElementById('admin-count');
        if (adminCount) adminCount.textContent = admins.length;
        
        const adminList = document.getElementById('admin-list');
        if (!adminList) return;
        
        if (admins.length === 0) {
            adminList.innerHTML = '<p style="text-align:center; color:#999;">Belum ada admin lain</p>';
            return;
        }
        
        adminList.innerHTML = admins.map(admin => `
            <div class="admin-produk-item">
                <div style="width:40px; height:40px; background:${admin.role === 'super' ? '#ff9800' : '#667eea'}; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; margin-right:15px;">
                    <i class="fas fa-user"></i>
                </div>
                <div class="admin-produk-info">
                    <h4>${admin.name}</h4>
                    <p>${admin.phone} | ${admin.role === 'super' ? 'Super Admin' : 'Admin'}</p>
                </div>
                <div class="admin-produk-actions">
                    ${currentAdmin.role === 'super' && admin.phone !== currentAdmin.phone ? 
                        `<button onclick="deleteAdmin('${admin.phone}')" style="background:#ff4444; color:white;">
                            <i class="fas fa-trash"></i>
                        </button>` : ''
                    }
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading admins:', error);
        const adminList = document.getElementById('admin-list');
        if (adminList) {
            adminList.innerHTML = '<p style="color:#ff4444;">Gagal memuat daftar admin</p>';
        }
    }
}

function showAddAdminForm() {
    const body = document.getElementById('admin-panel-body');
    body.innerHTML = `
        <div class="admin-card">
            <h3><i class="fas fa-user-plus"></i> Tambah Admin Baru</h3>
            
            <div class="admin-form-group">
                <label>Nama Admin</label>
                <input type="text" id="new-admin-name" placeholder="Contoh: Admin 2">
            </div>
            
            <div class="admin-form-group">
                <label>No. WhatsApp</label>
                <input type="text" id="new-admin-phone" placeholder="08123456789">
            </div>
            
            <div class="admin-form-group">
                <label>Role</label>
                <select id="new-admin-role">
                    <option value="admin">Admin Biasa</option>
                    <option value="super">Super Admin</option>
                </select>
            </div>
            
            <div style="display:flex; gap:10px;">
                <button class="admin-btn admin-btn-primary" onclick="saveNewAdmin()">
                    <i class="fas fa-save"></i> Simpan
                </button>
                <button class="admin-btn admin-btn-secondary" onclick="loadAdminDashboard()">
                    Batal
                </button>
            </div>
        </div>
    `;
}

async function saveNewAdmin() {
    const name = document.getElementById('new-admin-name')?.value.trim();
    const phone = document.getElementById('new-admin-phone')?.value.trim();
    const role = document.getElementById('new-admin-role')?.value;

    if (!name || !phone) {
        alert('Nama dan No. HP harus diisi!');
        return;
    }

    const saveBtn = event.target;
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<span class="admin-spinner"></span> Menyimpan...';
    saveBtn.disabled = true;

    try {
        const response = await fetch('/.netlify/functions/admin-manage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'addAdmin',
                data: {
                    name: name,
                    phone: phone,
                    role: role,
                    created_by: currentAdmin.phone
                }
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Gagal menyimpan');
        }

        showAdminToast('Admin baru berhasil ditambahkan!', 'success');
        await loadAdminDashboard();

    } catch (error) {
        console.error('Error saving admin:', error);
        alert('Gagal menyimpan: ' + error.message);
    } finally {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

async function deleteAdmin(phone) {
    if (!confirm('Yakin ingin menghapus admin ini?')) return;

    const deleteBtn = event.target;
    const originalText = deleteBtn.innerHTML;
    deleteBtn.innerHTML = '<span class="admin-spinner"></span>';
    deleteBtn.disabled = true;

    try {
        const response = await fetch('/.netlify/functions/admin-manage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'deleteAdmin',
                data: {
                    phone: phone,
                    deleted_by: currentAdmin.phone
                }
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Gagal menghapus');
        }

        showAdminToast('Admin berhasil dihapus!', 'success');
        await loadAdminDashboard();

    } catch (error) {
        console.error('Error deleting admin:', error);
        alert('Gagal menghapus: ' + error.message);
    } finally {
        deleteBtn.innerHTML = originalText;
        deleteBtn.disabled = false;
    }
}

// ============================================
// THEME MANAGEMENT
// ============================================
function saveTheme() {
    const gradient = document.getElementById('theme-gradient')?.value;
    const wallpaper = document.getElementById('theme-wallpaper')?.value;

    if (!gradient || !wallpaper) {
        alert('Semua field harus diisi!');
        return;
    }

    const theme = {
        gradient: gradient,
        wallpaper: wallpaper
    };

    localStorage.setItem('cee_theme', JSON.stringify(theme));
    
    // Apply theme
    applyTheme();
    
    showAdminToast('Tema berhasil disimpan!', 'success');
}

function applyTheme() {
    const hero = document.querySelector('.dashboard-hero');
    const theme = JSON.parse(localStorage.getItem('cee_theme'));
    
    if (hero && theme) {
        hero.style.background = `linear-gradient(rgba(255,255,255,0.5), rgba(255,255,255,0.5)), url('${theme.wallpaper}')`;
        hero.style.backgroundSize = 'cover';
        hero.style.backgroundPosition = 'center';
    }
}

// ============================================
// ADMIN LOGOUT
// ============================================
function logoutAdmin() {
    if (confirm('Yakin ingin logout dari admin?')) {
        localStorage.removeItem('cee_admin');
        currentAdmin = null;
        hideAdminFAB();
        closeAdminPanel();
        showAdminToast('Berhasil logout', 'info');
    }
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showAdminToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'admin-toast';
    
    const colors = {
        success: '#00C851',
        error: '#ff4444',
        info: '#33b5e5',
        warning: '#ffbb33'
    };
    
    toast.style.backgroundColor = colors[type] || colors.info;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                         type === 'error' ? 'fa-exclamation-circle' : 
                         type === 'warning' ? 'fa-exclamation-triangle' : 
                         'fa-info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
} else {
    initAdmin();
}

// ============================================
// FUNGSI DEBUG (AMAN)
// ============================================
function testProdukAPI() {
    fetch('/.netlify/functions/get-produk')
        .then(res => res.json())
        .then(data => {
            console.log('API Response:', data);
            alert(`Sukses! Jumlah produk: ${data.length}`);
        })
        .catch(err => {
            console.error('API Error:', err);
            alert('Error: ' + err.message);
        });
}

// Panggil otomatis saat admin panel dibuka (untuk debug)
document.addEventListener('admin-panel-opened', function() {
    testProdukAPI();
});
