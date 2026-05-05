// complete-notification-test.js
// Complete testing workflow: Create test loan, generate notifications, verify
// Run: node backend/complete-notification-test.js

const pool = require('./db');
const { generateDueDateNotifications } = require('./routes/notifications');

async function completeTest() {
  console.log('\n' + '='.repeat(80));
  console.log('   COMPLETE NOTIFICATION TEST - CREATE DATA & TEST');
  console.log('='.repeat(80) + '\n');

  try {
    // Get current system date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`📅 CURRENT SYSTEM DATE: ${todayStr}\n`);

    // 1. Check if we have any farmers
    const [farmers] = await pool.execute(`
      SELECT id, full_name, reference_number FROM farmers LIMIT 1
    `);

    if (farmers.length === 0) {
      console.log('❌ ERROR: No farmers found in database!');
      console.log('   Please create a farmer account first.\n');
      process.exit(1);
    }

    const testFarmer = farmers[0];
    console.log(`✅ Using test farmer: ${testFarmer.full_name} (ID: ${testFarmer.id})\n`);

    // 2. Create test loans with specific due dates
    console.log('📝 CREATING TEST LOANS FOR NOTIFICATION TESTING...\n');

    // Clear old test loans first
    await pool.execute(`
      DELETE FROM loans WHERE farmer_id = ? AND loan_type = 'test_notifications'
    `, [testFarmer.id]);

    const testScenarios = [
      {
        name: 'Due Tomorrow Test',
        daysFromNow: 1,
        amount: 5000
      },
      {
        name: 'Due Today Test',
        daysFromNow: 0,
        amount: 3000
      },
      {
        name: 'Overdue Test (2 days)',
        daysFromNow: -2,
        amount: 2000
      }
    ];

    for (const scenario of testScenarios) {
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + scenario.daysFromNow);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      await pool.execute(`
        INSERT INTO loans (
          farmer_id, loan_type, loan_amount, remaining_balance, 
          due_date, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [
        testFarmer.id,
        'test_notifications',
        scenario.amount,
        scenario.amount,
        dueDateStr,
        scenario.daysFromNow <= -1 ? 'overdue' : 'active'
      ]);

      const triggerDate = new Date(dueDate);
      triggerDate.setDate(triggerDate.getDate() - 1);
      const triggerDateStr = triggerDate.toISOString().split('T')[0];

      console.log(`  ✅ ${scenario.name}`);
      console.log(`     📍 Trigger date (notification day): ${triggerDateStr}`);
      console.log(`     📅 Due date: ${dueDateStr}`);
      console.log(`     💰 Amount: ₱${scenario.amount.toLocaleString()}\n`);
    }

    // 3. Show notification generation
    console.log('-'.repeat(80));
    console.log('\n🔔 GENERATING NOTIFICATIONS FOR TODAY...\n');
    const generated = await generateDueDateNotifications();
    console.log(`✅ Generated: ${generated} notification(s)\n`);

    // 4. Query and display all notifications
    console.log('-'.repeat(80));
    console.log('\n📬 NOTIFICATIONS IN DATABASE:\n');

    const [notifications] = await pool.execute(`
      SELECT n.*, f.full_name, f.reference_number
      FROM due_date_notifications n
      JOIN farmers f ON n.farmer_id = f.id
      WHERE f.id = ?
      ORDER BY n.trigger_date ASC
    `, [testFarmer.id]);

    if (notifications.length === 0) {
      console.log('⚠️  No notifications yet. This means:');
      console.log('   1. Today\'s date doesn\'t match any trigger dates, OR');
      console.log('   2. Notifications were already created before\n');
      console.log('Solution: You need to CHANGE YOUR SYSTEM DATE to a trigger date!\n');
    } else {
      notifications.forEach((notif, i) => {
        const triggerDate = notif.trigger_date ? new Date(notif.trigger_date).toISOString().split('T')[0] : 'N/A';
        const isToday = triggerDate === todayStr;
        const marker = isToday ? ' 👈 TODAY' : '';
        console.log(`${i + 1}. ${notif.title}${marker}`);
        console.log(`   ${notif.message}`);
        console.log(`   Trigger: ${triggerDate} | Status: ${notif.is_read ? 'Read' : 'Unread'}\n`);
      });
    }

    // 5. Testing instructions
    console.log('-'.repeat(80));
    console.log('\n🧪 HOW TO TEST NOTIFICATIONS:\n');
    console.log('STEP 1: Change your system date to one of the trigger dates above');
    console.log('   Windows: Settings → Time & language → Date & time');
    console.log('   Turn OFF "Set time automatically", then change the date\n');
    
    console.log('STEP 2: Run this script again to generate notifications for that date:');
    console.log('   node backend/complete-notification-test.js\n');
    
    console.log('STEP 3: Open the app and click the bell icon 🔔');
    console.log('   You should see the notification appear!\n');
    
    console.log('STEP 4: Repeat with different dates to test the 3 scenarios\n');

    const tomorrowDate = new Date(today);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

    console.log('EXAMPLE - Test "Due Tomorrow" notification:');
    console.log(`  1. Change system date to: ${tomorrowStr}`);
    console.log('  2. Run: node backend/complete-notification-test.js');
    console.log('  3. Click bell icon → should show "Due Tomorrow"\n');

    console.log('='.repeat(80) + '\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    process.exit(0);
  }
}

completeTest();
