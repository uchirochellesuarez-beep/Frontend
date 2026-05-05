const pool = require('./db');

(async () => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('DESCRIBE users');
    console.log('Users table structure:');
    rows.forEach(r => console.log(`  ${r.Field}: ${r.Type}`));
    
    const [rows2] = await conn.query('DESCRIBE farmer_income_records');
    console.log('\nFarmer Income Records table structure:');
    rows2.forEach(r => console.log(`  ${r.Field}: ${r.Type}`));
  } catch(err) {
    console.error('Error:', err.message);
  }
  conn.release();
  process.exit(0);
})();
