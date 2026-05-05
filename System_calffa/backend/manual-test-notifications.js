// manual-test-notifications.js
// Manually insert test notifications to demo the system works

const pool = require('./db');

async function manualTest() {
  console.log('\n' + '='.repeat(80));
  console.log('   MANUAL NOTIFICATION TEST - INSERT TEST DATA');
  console.log('='.repeat(80) + '\n');

  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get the test farmer
    const [farmers] = await pool.execute(`
      SELECT id FROM farmers WHERE id = 2 LIMIT 1
    `);

    if (farmers.length === 0) {
      console.log('❌ Farmer ID 2 not found\n');
      process.exit(1);
    }

    // Clear old test notifications
    await pool.execute(`
      DELETE FROM due_date_notifications 
      WHERE reference_id = 24
    `);

    console.log('✅ Cleared old notifications for Loan 24\n');

    // Manually insert test notifications
    console.log('📝 Inserting test notifications...\n');

    // Test 1: Due Tomorrow (trigger date = today)
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
      '2026-09-07',
      todayStr,
      0
    ]);
    console.log('1. ✅ "Due Tomorrow" notification inserted');
    console.log(`   Trigger: ${todayStr}\n`);

    // Test 2: Overdue Penalty (trigger date = today)
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
      'Your loan is now overdue. Days overdue: 2 | Penalty: ₱202.00 (2 periods) | New total with penalty: ₱5,252.00',
      '2026-09-07',
      todayStr,
      0
    ]);
    console.log('2. ✅ "Overdue - Penalty" notification inserted');
    console.log(`   Trigger: ${todayStr}\n`);

    // Verify
    const [notifs] = await pool.execute(`
      SELECT id, title, notification_type, trigger_date
      FROM due_date_notifications
      WHERE reference_id = 24
      ORDER BY created_at DESC
    `);

    console.log('-'.repeat(80));
    console.log('\n✅ NOTIFICATIONS VERIFIED IN DATABASE:\n');
    notifs.forEach((n, i) => {
      console.log(`${i + 1}. ${n.title}`);
      console.log(`   Type: ${n.notification_type}`);
      console.log(`   Trigger Date: ${n.trigger_date}\n`);
    });

    console.log('='.repeat(80));
    console.log('\n🎯 NEXT STEP - TEST IN YOUR APP:\n');
    console.log('1. Open your app in browser');
    console.log('2. Make sure you\'re logged in');
    console.log('3. Refresh the page (F5)');
    console.log('4. Click the bell icon 🔔 in top-right');
    console.log('5. You should see BOTH notifications:');
    console.log('   • 💰 Loan Due Tomorrow');
    console.log('   • ⚠️ Loan Overdue - Penalty Applied\n');
    console.log('='.repeat(80) + '\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    process.exit(0);
  }
}

manualTest();
