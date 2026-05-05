// create-test-token.js
// Create a test JWT token with far future expiration for date testing
// Run: node backend/create-test-token.js

const jwt = require('jsonwebtoken');

// Create a token that expires in 10 years (for testing date changes)
const testUserId = 1; // Change this to your test user ID

const token = jwt.sign(
  { id: testUserId },
  process.env.JWT_SECRET || 'your-secret-key',
  { 
    expiresIn: '3650d' // 10 years - won't expire during testing
  }
);

console.log('\n✅ TEST TOKEN CREATED (valid for 10 years)\n');
console.log('Token:', token);
console.log('\n📋 How to use:');
console.log('1. Copy the token above');
console.log('2. Open browser console (F12)');
console.log('3. Run: localStorage.setItem("token", "' + token + '")');
console.log('4. Refresh the page');
console.log('5. You should now be able to test with date changes!\n');
