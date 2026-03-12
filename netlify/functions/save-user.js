const { Client } = require('pg');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Hanya izinkan POST
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Metode Tidak Diizinkan' }) 
    };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Parse data dari request
    const { username, phone, location } = JSON.parse(event.body);
    console.log('Menerima data:', { username, phone, location });

    // Validasi
    if (!username || !phone) {
      return { 
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: 'Nama dan No.HP wajib diisi' }) 
      };
    }

    // Koneksi ke database
    await client.connect();
    console.log('Koneksi database berhasil');

    // Buat tabel jika belum ada
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        location TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert data
    const query = 'INSERT INTO users (username, phone, location) VALUES ($1, $2, $3) RETURNING *';
    const values = [username, phone, location || 'Belum diisi'];
    
    const result = await client.query(query, values);
    console.log('Data tersimpan:', result.rows[0]);

    // Tutup koneksi
    await client.end();

    // Kirim response sukses
    return {
      statusCode: 200,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        message: "Data berhasil disimpan!",
        data: result.rows[0] 
      }),
    };

  } catch (err) {
    console.error("Error Database Detail:", err);
    
    // Pastikan koneksi ditutup jika error
    try {
      await client.end();
    } catch (e) {
      // Abaikan error saat tutup koneksi
    }

    // Kirim response error
    return {
      statusCode: 500,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false,
        message: "Gagal menyimpan data", 
        error: err.message
      }),
    };
  }
};
