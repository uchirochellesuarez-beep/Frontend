// check-loans.js
// Check loans in database to debug notification generation

const pool = require('./db');

async function checkLoans() {
  console.log('\n' + '='.repeat(80));
  console.log('   CHECKING LOANS IN DATABASE');
  console.log('='.repeat(80) + '\n');

  try {
    // Get ALL loans
    const [allLoans] = await pool.execute(`
      SELECT id, farmer_id, loan_type, loan_amount, remaining_balance, 
             due_date, status, created_at
      FROM loans
      ORDER BY due_date DESC
      LIMIT 20
    `);

    console.log(`📋 Total Loans Found: ${allLoans.length}\n`);

    if (allLoans.length === 0) {
      console.log('❌ NO LOANS FOUND IN DATABASE!\n');
    } else {
      console.log('All Loans:');
      console.log('-'.repeat(80));
      allLoans.forEach((loan, i) => {
        const dueDate = loan.due_date ? new Date(loan.due_date).toISOString().split('T')[0] : 'NULL';
        console.log(`${i + 1}. ID: ${loan.id}`);
        console.log(`   Type: ${loan.loan_type} | Status: ${loan.status}`);
        console.log(`   Amount: ₱${loan.loan_amount} | Remaining: ₱${loan.remaining_balance}`);
        console.log(`   Due Date: ${dueDate}`);
        console.log('');
      });
    }

    // Specifically look for September 8, 2026
    console.log('-'.repeat(80));
    console.log('\n🔍 Looking for loans with due date around September 8, 2026...\n');
    
    const [septemberLoans] = await pool.execute(`
      SELECT id, farmer_id, loan_type, loan_amount, remaining_balance, 
             due_date, status
      FROM loans
      WHERE due_date >= '2026-09-01' AND due_date <= '2026-09-30'
    `);

    if (septemberLoans.length === 0) {
      console.log('❌ NO LOANS WITH SEPTEMBER 2026 DUE DATES FOUND!\n');
      console.log('Solution: You need to create a loan with due date September 8, 2026');
    } else {
      console.log(`✅ Found ${septemberLoans.length} loan(s) in September 2026:\n`);
      septemberLoans.forEach((loan, i) => {
        const dueDate = new Date(loan.due_date).toISOString().split('T')[0];
        console.log(`${i + 1}. Loan ID: ${loan.id}`);
        console.log(`   Farmer ID: ${loan.farmer_id}`);
        console.log(`   Type: ${loan.loan_type}`);
        console.log(`   Status: ${loan.status}`);
        console.log(`   Amount: ₱${loan.loan_amount}`);
        console.log(`   Remaining Balance: ₱${loan.remaining_balance}`);
        console.log(`   Due Date: ${dueDate}\n`);
      });
    }

    // Check notification generation requirements
    console.log('-'.repeat(80));
    console.log('\n📋 REQUIREMENTS FOR NOTIFICATIONS:\n');
    console.log('For "Due Tomorrow" notification:');
    console.log('  ✓ Loan status: "active", "approved", or "overdue"');
    console.log('  ✓ Remaining balance > 0');
    console.log('  ✓ Due date is set');
    console.log('  ✓ Trigger date = due date - 1 day\n');
    console.log('For "Overdue - Penalty" notification:');
    console.log('  ✓ Loan status: "overdue"');
    console.log('  ✓ Remaining balance > 0');
    console.log('  ✓ Due date < today\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

checkLoans();
