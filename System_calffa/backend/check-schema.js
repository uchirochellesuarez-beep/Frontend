const mysql = require('mysql2/promise');

async function checkSchema() {
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
    const [columns] = await connection.execute('DESCRIBE machinery_inventory');
    
    console.log('\n📋 machinery_inventory columns:');
    const fieldNames = columns.map(col => col.Field);
    fieldNames.forEach(name => console.log('  -', name));
    
    const hasPictureColumn = fieldNames.includes('machinery_picture');
    console.log('\n✓ machinery_picture column exists:', hasPictureColumn);
    
    if (!hasPictureColumn) {
      console.log('\n⚠️ machinery_picture column NOT FOUND!');
      console.log('Need to add it manually');
    }
    
    connection.release();
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
