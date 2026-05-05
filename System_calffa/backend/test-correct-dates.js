// test-correct-dates.js
// Test with correct dates for Loan ID 24 (due date Sept 7)

const pool = require('./db');
const { generateDueDateNotifications } = require('./routes/notifications');

async function testCorrectDates() {
  console.log('\n' + '='.repeat(80));
  console.log('   TESTING LOAN ID 24 - DUE DATE: SEPTEMBER 7, 2026');
  console.log('='.repeat(80) + '\n');

  try {
    // Test 1: September 6 (Due Tomorrow)
    console.log('✅ TEST 1: September 6, 2026 (Due Tomorrow)');
    console.log('-'.repeat(80));
    const count1 = await generateDueDateNotifications('2026-09-06');
    console.log(`Generated: ${count1} notification(s)\n`);

    const [notifs1] = await pool.execute(`
      SELECT n.*, f.full_name
      FROM due_date_notifications n
      JOIN farmers f ON n.farmer_id = f.id
      WHERE n.reference_id = 24
      AND n.notification_type = '1_day'
      ORDER BY n.created_at DESC
      LIMIT 1
    `);

    if (notifs1.length > 0) {
      console.log('💰 NOTIFICATION FOUND:');
      console.log(`   Title: ${notifs1[0].title}`);
      console.log(`   Message: ${notifs1[0].message}`);
      console.log(`   Farmer: ${notifs1[0].full_name}`);
    }
    console.log('');

    // Test 2: September 8 (Overdue)
    console.log('✅ TEST 2: September 8, 2026 (Overdue - Penalty)');
    console.log('-'.repeat(80));
    
    // First, set loan to overdue status
    await pool.execute(`UPDATE loans SET status = 'overdue' WHERE id = 24`);
    
    const count2 = await generateDueDateNotifications('2026-09-08');
    console.log(`Generated: ${count2} notification(s)\n`);

    const [notifs2] = await pool.execute(`
      SELECT n.*, f.full_name
      FROM due_date_notifications n
      JOIN farmers f ON n.farmer_id = f.id
      WHERE n.reference_id = 24
      AND n.notification_type = 'overdue_penalty'
      ORDER BY n.created_at DESC
      LIMIT 1
    `);

    if (notifs2.length > 0) {
      console.log('⚠️ NOTIFICATION FOUND:');
      console.log(`   Title: ${notifs2[0].title}`);
      console.log(`   Message: ${notifs2[0].message}`);
      console.log(`   Farmer: ${notifs2[0].full_name}`);
    }
    console.log('');

    // Reset loan status back
    await pool.execute(`UPDATE loans SET status = 'approved' WHERE id = 24`);

    console.log('='.repeat(80));
    console.log('✅ TESTING COMPLETE\n');
    console.log('📝 SUMMARY:');
    console.log(`
  Loan ID 24:
    • Due Date: September 7, 2026
    • Amount: ₱5,050
    
  Test 1 - September 6:
    • Trigger: "Due Tomorrow" notification ✅
    • Generated: ${count1} notification(s)
    
  Test 2 - September 8:
    • Trigger: "Overdue - Penalty Applied" notification ✅
    • Generated: ${count2} notification(s)

🎯 NEXT STEPS:
  1. Open your app in browser
  2. Refresh (F5)
  3. Click bell 🔔 to see notifications!
`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

testCorrectDates();
