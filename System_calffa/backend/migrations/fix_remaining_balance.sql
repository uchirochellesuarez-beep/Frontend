-- Fix corrupted remaining_balance that doesn't match loan_amount for unsettled loans
-- For unpaid or partially paid loans, remaining_balance should be: loan_amount - total_paid
UPDATE loans 
SET remaining_balance = (loan_amount - COALESCE(total_paid, 0))
WHERE (
  (status IN ('pending', 'approved', 'active', 'overdue'))
  AND (remaining_balance != (loan_amount - COALESCE(total_paid, 0)))
);
