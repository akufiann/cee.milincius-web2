const { Client } = require('pg');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
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

    // GET - Ambil semua produk
    if (event.httpMethod === 'GET') {
      const result = await client.query('SELECT * FROM produk ORDER BY id DESC');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows)
      };
    }

    // POST - Tambah produk
    if (event.httpMethod === 'POST') {
      const { nama, harga, kategori, gambar_url, deskripsi, admin_phone } = JSON.parse(event.body);
      
      if (!nama || !harga || !gambar_url) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Nama, harga, dan gambar wajib diisi' })
        };
      }

      const result = await client.query(
        `INSERT INTO produk (nama, harga, kategori, gambar_url, deskripsi, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [nama, harga, kategori || 'Umum', gambar_url, deskripsi || '', admin_phone]
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, produk: result.rows[0] })
      };
    }

    // PUT - Update produk
    if (event.httpMethod === 'PUT') {
      const { id, nama, harga, kategori, gambar_url, deskripsi, admin_phone } = JSON.parse(event.body);
      
      const result = await client.query(
        `UPDATE produk 
         SET nama = $1, harga = $2, kategori = $3, gambar_url = $4, deskripsi = $5, updated_at = NOW()
         WHERE id = $6 RETURNING *`,
        [nama, harga, kategori, gambar_url, deskripsi, id]
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, produk: result.rows[0] })
      };
    }

    // DELETE - Hapus produk
    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);
      
      await client.query('DELETE FROM produk WHERE id = $1', [id]);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Produk dihapus' })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };

  } catch (err) {
    console.error('Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Server error', error: err.message })
    };
  } finally {
    await client.end();
  }
};
