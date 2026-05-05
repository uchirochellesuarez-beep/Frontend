-- Backfill principal_amount for existing loans that don't have it set
-- This calculates the principal based on loan_amount / (1 + interest_rate/100)
UPDATE loans 
SET principal_amount = ROUND(loan_amount / (1 + (interest_rate / 100)), 2)
WHERE principal_amount IS NULL AND loan_amount IS NOT NULL AND interest_rate IS NOT NULL;
