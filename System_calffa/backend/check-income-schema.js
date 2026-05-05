const pool = require('./db');

(async () => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('DESCRIBE farmer_income_records');
    console.log('Current farmer_income_records schema:');
    rows.forEach(r => console.log(`  - ${r.Field}: ${r.Type}`));
  } catch(err) {
    console.error('Error:', err.message);
  }
  conn.release();
  process.exit(0);
})();
