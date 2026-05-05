const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

async function testCompleteUploadFlow() {
  try {
    console.log('\n🔧 === MACHINERY PICTURE UPLOAD TEST ===\n');

    // Step 1: Connect to database
    console.log('Step 1: Connecting to database...');
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
    console.log('✓ Connected to database');

    // Step 2: Get test machinery
    console.log('\nStep 2: Getting test machinery...');
    const [machinery] = await connection.execute(
      'SELECT id, machinery_name, machinery_picture FROM machinery_inventory WHERE id = 16 LIMIT 1'
    );

    if (!machinery || machinery.length === 0) {
      console.log('❌ No machinery with ID 16 found');
      connection.release();
      pool.end();
      return;
    }

    const machineId = machinery[0].id;
    console.log(`✓ Found machinery: ID ${machineId} - ${machinery[0].machinery_name}`);
    console.log(`  Current picture in DB: ${machinery[0].machinery_picture || '(NULL)'}`);

    // Step 3: Create a test image file
    console.log('\nStep 3: Creating test image...');
    const testImagePath = path.join(__dirname, 'test-machinery-image.jpg');
    
    // Create a simple JPEG header (minimal valid JPEG)
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
    ]);
    fs.writeFileSync(testImagePath, jpegHeader);
    console.log(`✓ Created test image: ${testImagePath}`);

    // Step 4: Create fake JWT token (for testing)
    console.log('\nStep 4: Creating test JWT token...');
    const testToken = jwt.sign(
      { id: 1, role: 'admin', barangay_id: 1 },
      'your-secret-key',
      { expiresIn: '1h' }
    );
    console.log(`✓ Token created (admin user)`);

    // Step 5: Test the upload endpoint
    console.log('\nStep 5: Testing upload endpoint...');
    const form = new FormData();
    const fileStream = fs.createReadStream(testImagePath);
    form.append('machinery_picture', fileStream);

    try {
      const response = await fetch(`http://localhost:3000/api/machinery/inventory/${machineId}/picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          ...form.getHeaders()
        },
        body: form
      });

      console.log(`  Response status: ${response.status}`);
      const responseData = await response.json();
      console.log(`  Response body:`, responseData);

      if (response.ok) {
        console.log('✓ Upload request successful');
        
        // Step 6: Verify in database
        console.log('\nStep 6: Verifying in database...');
        const [updated] = await connection.execute(
          'SELECT machinery_picture FROM machinery_inventory WHERE id = ?',
          [machineId]
        );
        
        if (updated[0].machinery_picture) {
          console.log(`✓ Picture saved in DB: ${updated[0].machinery_picture}`);
        } else {
          console.log('❌ Picture NOT saved in database');
        }
      } else {
        console.log(`❌ Upload failed with status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error during upload: ${error.message}`);
    }

    // Cleanup
    fs.unlinkSync(testImagePath);
    connection.release();
    pool.end();

    console.log('\n✓ Test complete');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testCompleteUploadFlow();
