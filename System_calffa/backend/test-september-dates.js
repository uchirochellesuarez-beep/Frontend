// test-september-dates.js
// Test notifications for Loan ID 24 (due date: September 8, 2026)
// Farmer ID: 2

const pool = require('./db');

async function testSeptemberDates() {
  console.log('\n' + '='.repeat(80));
  console.log('   TEST NOTIFICATIONS - LOAN ID 24 (Due Sept 8, 2026)');
  console.log('='.repeat(80) + '\n');

  try {
    // Clear existing notifications for this loan
    await pool.execute(`
      DELETE FROM due_date_notifications WHERE reference_id = 24
    `);
    console.log('✅ Cleared old notifications\n');

    console.log('📝 Inserting test notifications...\n');

    // Test 1: September 7 (Due Tomorrow)
    await pool.execute(`
      INSERT INTO due_date_notifications 
      (farmer_id, reference_type, reference_id, notification_type, title, message, due_date, trigger_date, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      2,
      'loan',
      24,
      '1_day',
      '💰 Loan Due Tomorrow',
      'Your agricultural loan will be due tomorrow. Remaining balance: ₱5,050.00',
      '2026-09-08',
      '2026-09-07',
      0
    ]);
    console.log('1. ✅ September 7 - "Due Tomorrow" notification created');
    console.log('   Title: 💰 Loan Due Tomorrow');
    console.log('   Farmer ID: 2\n');

    // Test 2: September 9 (Overdue - Penalty)
    await pool.execute(`
      INSERT INTO due_date_notifications 
      (farmer_id, reference_type, reference_id, notification_type, title, message, due_date, trigger_date, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      2,
      'loan',
      24,
      'overdue_penalty',
      '⚠️ Loan Overdue - Penalty Applied',
      'Your loan is now overdue. Days overdue: 1 | Penalty: ₱101.00 (1 period) | New total with penalty: ₱5,151.00',
      '2026-09-08',
      '2026-09-09',
      0
    ]);
    console.log('2. ✅ September 9 - "Overdue - Penalty" notification created');
    console.log('   Title: ⚠️ Loan Overdue - Penalty Applied');
    console.log('   Farmer ID: 2\n');

    // Verify both notifications
    const [notifs] = await pool.execute(`
      SELECT 
        id, 
        farmer_id, 
        title, 
        message,
        notification_type,
        trigger_date,
        due_date
      FROM due_date_notifications
      WHERE reference_id = 24
      ORDER BY trigger_date ASC
    `);

    console.log('='.repeat(80));
    console.log('\n✅ NOTIFICATIONS VERIFIED:\n');
    notifs.forEach((n, i) => {
      const triggerDate = n.trigger_date ? new Date(n.trigger_date).toISOString().split('T')[0] : 'N/A';
      console.log(`${i + 1}. ${n.title}`);
      console.log(`   Type: ${n.notification_type}`);
      console.log(`   Trigger: ${triggerDate}`);
      console.log(`   Message: ${n.message}`);
      console.log('');
    });

    console.log('='.repeat(80));
    console.log('\n🎯 TEST INSTRUCTIONS:\n');
    console.log('Both notifications have been created and are visible in the database!');
    console.log('');
    console.log('TO VIEW IN YOUR APP:');
    console.log('  1. Refresh your app (F5)');
    console.log('  2. Click the bell icon 🔔 in the top-right');
    console.log('  3. You should see BOTH notifications:');
    console.log('     • 💰 Loan Due Tomorrow (Sept 7)');
    console.log('     • ⚠️ Loan Overdue - Penalty Applied (Sept 9)');
    console.log('');
    console.log('The date should display as:');
    console.log('  • "Tomorrow" for Sept 7');
    console.log('  • "1 days ago" for Sept 9 (or a specific date)');
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    process.exit(0);
  }
}

testSeptemberDates();
