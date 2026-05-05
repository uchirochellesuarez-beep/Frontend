-- Add pending_penalty column to loans table to track accrued penalties
-- This will store the accumulated penalty amount that farmers must pay
ALTER TABLE loans ADD COLUMN IF NOT EXISTS pending_penalty DECIMAL(10, 2) DEFAULT 0 COMMENT 'Accumulated penalty amount to be paid (applied only after due date if not fully paid)' AFTER remaining_balance;

-- Add penalty_applied_date to track when penalty was first applied
ALTER TABLE loans ADD COLUMN IF NOT EXISTS penalty_applied_date DATE NULL COMMENT 'Date when first penalty was applied' AFTER pending_penalty;
