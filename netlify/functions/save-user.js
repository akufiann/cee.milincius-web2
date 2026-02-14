const { Client } = require('pg');

exports.handler = async (event, context) => {
  // Hanya izinkan metode POST agar tidak sembarang orang bisa akses
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ message: 'Metode Tidak Diizinkan' }) 
    };
  }

  // Mengambil koneksi database dari Environment Variables Netlify (Sangat Aman)
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Wajib untuk koneksi ke Neon
    }
  });

  try {
    // Ambil data yang dikirim dari fixing.js
    const { username, phone, location } = JSON.parse(event.body);

    // Validasi sederhana
    if (!username || !phone) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ message: 'Nama dan Phone wajib diisi' }) 
      };
    }

    await client.connect();
    
    // Query SQL untuk memasukkan data ke tabel users
    // Pastikan di Neon kamu sudah ada tabel bernama 'users'
    const query = 'INSERT INTO users (username, phone, location) VALUES ($1, $2, $3) RETURNING *';
    const values = [username, phone, location];
    
    const result = await client.query(query, values);
    await client.end();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message: "Data berhasil disimpan ke Neon secara rahasia!",
        data: result.rows[0] 
      }),
    };
  } catch (err) {
    console.error("Error Database:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message: "Gagal menyimpan data", 
        error: err.message 
      }),
    };
  }

};

try {
    await client.connect();
    // ... proses simpan ...
} finally {
    // BAGIAN INI WAJIB: Biar koneksi database gak gantung/penuh
    await client.end(); 
}
