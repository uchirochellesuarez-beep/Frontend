# Loan Interest & Penalty System Implementation

## Overview
A comprehensive system has been implemented to manage loan interest rates (2% per 6 months) and penalties for overdue payments (2% per 6-month period).

## Changes Made

### 1. Backend - Interest Rate Update (`backend/routes/loans.js`)

#### Interest & Penalty Constants
- **INTEREST_RATE**: Changed from **1%** to **2% (per 6 months)**
- **PENALTY_RATE**: New **2% penalty per 6-month period** for overdue payments
- **PAYMENT_TERM_MONTHS**: Remains **6 months**

#### New Helper Function: `calculatePenalty()`
```javascript
// Calculates penalty based on days overdue
// 1 period = 6 months of interest (2%)
// Penalties compound per 6-month period
// Partial periods trigger penalty after 30 days overdue

Example:
- 30 days overdue = 2% penalty (₱100 loan = ₱2 penalty)
- 60 days overdue = 2% penalty
- 180 days overdue = 2% penalty
- 210 days overdue = 4% penalty (2 periods)
- 390 days overdue = 6% penalty (3 periods)
```

#### Updated GET `/api/loans` Endpoint
- Fetches loans with payment history
- **Calculates penalties for overdue loans**
- Returns additional fields:
  - `penalty_amount`: Calculated penalty
  - `days_overdue`: Number of days overdue
  - `penalty_periods`: Number of complete 6-month penalty periods
  - `total_with_penalty`: Remaining balance + penalty

#### New Endpoint: POST `/api/loans/update-overdue`
- Marks loans as 'overdue' if past due date
- Can be called manually or by scheduler
- Updates only loans with remaining balance > 0

### 2. Scheduler - Automatic Overdue Checking (`backend/scheduler/notification-scheduler.js`)

#### New Function: `updateOverdueLoans()`
- Checks and marks loans as 'overdue' if past due date
- Runs **every 6 hours** (same as notification check)
- Logs number of loans updated

#### Integrated Workflow
1. **Every 6 hours**, the scheduler:
   - Updates overdue loan statuses
   - Generates due-date notifications (1 day before due date)
   - Logs activity to console

2. **Notification System**:
   - Triggers **1 day before** due date
   - Notifies members of approaching payment deadline
   - Helps prevent loans from becoming overdue

### 3. Frontend - Display Penalty Information (`farmer-registration/src/views/AdminLoansPage.vue`)

#### Loan Statistics Card
- Added **Overdue Loans** stat card (red background for visibility)
- Updated stats calculation to include overdue count
- Total amount now includes penalties for overdue loans

#### Filter Tabs
- Added **⚠️ Overdue** tab with count badge
- Styled in red/bold for visibility
- Users can filter loans by overdue status

#### Loan Details Modal
- **Penalty Info Section** displays when loan is overdue:
  - Penalty Amount
  - Days Overdue
  - Number of penalty periods
  - Total with penalty (remaining balance + penalty)
  - Note: "2% penalty per 6-month period overdue"
- Styled with yellow background warning color

## How It Works

### Scenario 1: On-Time Payment
```
Loan: ₱5,000 agricultural
Interest (2%): ₱100
Total: ₱5,100
Payment Due: June 8, 2026

✓ Member pays by due date → No penalty
Total amount due: ₱5,100
```

### Scenario 2: Overdue Payment
```
Loan: ₱5,000 agricultural
Interest (2%): ₱100
Total: ₱5,100
Payment Due: June 8, 2026

Member doesn't pay:
- June 9 (1 day overdue): Receives notification
- June 8 → June 30 (22 days): Still only ₱5,100 due (no penalty yet)
- July 8 (30 days overdue): **1st 2% penalty added = ₱100**
  Total due: ₱5,200

- July 8 → December 7 (30-179 days overdue): 1 penalty period active
  Total due: ₱5,200

- December 8 (180 days overdue) → **2nd 2% penalty added = ₱100**
  Total due: ₱5,300 (2 penalty periods)

- June 8, 2027 (365 days overdue) → **3rd 2% penalty added = ₱100**
  Total due: ₱5,400 (3 penalty periods)
```

### Scenario 3: Partial Payment with Overdue
```
Original: ₱5,100
Payment made: ₱2,000
Remaining: ₱3,100

Now overdue with ₱3,100 balance
30 days overdue → 2% penalty: ₱62
Total with penalty: ₱3,162
```

## System Workflow

1. **Loan Application** (Day 0)
   - 2% interest calculated: ₱100 (on ₱5,000)
   - Total: ₱5,100
   - Default term: 6 months

2. **Loan Approval** (Day 0)
   - Due date set: 6 months from approval
   - Status: approved
   - Notifications scheduled

3. **1 Day Before Due Date**
   - **Notification sent**: "Loan Due Tomorrow"
   - Remaining balance shown

4. **Due Date Passes**
   - Status automatically changes to 'overdue' (checked every 6 hours)
   - Notifications stop

5. **30+ Days Overdue**
   - 2% penalty calculated on original loan amount
   - Added to remaining balance
   - Example: ₱3,100 balance → ₱3,162 with penalty

6. **180+ Days Overdue**
   - Another 2% penalty added (2 periods total)
   - Continues to compound every 6 months

## Notification Schedule

The notification scheduler runs **every 6 hours** (6:00 AM, 12:00 PM, 6:00 PM, 12:00 AM):

1. **Check for Overdue Loans**
   - Compare due_date with today's date
   - Update status from 'approved'/'active' to 'overdue'
   - Log count of updated loans

2. **Generate Due-Date Notifications**
   - Query loans due tomorrow
   - Create notification records
   - Prevent duplicate notifications
   - Log count generated

## Database Updates Required

No new database columns needed. The system calculates penalties on-the-fly using:
- `loan_amount` (principal)
- `due_date` (for overdue status)
- `remaining_balance` (for current owed amount)
- `status` (approved/active/overdue/paid)

Penalty data is calculated and returned in API responses:
- Not stored in database
- Recalculated each time loans are fetched
- Ensures accuracy with current date

## Frontend Features

### Admin/Officer Dashboard
- See overdue loans in red
- Separate "Overdue" tab for filtering
- View penalty details in loan details modal
- See how much has accrued

### Loan Management
- Can still view pending loans
- Can approve/reject pending loans
- Can record payments (which reduces remaining balance)
- Penalty recalculates after each payment

## Testing the System

### To Test Overdue Status Update:
```bash
curl -X POST http://localhost:3000/api/loans/update-overdue
```

### To View Loans with Penalties:
```bash
curl http://localhost:3000/api/loans
```
Response will include: `penalty_amount`, `days_overdue`, `penalty_periods`, `total_with_penalty`

### To Test Notifications:
- Scheduler runs automatically every 6 hours
- Or manually trigger: `POST /api/notifications/generate-due-date`

## Key Features

✅ Initial interest: 2% of principal amount (6-month term)
✅ Penalties: 2% additional per 6-month period overdue
✅ Automatic overdue detection every 6 hours
✅ Notifications 1 day before due date
✅ Penalty display in UI with clear labeling
✅ Penalty calculation is real-time (no DB storage required)
✅ Penalties compound for extended overdue periods
✅ System prevents self-payment recording (cross-approval only)
✅ All loan statuses visible (pending, approved, active, overdue, paid, rejected)

## Notes

- Penalties are calculated based on days since due date
- First penalty triggers at 30+ days overdue
- Subsequent penalties trigger at each complete 6-month period
- System calculates penalties dynamically - no database updates needed for penalties
- Notification system complements penalty system to encourage early payment
