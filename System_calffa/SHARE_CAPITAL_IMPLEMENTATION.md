# Share Capital / Savings Feature Implementation

## Overview
A barangay-scoped savings/share capital feature that tracks fixed ₱50 contributions every 6 months (₱100/year). Built with strict role-based access, barangay isolation, and automatic farmer status updates on withdrawal.

---

## Database Schema

### `share_capital_contributions`
Tracks each ₱50 share contribution per farmer.
- **farmer_id**: Reference to farmer (CASCADE on delete)
- **barangay_id**: Barangay context (immutable, scoped queries)
- **contribution_date**: Date of the contribution
- **amount**: Fixed at ₱50
- **status**: `confirmed` or `cancelled`
- **created_by**: Treasurer/Admin who recorded it
- **updated_by**: Treasurer/Admin who last modified it
- Indexes: farmer+date, barangay+date, status

### `share_capital_withdrawals`
Tracks withdrawals (exit from the association).
- **farmer_id**: Reference to farmer (CASCADE on delete)
- **barangay_id**: Barangay context
- **withdrawal_date**: Date of withdrawal
- **amount**: Total accumulated balance at time of withdrawal
- **processed_by**: Treasurer/Admin who processed it
- **remarks**: Optional notes
- Indexes: farmer+date, barangay+date

---

## API Endpoints

All endpoints require JWT token in `Authorization: Bearer <token>` header.

### GET `/api/share-capital/overview`
**Roles**: Admin, Treasurer, President (officers within their barangay only)

Returns list of all farmers in the officer's barangay with their share capital totals.

**Query Params**:
- `barangay_id` (optional): Admin only, defaults to user's barangay

**Response**:
```json
{
  "success": true,
  "barangay_id": 1,
  "rules": {
    "amount_per_6_months": 50,
    "contributions_per_year": 2,
    "amount_per_year": 100
  },
  "totals": {
    "total_farmers": 45,
    "total_collected": 4500,
    "total_withdrawn": 500,
    "total_balance": 4000
  },
  "farmers": [
    {
      "id": 1,
      "full_name": "Juan Dela Cruz",
      "reference_number": "FARMER001",
      "status": "approved",
      "barangay_id": 1,
      "total_contributed": 100,     // confirmed only
      "total_withdrawn": 0,
      "balance": 100
    }
  ]
}
```

### GET `/api/share-capital/farmer/:farmerId`
**Roles**: Admin, Treasurer, President (within same barangay)

Returns detailed share capital history for a specific farmer.

**Response**:
```json
{
  "success": true,
  "farmer": {...},
  "totals": {
    "total_contributed": 100,
    "total_withdrawn": 0,
    "balance": 100
  },
  "contributions": [
    {
      "id": 1,
      "contribution_date": "2024-01-15",
      "amount": 50,
      "status": "confirmed",
      "created_by": 5,
      "updated_by": null,
      "created_at": "2024-01-16T10:30:00Z",
      "updated_at": "2024-01-16T10:30:00Z"
    }
  ],
  "withdrawals": []
}
```

### GET `/api/share-capital/me`
**Roles**: Farmer

Returns the farmer's own share capital history (no barangay checks—farmers see only themselves).

**Response**: Same structure as `/farmer/:farmerId`

### POST `/api/share-capital/contributions`
**Roles**: Admin, Treasurer (within same barangay)

Record a new ₱50 contribution for a farmer.

**Request Body**:
```json
{
  "farmer_id": 1,
  "contribution_date": "2024-01-15"
  // amount is optional, defaults & enforces ₱50
}
```

**Validation**:
1. Farmer must not be `inactive` (exited)
2. Amount must be exactly ₱50
3. One contribution per 6-month period: Jan-Jun or Jul-Dec (enforced via database constraint logic)
4. Treasurer must be in the same barangay as the farmer

**Response**:
```json
{
  "success": true,
  "id": 42,
  "message": "Share contribution recorded successfully"
}
```

### PUT `/api/share-capital/contributions/:id`
**Roles**: Admin, Treasurer (within same barangay)

Edit a contribution record (e.g., correct date or mark as cancelled).

**Request Body**:
```json
{
  "contribution_date": "2024-01-20",
  "amount": 50,
  "status": "confirmed"  // or "cancelled"
}
```

**Validation**: Same 6-month check applies when changing date (excluding self).

**Response**:
```json
{
  "success": true,
  "message": "Share contribution updated successfully"
}
```

### POST `/api/share-capital/withdrawals`
**Roles**: Admin, Treasurer (within same barangay)

Process a withdrawal for a farmer. **Automatically marks farmer as `inactive`.**

**Request Body**:
```json
{
  "farmer_id": 1,
  "withdrawal_date": "2024-12-30",
  "remarks": "Farmer leaving the association"  // optional
}
```

**Logic**:
1. Calculate farmer's total confirmed contributions minus any existing withdrawals
2. If balance ≤ 0, reject
3. Insert withdrawal record with the balance amount
4. Update farmer.status = 'inactive'
5. Log activity atomically (transaction)

**Response**:
```json
{
  "success": true,
  "message": "Withdrawal processed and farmer marked inactive",
  "withdrawal_amount": 100
}
```

---

## Barangay-Based Access Control

### Treasurer
- Can see farmers in **only their barangay**
- Can view & edit:
  - Contribution records (date, status; amount always ₱50)
  - Process withdrawals (marks farmer inactive)
- Cannot view/edit farmers from other barangays
- **Cannot manage/view Admin data**

### President
- Can see farmers in **only their barangay**
- **Read-only** access to share capital data (no edit/add/withdraw)
- Monitor barangay-level totals
- Cannot modify any records

### Farmer
- Can see **only their own** share capital data
- No barangay context shown in API (enforced via role check)
- Cannot see other farmers' data

### Admin
- Can see data from **any barangay** (if `barangay_id` query param provided)
- Can perform all operations (view, edit, create, withdraw)
- Defaults to individual barangay if no param provided

---

## Frontend Integration

### Navigation
- Sidebar: Show "Share Capital" for Farmer, Treasurer, President, Admin
- Route: `/share-capital`

### Views

#### Farmer View (`/share-capital`)
- **Total Shares Contributed**: Confirmed contributions sum
- **Total Withdrawn**: Withdrawal sum (normally 0 or final withdrawal only)
- **Current Total Balance**: Contributed - Withdrawn
- **Payment History Table**: List of all contributions (date, amount, status)
- **Withdrawals Table**: List of all withdrawals (date, amount, remarks)
- "Refresh" button to reload data

#### Treasurer/President View (`/share-capital`)
- **Stats Cards**:
  - Total Farmers (in barangay)
  - Total Shares Collected
  - Total Withdrawn
  - Total Balance
- **Left Panel**: Farmer list with: Ref No., Name, Status badge, Total, Balance, View buttons
- **Right Panel**: 
  - Farmer summary (when selected)
  - Contribution form (Treasurer only)
    - Date picker
    - Amount (locked at ₱50)
    - "Record" button
  - "Withdraw / Exit" button (Treasurer only; disabled if balance ≤ 0)
  - Contributions table (edit date/status for Treasurer, read-only for President)
  - Withdrawals table (read-only)

---

## Business Rules

### Share Contribution
- **Amount**: Fixed at ₱50
- **Frequency**: Max 1 per 6-month period (Jan-Jun or Jul-Dec)
- **Automatic Calculation**: System counts all confirmed contributions
- **Status Options**: `confirmed`, `cancelled`

### Withdrawal / Exit
- **Eligibility**: Any positive balance
- **Action**: Treasurer/Admin clicks "Withdraw / Exit" → optionally adds remarks
- **Effect**:
  - Creates withdrawal record with total balance
  - Updates farmer.status = 'inactive'
  - Farmer is no longer included in "active farmers" list
  - Cannot add new contributions for inactive farmer

### Year Example
```
Jan 15: Contribution 1 (₱50) 
Jul 20: Contribution 2 (₱50)

Total: ₱100 per year (₱50 × 2 half-years)
```

---

## Setup Instructions

### 1. Run Migration
```sh
mysql -u root -p calffa < backend/migrations/create_share_capital_module.sql
```

### 2. Verify Tables
```sql
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA='calffa' 
AND TABLE_NAME LIKE 'share_capital%';
```

### 3. Start Backend
The route is auto-registered in `server.js`:
```javascript
app.use('/api/share-capital', shareCapitalRoutes);
```

### 4. Access Frontend
Navigate to `/share-capital` after logging in as:
- **Farmer**: See own shares
- **Treasurer**: Manage barangay farmers
- **President**: Monitor barangay (read-only)
- **Admin**: Manage all barangays (select via query param)

---

## Testing Checklist

### Barangay Isolation
- [ ] Treasurer from Barangay A cannot see Barangay B farmers
- [ ] President from Barangay A cannot edit records in Barangay B
- [ ] API returns 403 when attempting cross-barangay access

### Contribution Rules
- [ ] Cannot record 2 contributions in same 6-month period
- [ ] Cannot update date to create duplicate in same period
- [ ] Amount is locked at ₱50
- [ ] Cannot add contribution for inactive farmer

### Role Permissions
- [ ] Farmer can only see `/api/share-capital/me`
- [ ] President cannot POST/PUT contributions
- [ ] Treasurer can do all operations in their barangay
- [ ] Admin can do all operations with barangay param

### Withdrawal Logic
- [ ] Cannot withdraw if balance ≤ 0
- [ ] Withdrawal records farmer with date + amount
- [ ] Farmer.status updates to 'inactive'
- [ ] Transaction rolls back on error

### Frontend UX
- [ ] Sidebar shows "Share Capital" for eligible roles
- [ ] Farmer view displays correct totals
- [ ] Treasurer list refreshes after adding contribution
- [ ] Withdrawal confirmation prompt appears
- [ ] No cross-barangay data visible in tables

---

## Error Handling

### Common Errors
| Error | Cause | Resolution |
|-------|-------|-----------|
| "Barangay assignment is required for officers" | Officer has no barangay_id | Admin must assign barangay before officer can use this feature |
| "You can only access data from your assigned barangay" | Cross-barangay access attempt | Ensure correct user/officer selected |
| "A share capital contribution already exists for this 6-month period" | Duplicate contribution | Check existing contributions; use edit to fix date if needed |
| "Farmer is inactive/exited" | Contribution for exited farmer | Cannot add to inactive farmers; only withdrawal records allowed |
| "No share capital balance available for withdrawal" | Insufficient balance | Ensure farmer has confirmed contributions > any prior withdrawals |

---

## Future Enhancements

1. **Dividend Calculation**: Periodic dividend distribution based on total shares collected
2. **Partial Withdrawals**: Allow pre-exit withdrawal of partial shares
3. **Contribution Reminders**: Auto-email/SMS reminders for upcoming 6-month periods
4. **Year-End Reports**: PDF export of annual share capital statements per farmer
5. **Interest Accrual**: Optional small interest on accumulated shares (configurable)

---

## Summary
The Share Capital feature integrates seamlessly with the existing system:
- Uses proven **JWT + role-based middleware** patterns
- Enforces **barangay isolation** like loans & machinery modules
- Implements **6-month contribution cap** to prevent duplicate periods
- Provides **clear treasurer workflow** for manual management
- Marks farmers **inactive on withdrawal** (no orphan data)
- Accessible via single, unified route (`/api/share-capital` + `/share-capital` page)
