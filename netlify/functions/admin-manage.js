const { Client } = require('pg');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const { action, data } = JSON.parse(event.body || '{}');

    // ============ GET ALL ADMINS ============
    if (action === 'getAdmins') {
      const result = await client.query(
        'SELECT id, name, phone, role, created_at FROM admins ORDER BY id'
      );
      return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
    }

    // ============ ADD NEW ADMIN ============
    if (action === 'addAdmin') {
      const { name, phone, role, created_by } = data;
      
      // Cek duplikat
      const check = await client.query(
        'SELECT * FROM admins WHERE phone = $1',
        [phone]
      );

      if (check.rows.length > 0) {
        return { 
          statusCode: 400, 
          headers, 
          body: JSON.stringify({ message: 'Nomor HP sudah terdaftar' }) 
        };
      }

      const result = await client.query(
        'INSERT INTO admins (name, phone, role, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, phone, role || 'admin', created_by]
      );

      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ success: true, admin: result.rows[0] }) 
      };
    }

    // ============ DELETE ADMIN ============
    if (action === 'deleteAdmin') {
      const { phone, deleted_by } = data;
      
      // Cek jangan hapus diri sendiri
      if (phone === deleted_by) {
        return { 
          statusCode: 400, 
          headers, 
          body: JSON.stringify({ message: 'Tidak bisa menghapus akun sendiri' }) 
        };
      }

      await client.query('DELETE FROM admins WHERE phone = $1', [phone]);
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ success: true }) 
      };
    }

    return { 
      statusCode: 400, 
      headers, 
      body: JSON.stringify({ message: 'Action tidak dikenal' }) 
    };

  } catch (err) {
    console.error('Admin manage error:', err);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ message: 'Server error' }) 
    };
  } finally {
    await client.end();
  }
};