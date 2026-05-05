const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testImageServing() {
  try {
    console.log('\n🖼️  === IMAGE SERVING TEST ===\n');

    // Test 1: Fetch inventory to see machinery_picture field
    console.log('Test 1: Fetching machinery inventory...');
    const response = await fetch('http://localhost:3000/api/machinery/inventory?status=Available');
    const data = await response.json();
    
    const machinery = data.inventory.find(m => m.id === 16);
    if (machinery) {
      console.log(`✓ Found machinery: ${machinery.machinery_name}`);
      console.log(`  Picture path in inventory: ${machinery.machinery_picture || '(NULL)'}`);
      
      // Test 2: Try to access the image via static files
      if (machinery.machinery_picture) {
        console.log(`\nTest 2: Attempting to access image...`);
        const imageUrl = `http://localhost:3000${machinery.machinery_picture}`;
        console.log(`  URL: ${imageUrl}`);
        
        try {
          const imageResponse = await fetch(imageUrl);
          console.log(`  Status: ${imageResponse.status}`);
          if (imageResponse.ok) {
            console.log('  ✓ Image is accessible!');
            const contentType = imageResponse.headers.get('content-type');
            console.log(`  Content-type: ${contentType}`);
          } else {
            console.log(`  ❌ Image not accessible (${imageResponse.status})`);
          }
        } catch (err) {
          console.log(`  ❌ Connection error: ${err.message}`);
        }
      }
    } else {
      console.log('❌ Machinery with ID 16 not found in inventory');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testImageServing();
