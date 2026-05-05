const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'agriculture_portal'
    });
    
    // Get a treasurer user to test with
    const [users] = await conn.query(`
      SELECT id, full_name, role, barangay_id 
      FROM farmers 
      WHERE role = 'treasurer'
      LIMIT 1
    `);
    
    if (users.length === 0) {
      console.log('No treasurer found');
      conn.end();
      return;
    }
    
    const user = users[0];
    console.log(`\nTesting with: ${user.full_name} (${user.role})`);
    
    // Create a token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your-secret-key');
    
    // Test notifications endpoint
    console.log('\n--- Testing /api/notifications ---');
    const notifRes = await fetch('http://localhost:3000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Status:', notifRes.status);
    const notifData = await notifRes.json();
    console.log('Response:', JSON.stringify(notifData, null, 2).substring(0, 300));
    
    // Test unread count endpoint
    console.log('\n--- Testing /api/notifications/unread-count ---');
    const countRes = await fetch('http://localhost:3000/api/notifications/unread-count', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Status:', countRes.status);
    const countData = await countRes.json();
    console.log('Response:', countData);
    
    conn.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
