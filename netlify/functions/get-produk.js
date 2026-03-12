const { Client } = require('pg');

exports.handler = async (event, context) => {
  console.log('=== GET PRODUK DEBUG ===');
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // CEK ENVIRONMENT VARIABLE
  const envVars = {
    DATABASE_URL: process.env.DATABASE_URL ? 'ADA' : 'TIDAK ADA',
    NODE_ENV: process.env.NODE_ENV,
    LANG: process.env.LANG
  };
  
  console.log('Environment check:', envVars);

  // Jika DATABASE_URL tidak ada, return error jelas
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL TIDAK ADA di environment!');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'DATABASE_URL not found',
        message: 'Environment variable DATABASE_URL tidak ditemukan. Silakan tambahkan di Netlify dashboard.',
        env: envVars
      })
    };
  }

  // Tampilkan preview (aman, tidak tampilkan full password)
  const dbUrlPreview = process.env.DATABASE_URL.replace(/:([^@]+)@/, ':***@');
  console.log('✅ DATABASE_URL ada:', dbUrlPreview);

  // CEK APAKAH MASIH MENGARAH KE LOCALHOST?
  if (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')) {
    console.error('❌ DATABASE_URL masih mengarah ke localhost!');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Wrong database host',
        message: 'DATABASE_URL masih mengarah ke localhost. Gunakan connection string dari Neon.',
        current_host: process.env.DATABASE_URL
      })
    };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
      sslmode: 'require'
    }
  });

  try {
    console.log('Mencoba koneksi ke database...');
    await client.connect();
    console.log('✅ Koneksi berhasil!');

    // Cek tabel produk
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'produk'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Table not found',
          message: 'Tabel "produk" tidak ada. Jalankan CREATE TABLE di Neon.'
        })
      };
    }

    // Ambil data
    const result = await client.query('SELECT * FROM produk ORDER BY id ASC');
    console.log(`✅ Mendapatkan ${result.rows.length} produk`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.rows)
    };

  } catch (err) {
    console.error('❌ Database error:', err);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: err.message,
        code: err.code,
        detail: err.detail || err.stack,
        suggestion: 'Periksa DATABASE_URL di Netlify dashboard. Pastikan menggunakan URL dari Neon.'
      })
    };

  } finally {
    await client.end();
  }
};
