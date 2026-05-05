// direct-test-notifications.js
// Direct test of notifications for specific dates
// Run: node backend/direct-test-notifications.js

const pool = require('./db');
const { generateDueDateNotifications } = require('./routes/notifications');

async function testNotifications() {
  console.log('\n' + '='.repeat(80));
  console.log('   DIRECT NOTIFICATION TEST - SEPTEMBER 8, 2026 LOAN');
  console.log('='.repeat(80) + '\n');

  try {
    // Test Scenario 1: September 7 (Due Tomorrow)
    console.log('📅 TEST 1: September 7, 2026 (Due Tomorrow)');
    console.log('-'.repeat(80));
    
    const count1 = await generateDueDateNotifications('2026-09-07');
    console.log(`✅ Generated ${count1} notification(s) for September 7\n`);

    // Show notifications
    const [notifs1] = await pool.execute(`
      SELECT n.*, f.full_name
      FROM due_date_notifications n
      JOIN farmers f ON n.farmer_id = f.id
      WHERE DATE(n.trigger_date) = '2026-09-07'
      ORDER BY n.created_at DESC
      LIMIT 3
    `);

    if (notifs1.length > 0) {
      console.log('📬 Notifications for September 7:');
      notifs1.forEach((n, i) => {
        console.log(`${i + 1}. ${n.title}`);
        console.log(`   ${n.message}`);
        console.log(`   Farmer: ${n.full_name}\n`);
      });
    } else {
      console.log('⚠️  No notifications found for September 7\n');
    }

    console.log('✅ SCENARIO 1 COMPLETE');
    console.log('   • Refresh app (F5)');
    console.log('   • Click bell 🔔');
    console.log('   • Should see: "Loan Due Tomorrow" or similar\n');

    // Test Scenario 2: September 9 (Overdue with penalty)
    console.log('📅 TEST 2: September 9, 2026 (Overdue - Penalty)');
    console.log('-'.repeat(80));
    
    const count2 = await generateDueDateNotifications('2026-09-09');
    console.log(`✅ Generated ${count2} notification(s) for September 9\n`);

    // Show notifications
    const [notifs2] = await pool.execute(`
      SELECT n.*, f.full_name
      FROM due_date_notifications n
      JOIN farmers f ON n.farmer_id = f.id
      WHERE DATE(n.trigger_date) = '2026-09-09'
      OR (DATE(n.due_date) = '2026-09-08' AND n.notification_type = 'overdue_penalty')
      ORDER BY n.created_at DESC
      LIMIT 3
    `);

    if (notifs2.length > 0) {
      console.log('📬 Notifications for September 9:');
      notifs2.forEach((n, i) => {
        console.log(`${i + 1}. ${n.title}`);
        console.log(`   ${n.message}`);
        console.log(`   Farmer: ${n.full_name}\n`);
      });
    } else {
      console.log('⚠️  No notifications found for September 9\n');
    }

    console.log('✅ SCENARIO 2 COMPLETE');
    console.log('   • Refresh app (F5)');
    console.log('   • Click bell 🔔');
    console.log('   • Should see: "Loan Overdue - Penalty Applied" or similar\n');

    // Summary
    console.log('='.repeat(80));
    console.log('📋 SUMMARY');
    console.log('='.repeat(80));
    console.log(`
✅ Scenario 1 (September 7):
   Notifications Generated: ${count1}
   Expected in App: "Loan Due Tomorrow"
   
✅ Scenario 2 (September 9):
   Notifications Generated: ${count2}
   Expected in App: "Loan Overdue - Penalty Applied"

🎯 NEXT STEPS:
   1. Open your app in browser
   2. Refresh page (F5)
   3. Click bell icon 🔔
   4. You should see the notifications!
   
🔄 To test different scenarios again, just run:
   node backend/direct-test-notifications.js
`);

    console.log('='.repeat(80) + '\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    process.exit(0);
  }
}

// Run the test
testNotifications();
