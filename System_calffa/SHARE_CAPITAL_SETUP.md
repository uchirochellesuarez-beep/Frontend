# Share Capital Feature - Setup Instructions

## ⚠️ Required Step: Run Database Migration

The error **"Share capital tables not found"** means the migration hasn't been executed yet.

### Step 1: Open Command Prompt/Terminal

Go to your XAMPP MySQL directory or open any terminal.

### Step 2: Run the Migration

**From the backend directory:**
```bash
cd backend/migrations
mysql -u root -p calffa < create_share_capital_module.sql
```

**Or from anywhere (full path):**
```bash
mysql -u root -p calffa < C:\xampp\htdocs\calffa_blockchain_integrated\CALLFA\System_calffa\backend\migrations\create_share_capital_module.sql
```

**If you're prompted for password, enter your MySQL password (usually empty for XAMPP default setup, just press Enter).**

### Step 3: Verify Tables Created

```bash
mysql -u root -p calffa -e "SHOW TABLES LIKE 'share_capital%';"
```

Expected output:
```
+------------------------------------+
| Tables_in_calffa (share_capital%)  |
+------------------------------------+
| share_capital_contributions        |
| share_capital_withdrawals          |
+------------------------------------+
```

### Step 4: Restart Backend (if running)

Stop and restart your Node.js backend server to ensure fresh connection pool:

```bash
# Kill the process or press Ctrl+C in the terminal running the server
# Then restart:
npm start
# or: node backend/server.js
```

### Step 5: Test in Frontend

1. **Login as Treasurer** with a barangay assignment
2. Navigate to **Share Capital** (🏦 icon in sidebar)
3. Should see "Farmers (Your Barangay)" list

---

## Quick Test Checklist

- [ ] Mission ran without errors
- [ ] `SHOW TABLES` shows both `share_capital_*` tables  
- [ ] Backend restarted
- [ ] Logged in as Treasurer
- [ ] No 500 error on `/share-capital` page

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Access denied" | Make sure you have MySQL root access; password might not be empty |
| "No such file" | Check path to migration file; use full absolute path |
| Still getting 500 | Make sure you restarted the backend server after running migration |
| Tables don't show up | Run `mysql -u root -p calffa -e "SHOW TABLES LIKE '%share%';"` to verify |

---

## Optional: Manual Table Creation

If the migration file doesn't work, you can create the tables manually in MySQL console:

```sql
CREATE TABLE IF NOT EXISTS share_capital_contributions (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  farmer_id INT UNSIGNED NOT NULL,
  barangay_id INT NOT NULL,
  contribution_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  status ENUM('confirmed', 'cancelled') DEFAULT 'confirmed',
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
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
  processed_by INT UNSIGNED NULL,
  remarks TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_scw_farmer_date (farmer_id, withdrawal_date),
  INDEX idx_scw_barangay_date (barangay_id, withdrawal_date),
  CONSTRAINT fk_scw_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
  CONSTRAINT fk_scw_barangay FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE RESTRICT
);
```

Then paste and execute in phpMyAdmin or MySQL console.

---

After running the migration, reload the Share Capital page and you should see the farmers list!
