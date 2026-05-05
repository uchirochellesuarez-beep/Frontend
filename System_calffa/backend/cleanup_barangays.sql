-- ============================================
-- CLEANUP SCRIPT: Delete all barangays except Camansihan (1) and Managpi (2)
-- WARNING: This will delete all associated data!
-- ============================================

-- Step 1: Get farmer IDs from barangays to be deleted
-- (For reference - not needed for deletion)

-- Step 2: Delete all transaction records from farmers in other barangays
DELETE FROM loan_payments 
WHERE loan_id IN (
  SELECT id FROM loans 
  WHERE farmer_id IN (
    SELECT id FROM farmers WHERE barangay_id NOT IN (1, 2)
  )
);

DELETE FROM loans 
WHERE farmer_id IN (
  SELECT id FROM farmers WHERE barangay_id NOT IN (1, 2)
);

DELETE FROM contributions 
WHERE farmer_id IN (
  SELECT id FROM farmers WHERE barangay_id NOT IN (1, 2)
);

DELETE FROM share_capital_contributions 
WHERE farmer_id IN (
  SELECT id FROM farmers WHERE barangay_id NOT IN (1, 2)
);

DELETE FROM share_capital_withdrawals 
WHERE farmer_id IN (
  SELECT id FROM farmers WHERE barangay_id NOT IN (1, 2)
);

DELETE FROM farmer_income_pesticides 
WHERE record_id IN (
  SELECT id FROM farmer_income_records 
  WHERE farmer_id IN (
    SELECT id FROM farmers WHERE barangay_id NOT IN (1, 2)
  )
);

DELETE FROM farmer_income_fertilizers 
WHERE record_id IN (
  SELECT id FROM farmer_income_records 
  WHERE farmer_id IN (
    SELECT id FROM farmers WHERE barangay_id NOT IN (1, 2)
  )
);

DELETE FROM farmer_income_records 
WHERE farmer_id IN (
  SELECT id FROM farmers WHERE barangay_id NOT IN (1, 2)
);

DELETE FROM machinery_bookings 
WHERE machinery_id IN (
  SELECT id FROM machinery_inventory 
  WHERE barangay_id NOT IN (1, 2)
);

DELETE FROM machinery_operators 
WHERE machinery_id IN (
  SELECT id FROM machinery_inventory 
  WHERE barangay_id NOT IN (1, 2)
);

DELETE FROM machinery_inventory 
WHERE barangay_id NOT IN (1, 2);

-- Step 3: Delete barangay-specific records
DELETE FROM barangay_officers 
WHERE barangay_id NOT IN (1, 2);

DELETE FROM barangay_contributions 
WHERE barangay_id NOT IN (1, 2);

DELETE FROM barangay_activities 
WHERE barangay_id NOT IN (1, 2);

-- Step 4: Delete farmers from barangays being removed
DELETE FROM farmers 
WHERE barangay_id NOT IN (1, 2);

-- Step 5: Delete all activity logs related to deleted farmers
DELETE FROM activity_logs 
WHERE farmer_id NOT IN (
  SELECT id FROM farmers
);

-- Step 6: Finally, delete the barangay records
DELETE FROM barangays 
WHERE id NOT IN (1, 2);

-- Step 7: Verify - Check remaining barangays
SELECT * FROM barangays;

-- Step 8: Verify - Check remaining farmers
SELECT COUNT(*) as total_farmers, COUNT(DISTINCT barangay_id) as unique_barangays 
FROM farmers;

-- ============================================
-- CLEANUP COMPLETE
-- Remaining data: Only Camansihan (1) and Managpi (2) barangays with their farmers/transactions
-- ============================================
