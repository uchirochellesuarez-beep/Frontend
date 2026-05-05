const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'agriculture_portal'
    });
    
    // Check for users with officer roles
    const [users] = await conn.query(`
      SELECT id, full_name, role, barangay_id 
      FROM farmers 
      WHERE role IN ('treasurer', 'president', 'admin')
      ORDER BY role
    `);
    
    console.log('\n=== Officers/Admins ===');
    if (users.length === 0) {
      console.log('No officers or admins found');
    } else {
      users.forEach(u => {
        const barangay = u.barangay_id ? `✓ barangay_id: ${u.barangay_id}` : '✗ NO BARANGAY';
        console.log(`${u.role.padEnd(12)} | ${u.full_name.padEnd(30)} | ${barangay}`);
      });
    }
    
    // Check for barangays
    const [barangays] = await conn.query('SELECT id, name FROM barangays ORDER BY id LIMIT 5');
    console.log('\n=== Sample Barangays ===');
    barangays.forEach(b => console.log(`ID ${b.id}: ${b.name}`));
    
    conn.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
