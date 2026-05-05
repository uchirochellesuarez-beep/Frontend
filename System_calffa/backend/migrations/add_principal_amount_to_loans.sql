-- Add principal_amount column to loans table to store original loan amount without interest
ALTER TABLE loans ADD COLUMN IF NOT EXISTS principal_amount DECIMAL(10, 2) NULL COMMENT 'Original principal amount before interest' AFTER loan_amount;
