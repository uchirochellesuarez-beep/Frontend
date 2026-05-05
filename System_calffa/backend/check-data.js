const mysql = require('mysql2/promise');

async function checkData() {
  try {
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'agriculture_portal',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    const connection = await pool.getConnection();
    const [machinery] = await connection.execute(
      'SELECT id, machinery_name, machinery_picture FROM machinery_inventory LIMIT 5'
    );
    
    console.log('\n📋 Machinery Records Sample:');
    if (machinery.length === 0) {
      console.log('  No machinery records found');
    } else {
      machinery.forEach(m => {
        console.log(`  ID ${m.id}: ${m.machinery_name}`);
        console.log(`    Picture: ${m.machinery_picture || '(NULL)'}`);
      });
    }
    
    connection.release();
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkData();
