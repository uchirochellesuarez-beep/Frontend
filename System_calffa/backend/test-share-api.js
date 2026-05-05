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
    console.log(`\nTesting with: ${user.full_name} (${user.role}, barangay: ${user.barangay_id})`);
    
    // Create a token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your-secret-key');
    console.log('\nToken:', token.substring(0, 50) + '...');
    
    // Test the API endpoint
    const response = await fetch('http://localhost:3000/api/share-capital/overview', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log('\nResponse Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    conn.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
