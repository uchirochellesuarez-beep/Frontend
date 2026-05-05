const pool = require('./db');

(async () => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SHOW TABLES LIKE "income_assistance_distributions"');
    console.log(rows.length > 0 ? '✅ Table EXISTS' : '❌ Table DOES NOT EXIST');
  } catch(err) {
    console.error('Error:', err.message);
  }
  conn.release();
  process.exit(0);
})();
