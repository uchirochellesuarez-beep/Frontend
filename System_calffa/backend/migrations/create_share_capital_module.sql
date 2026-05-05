-- Migration: Create Share Capital (Savings) Module Tables
-- Description: Adds barangay-based share capital contributions and withdrawals.

CREATE TABLE IF NOT EXISTS share_capital_contributions (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  farmer_id INT UNSIGNED NOT NULL,
  barangay_id INT NOT NULL,
  contribution_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  status ENUM('confirmed', 'cancelled') DEFAULT 'confirmed',
  created_by INT UNSIGNED NULL COMMENT 'Treasurer/Admin who recorded this',
  updated_by INT UNSIGNED NULL COMMENT 'Treasurer/Admin who last updated this',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_scc_farmer_date (farmer_id, contribution_date),
  INDEX idx_scc_barangay_date (barangay_id, contribution_date),
  INDEX idx_scc_status (status),
  CONSTRAINT fk_scc_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
  CONSTRAINT fk_scc_barangay FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS share_capital_withdrawals (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  farmer_id INT UNSIGNED NOT NULL,
  barangay_id INT NOT NULL,
  withdrawal_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  processed_by INT UNSIGNED NULL COMMENT 'Treasurer/Admin who processed the withdrawal',
  remarks TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_scw_farmer_date (farmer_id, withdrawal_date),
  INDEX idx_scw_barangay_date (barangay_id, withdrawal_date),
  CONSTRAINT fk_scw_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
  CONSTRAINT fk_scw_barangay FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE RESTRICT
);
