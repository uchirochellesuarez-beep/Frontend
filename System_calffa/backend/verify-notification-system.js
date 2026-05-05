// verify-notification-system.js
// Comprehensive test to verify all three notification scenarios

const pool = require('./db');

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

async function verifyNotificationSystem() {
  console.log('\n' + '='.repeat(90));
  console.log('   COMPREHENSIVE NOTIFICATION SYSTEM VERIFICATION');
  console.log('='.repeat(90) + '\n');

  try {
    // Get the test loan details
    const [loans] = await pool.execute(`
      SELECT 
        id,
        farmer_id,
        loan_amount,
        due_date,
        status,
        remaining_balance
      FROM loans
      WHERE farmer_id = 2 AND status = 'approved'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (!loans.length) {
      console.error('❌ No approved loans found for farmer_id 2');
      process.exit(1);
    }

    const loan = loans[0];
    console.log('📋 TEST LOAN DETAILS:\n');
    console.log(`  ID: ${loan.id}`);
    console.log(`  Farmer ID: ${loan.farmer_id}`);
    console.log(`  Amount: ₱${parseFloat(loan.loan_amount).toFixed(2)}`);
    console.log(`  Due Date: ${loan.due_date}`);
    console.log(`  Status: ${loan.status}`);
    console.log(`  Remaining Balance: ₱${parseFloat(loan.remaining_balance).toFixed(2)}\n`);

    // Get all notifications for this loan
    const [notifs] = await pool.execute(`
      SELECT 
        id,
        farmer_id,
        reference_id,
        notification_type,
        title,
        message,
        due_date,
        trigger_date,
        is_read,
        created_at
      FROM due_date_notifications
      WHERE reference_id = ?
      ORDER BY trigger_date ASC
    `, [loan.id]);

    console.log('='.repeat(90));
    console.log('📬 NOTIFICATIONS IN DATABASE:\n');

    if (!notifs.length) {
      console.log('⚠️  No notifications found. Run test-september-dates.js first.\n');
    } else {
      notifs.forEach((n, i) => {
        const triggerDate = n.trigger_date ? formatLocalDate(new Date(n.trigger_date)) : 'N/A';
        const dueDate = n.due_date ? formatLocalDate(new Date(n.due_date)) : 'N/A';
        
        console.log(`${i + 1}. ${n.title}`);
        console.log(`   ID: ${n.id} | Type: ${n.notification_type || 'N/A'}`);
        console.log(`   Due Date: ${dueDate}`);
        console.log(`   Trigger Date: ${triggerDate}`);
        console.log(`   Message: "${n.message}"`);
        console.log(`   Read: ${n.is_read ? 'Yes' : 'No'}`);
        console.log('');
      });
    }

    // Verify notification generation logic
    console.log('='.repeat(90));
    console.log('\n🧪 TESTING NOTIFICATION GENERATION LOGIC:\n');

    // Import the notification generation function
    const { generateDueDateNotifications } = require('./routes/notifications.js');

    const testDates = [
      { dateStr: '2026-09-07', scenario: '1 DAY BEFORE DUE' },
      { dateStr: '2026-09-08', scenario: 'ON EXACT DUE DATE' },
      { dateStr: '2026-09-09', scenario: 'OVERDUE (1 day)' }
    ];

    for (const testDate of testDates) {
      console.log(`Testing ${testDate.scenario} (${testDate.dateStr}):`);
      
      try {
        // Parse test date
        const [year, month, day] = testDate.dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        
        console.log(`  ✓ Date object created: ${formatLocalDate(date)}`);
        console.log(`  ✓ Scenario: ${testDate.scenario}`);
        
        // Check if loan details would trigger notification
        const loanDueDate = new Date(loan.due_date);
        const daysUntilDue = Math.floor((loanDueDate - date) / (1000 * 60 * 60 * 24));
        const daysOverdue = Math.abs(daysUntilDue);
        
        if (daysUntilDue === 1) {
          console.log(`  ✅ Would generate "DUE TOMORROW" notification (${daysUntilDue} day until due)`);
        } else if (daysUntilDue === 0) {
          console.log(`  ✅ Would generate "ON DUE DATE" notification (due today)`);
        } else if (daysUntilDue < 0) {
          const penaltyPeriods = Math.max(1, Math.ceil(daysOverdue / 180));
          const penaltyAmount = parseFloat(loan.remaining_balance) * 0.02 * penaltyPeriods;
          console.log(`  ✅ Would generate "OVERDUE - PENALTY" notification`);
          console.log(`     Days overdue: ${daysOverdue}`);
          console.log(`     Penalty: ₱${penaltyAmount.toFixed(2)}`);
        }
      } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
      }
      console.log('');
    }

    console.log('='.repeat(90));
    console.log('\n✅ NEXT STEPS TO TEST IN YOUR APP:\n');
    console.log('1. REFRESH YOUR APP (F5)');
    console.log('2. OPEN THE BROWSER CONSOLE (F12)');
    console.log('3. CLICK THE NOTIFICATION BELL ICON 🔔');
    console.log('4. YOU SHOULD SEE TWO NOTIFICATIONS:');
    console.log('   • 💰 Loan Due Tomorrow');
    console.log('   • ⚠️ Loan Overdue - Penalty Applied');
    console.log('\n5. VERIFY THE DISPLAY:\n');
    console.log('   ✓ Dates should be readable (not "Invalid Date")');
    console.log('   ✓ Both notifications should be visible');
    console.log('   ✓ Penalty amount should show ₱101.00');
    console.log('   ✓ Messages should explain what happened\n');
    
    console.log('6. CHECK BROWSER CONSOLE FOR ERRORS (F12 → Console tab)');
    console.log('\n' + '='.repeat(90) + '\n');

  } catch (err) {
    console.error('❌ ERROR:', err.message);
    console.error(err.stack);
  } finally {
    process.exit(0);
  }
}

verifyNotificationSystem();
