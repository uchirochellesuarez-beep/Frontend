-- Migration: Add picture column to machinery_inventory table
-- Description: Adds machinery_picture column to store image paths for machinery items

ALTER TABLE machinery_inventory ADD COLUMN machinery_picture VARCHAR(255) AFTER description;

ALTER TABLE machinery_inventory MODIFY COLUMN machinery_picture VARCHAR(255) COMMENT 'Path to machinery image/picture file';

CREATE INDEX idx_machinery_picture ON machinery_inventory(machinery_picture);
