-- Migration: Add member and non-member pricing to machinery inventory
-- Description: Adds separate price fields for members and non-members to machinery_inventory table

ALTER TABLE machinery_inventory ADD COLUMN member_price DECIMAL(10, 2) AFTER price_per_unit;

ALTER TABLE machinery_inventory ADD COLUMN non_member_price DECIMAL(10, 2) AFTER member_price;

-- Update existing records: set member_price to current price_per_unit and non_member_price to 25% higher
UPDATE machinery_inventory 
SET member_price = price_per_unit, 
    non_member_price = ROUND(price_per_unit * 1.25, 2)
WHERE member_price IS NULL;

-- Add comments to explain the columns
ALTER TABLE machinery_inventory MODIFY COLUMN member_price DECIMAL(10, 2) COMMENT 'Price per unit for barangay/association members';

ALTER TABLE machinery_inventory MODIFY COLUMN non_member_price DECIMAL(10, 2) COMMENT 'Price per unit for non-members (typically 20-30% higher)';

-- Note: price_per_unit is kept for backward compatibility
ALTER TABLE machinery_inventory MODIFY COLUMN price_per_unit DECIMAL(10, 2) COMMENT 'Legacy field - use member_price or non_member_price instead';
