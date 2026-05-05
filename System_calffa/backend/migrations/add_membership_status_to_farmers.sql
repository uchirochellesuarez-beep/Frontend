-- Migration: Add membership status to farmers table
-- Description: Adds membership_status column to farmers table to distinguish between members and non-members for pricing

ALTER TABLE farmers ADD COLUMN membership_status ENUM('member', 'non-member') DEFAULT 'member' AFTER status;

ALTER TABLE farmers MODIFY COLUMN membership_status ENUM('member', 'non-member') DEFAULT 'member' COMMENT 'Member status for machinery pricing - member: full access and member pricing, non-member: higher pricing, limited sidebar access';

CREATE INDEX idx_farmers_membership_status ON farmers(membership_status);

CREATE INDEX idx_farmers_status_membership ON farmers(status, membership_status);
