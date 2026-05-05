// fix-notification-dates.js
// Insert correct notifications for Loan ID 24 (due Sept 8, 2026)

const pool = require('./db');

async function fixNotifications() {
  console.log('\n' + '='.repeat(80));
  console.log('   FIXING NOTIFICATION DATES - LOAN ID 24');
  console.log('='.repeat(80) + '\n');

  try {
    // Clear old notifications
    await pool.execute(`DELETE FROM due_date_notifications WHERE reference_id = 24`);
    console.log('✅ Cleared old notifications\n');

    // Insert correct notifications
    // Sept 7, 2026: Due Tomorrow (loan due on Sept 8)
    await pool.execute(`
      INSERT INTO due_date_notifications 
      (farmer_id, reference_type, reference_id, notification_type, title, message, due_date, trigger_date, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      2, 'loan', 24, '1_day',
      '💰 Loan Due Tomorrow',
      'Your agricultural loan will be due tomorrow (Sept 8, 2026). Please prepare payment of ₱5,050.00',
      '2026-09-08', '2026-09-07', 0
    ]);

    // Sept 9, 2026: Overdue Penalty (loan was due Sept 8)
    await pool.execute(`
      INSERT INTO due_date_notifications 
      (farmer_id, reference_type, reference_id, notification_type, title, message, due_date, trigger_date, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      2, 'loan', 24, 'overdue_penalty',
      '⚠️ Loan Overdue - Penalty Applied',
      'Your loan is now 1 day overdue (due Sept 8, 2026). Penalty applied: ₱101.00 | Total with penalty: ₱5,151.00',
      '2026-09-08', '2026-09-09', 0
    ]);

    console.log('✅ Created correct notifications:\n');
    console.log('1. Sept 7 (Tomorrow): Due Tomorrow notification');
    console.log('2. Sept 9 (Overdue): Overdue Penalty notification\n');

    // Verify
    const [notifs] = await pool.execute(`
      SELECT 
        id, notification_type, title, due_date, trigger_date
      FROM due_date_notifications
      WHERE reference_id = 24
      ORDER BY trigger_date ASC
    `);

    console.log('='.repeat(80));
    console.log('\n✅ NOTIFICATIONS VERIFIED IN DATABASE:\n');
    notifs.forEach((n, i) => {
      const trigger = new Date(n.trigger_date).toISOString().split('T')[0];
      const due = new Date(n.due_date).toISOString().split('T')[0];
      console.log(`${i + 1}. ${n.title}`);
      console.log(`   Loan Due: ${due} | Trigger: ${trigger}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ READY TO TEST!\n');
    console.log('NEXT: Refresh your app (F5) and click the notification bell 🔔');
    console.log('');
    console.log('You should see:');
    console.log('  • 💰 Loan Due Tomorrow (Trigger: Sept 7)');
    console.log('  • ⚠️ Loan Overdue - Penalty Applied (Trigger: Sept 9)');
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

fixNotifications();
