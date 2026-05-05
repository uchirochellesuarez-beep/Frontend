const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function testPictureUpload() {
  try {
    // Connect to database
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

    // Get first machinery  
    const [machinery] = await connection.execute(
      'SELECT id, machinery_name, machinery_picture FROM machinery_inventory LIMIT 1'
    );

    if (!machinery || machinery.length === 0) {
      console.log('❌ No machinery records found. Please add a machinery first.');
      connection.release();
      pool.end();
      return;
    }

    const machineId = machinery[0].id;
    const machineName = machinery[0].machinery_name;
    const currentPicture = machinery[0].machinery_picture;

    console.log('\n🔍 Test Setup:');
    console.log(`  Machinery ID: ${machineId}`);
    console.log(`  Machinery Name: ${machineName}`);
    console.log(`  Current Picture: ${currentPicture || '(NULL)'}`);

    // Check if uploads/machinery directory exists
    const uploadDir = path.join(__dirname, 'uploads', 'machinery');
    const dirExists = fs.existsSync(uploadDir);
    console.log(`\n📂 Uploads Directory Check:`);
    console.log(`  Path: ${uploadDir}`);
    console.log(`  Exists: ${dirExists ? '✓ YES' : '❌ NO'}`);

    if (!dirExists) {
      console.log('  ⚠️  Creating directory...');
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('  ✓ Directory created');
    }

    // List files in directory
    const files = fs.readdirSync(uploadDir);
    console.log(`\n📋 Files in uploads/machinery directory: ${files.length}`);
    if (files.length > 0) {
      files.slice(0, 5).forEach(f => console.log(`    - ${f}`));
      if (files.length > 5) console.log(`    ... and ${files.length - 5} more`);
    }

    // Verify database has no picture
    console.log(`\n✓ Test Status: Database ready for picture upload test`);
    console.log(`  Next steps:`);
    console.log(`  1. Go to Machinery Management page`);
    console.log(`  2. Click edit on "Harvester" (ID: ${machineId})`);
    console.log(`  3. Click "Upload Picture" button`);
    console.log(`  4. Select an image file`);
    console.log(`  5. Files will be saved to: C:\\xampp\\htdocs\\calffa_blockchain_integrated\\CALLFA\\System_calffa\\backend\\uploads\\machinery`);

    connection.release();
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testPictureUpload();
