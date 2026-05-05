const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'agriculture_portal'
    });
    
    const [tables] = await conn.query('SHOW TABLES LIKE "share%"');
    console.log('Share capital tables:', tables);
    
    if (tables.length > 0) {
      const [cols1] = await conn.query('DESCRIBE share_capital_contributions');
      const [cols2] = await conn.query('DESCRIBE share_capital_withdrawals');
      console.log('\nshare_capital_contributions columns:', cols1.map(c => c.Field));
      console.log('share_capital_withdrawals columns:', cols2.map(c => c.Field));
    }
    
    conn.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
