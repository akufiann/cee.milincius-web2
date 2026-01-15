const { Client } = require('pg');

exports.handler = async (event, context) => {
  // 1. Buat koneksi ke Neon Postgres
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Wajib ada agar koneksi Neon tidak ditolak
    }
  });

  try {
    // 2. Membuka pintu koneksi
    await client.connect();

    // 3. Mengambil data (Pastikan nama kolom 'gambar' sudah kamu buat di Neon)
    const query = 'SELECT id, nama, harga, kategori, gambar FROM produk ORDER BY id ASC';
    const result = await client.query(query);

    // 4. Kirim data ke website (Frontend)
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        // Menghindari masalah CORS (izin akses)
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify(result.rows),
    };

  } catch (err) {
    // Jika ada error (misal: tabel belum dibuat atau link DATABASE_URL salah)
    console.error("Database Error:", err.message);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Gagal mengambil data produk", 
        detail: err.message 
      }),
    };

  } finally {
    // 5. Tutup koneksi (Sangat penting agar database tidak penuh)
    await client.end();
  }
};
