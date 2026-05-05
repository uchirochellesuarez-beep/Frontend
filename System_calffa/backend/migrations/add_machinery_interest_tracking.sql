-- Add interest tracking columns to machinery_bookings table
-- This enables automatic interest calculation after due date (30 days from booking)
-- Similar to the loan penalty system

-- Add pending_interest column to track accumulated interest on overdue bookings
ALTER TABLE machinery_bookings
ADD COLUMN pending_interest DECIMAL(10, 2) DEFAULT 0.00 AFTER remaining_balance,
ADD COLUMN interest_applied_date DATE AFTER pending_interest;

-- Create index for overdue machinery queries
CREATE INDEX idx_machinery_bookings_overdue ON machinery_bookings(payment_status, booking_date);
