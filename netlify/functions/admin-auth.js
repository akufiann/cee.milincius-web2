const { Client } = require('pg');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers, 
      body: JSON.stringify({ message: 'Method tidak diizinkan' }) 
    };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const { secret, phone } = JSON.parse(event.body);
    
    if (!secret || !phone) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ message: 'Kode dan No.HP wajib diisi' }) 
      };
    }

    // Validasi kode rahasia (gunakan env variable di production)
    if (secret !== 'admin123') {
      return { 
        statusCode: 401, 
        headers, 
        body: JSON.stringify({ message: 'Kode rahasia salah' }) 
      };
    }

    await client.connect();

    const result = await client.query(
      'SELECT id, name, phone, role FROM admins WHERE phone = $1',
      [phone]
    );

    if (result.rows.length === 0) {
      return { 
        statusCode: 403, 
        headers, 
        body: JSON.stringify({ message: 'Nomor HP tidak terdaftar sebagai admin' }) 
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        admin: result.rows[0] 
      })
    };

  } catch (err) {
    console.error('Admin auth error:', err);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ message: 'Server error' }) 
    };
  } finally {
    await client.end();
  }
};