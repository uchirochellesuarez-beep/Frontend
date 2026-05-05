# Loan Notification System - Implementation Guide

## ✅ System Status: ACTIVE

The existing **notification icon (🔔)** in the top header is now configured to send **loan payment reminders and overdue penalties** to members.

---

## 📋 How It Works

### Timeline Example: Member Borrows ₱5,000 Loan (6-month term)

```
┌─────────────────────────────────────────────────────────────┐
│  DAY 0: Loan Approved                                      │
│  Amount: ₱5,000                                            │
│  Due Date: 6 months from today                             │
│  Status: ACTIVE                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  1 DAY BEFORE DUE DATE: Reminder Notification              │
│  🔔 Bell shows notification badge                          │
│  Message: "Loan Due Tomorrow"                              │
│  Details: "Remaining balance: ₱5,000 + interest"           │
│  Action: Click to view loan details                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  DUE DATE PASSES (Member Doesn't Pay)                      │
│  Status Changes: ACTIVE → OVERDUE                          │
│  System Applies: 2% Penalty (₱100)                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  OVERDUE PENALTY NOTIFICATION (Sent Immediately)           │
│  🔔 Bell notification appears                              │
│  Title: "⚠️ Loan Overdue - Penalty Applied"               │
│  Details:                                                  │
│  • Days Overdue: 1                                         │
│  • Penalty: ₱100 (2% for 1 period)                        │
│  • New Total: ₱5,100                                       │
│  Action: Click to settle loan with penalty                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  CONTINUED OVERDUE (Every 30+ days = Additional 2%)        │
│  Days Overdue: 35                                          │
│  Accumulated Penalty: ₱200 (2 periods × ₱100)              │
│  New Total: ₱5,200                                         │
│  (Notification updates with new penalty amount)            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Features

### 1. **Pre-Due Notification** (Reminder)
- ⏰ Triggered: **1 day before due date**
- 📨 Shows: Current loan balance
- ✅ Purpose: Reminder to prepare payment

### 2. **Overdue Penalty Notification**
- ⏰ Triggered: **Immediately when loan becomes overdue**
- 📊 Shows: 
  - Number of days overdue
  - Penalty amount (2% per 6-month period)
  - New total amount to pay
- ✅ Purpose: Inform member about penalty and updated amount

### 3. **Automatic Updates**
- 💾 Stored in database: `due_date_notifications` table
- 🔄 System checks: Every 6 hours
- 🎮 Role Access:
  - **Members**: See only their own notifications
  - **Officers**: See all notifications in their barangay

---

## 💻 Technical Implementation

### Frontend (TopHeader.vue)
```
┌────────────────────────────────┐
│  🔔  [3]  ← Notification Badge │
│  └─────────────────┐           │
│    Dropdown Opens: │           │
│    ─────────────── │           │
│    1️⃣ Loan Due Tomorrow        │
│    2️⃣ ⚠️ Loan Overdue...       │
│    3️⃣ Payment Due...           │
│              ↑ Click to view/navigate
└────────────────────────────────┘
```

### Backend Process
1. **Database Triggers**: Check due dates every 6 hours
2. **Status Updates**: Mark loans as 'overdue' when past due date
3. **Penalty Calculation**: 2% per 6-month period (automatically calculated)
4. **Notification Creation**: Insert into `due_date_notifications` table
5. **Frontend Fetch**: Load via `/api/notifications` endpoint

---

## 📊 Database Table Structure

| Field | Value |
|-------|-------|
| `notification_type` | '1_day' or 'overdue_penalty' |
| `reference_type` | 'loan' |
| `title` | Friendly message for member |
| `message` | Detailed information |
| `is_read` | Track read/unread status |
| `trigger_date` | When notification appears |

---

## 🔧 How Penalties Work

### Penalty Calculation Rules:
- **2% per 6-month period** (matching the loan term)
- **Partial Period**: Additional 2% if overdue 30+ days in current period

### Example Scenarios:

#### Scenario 1: 10 Days Overdue
```
Loan Amount: ₱5,000
Days Overdue: 10 (< 30, no partial penalty)
Completed Periods: 0
Penalty: ₱0
Total: ₱5,000
```

#### Scenario 2: 35 Days Overdue
```
Loan Amount: ₱5,000
Days Overdue: 35 (> 30, qualifies for partial penalty)
Completed Periods: 1 (partial period with 30+ days)
Penalty: ₱5,000 × 2% × 1 = ₱100
Total: ₱5,100
```

#### Scenario 3: 200+ Days Overdue (2+ periods)
```
Loan Amount: ₱5,000
Days Overdue: 200
Completed Periods: 2 (200÷30 = 6.67 months, so 1 complete period + partial)
Penalty: ₱5,000 × 2% × 2 = ₱200
Total: ₱5,200
```

---

## 🚀 How to Test

### 1. View Live Notifications
Navigate to: `http://localhost:3000/`
Click the **🔔 bell icon** in top header

### 2. Manual Notification Generation (Admin Only)
```bash
POST /api/notifications/generate
Headers: Authorization: Bearer {admin_token}
```

### 3. Check Notification Database
```sql
SELECT * FROM due_date_notifications 
WHERE notification_type = 'overdue_penalty'
ORDER BY trigger_date DESC;
```

---

## ✨ What Was Updated (March 9, 2026)

1. **Fixed reference type**: Changed from 'loan_overdue' to 'loan' so TopHeader recognizes overdue notifications
2. **Improved trigger timing**: Changed from 30+ days to 1+ days so member gets immediate notification when overdue
3. **Enhanced message**: Clearly shows:
   - Exact days overdue
   - 2% penalty amount
   - New total to pay (balance + penalty)

---

## 📝 Files Modified

- [backend/routes/notifications.js](./backend/routes/notifications.js)
  - Fixed reference_type for overdue loans
  - Changed overdue penalty trigger threshold

- [backend/server.js](./backend/server.js)
  - Already integrated: `startNotificationScheduler()`

- [backend/scheduler/notification-scheduler.js](./backend/scheduler/notification-scheduler.js)
  - Runs every 6 hours automatically

---

## 🎓 User Experience

### For Members:
1. ✅ Receive reminder 1 day before due date
2. ✅ Get immediate notification when overdue with penalty details
3. ✅ See exact amount needed to settle (principal + 2% penalty)
4. ✅ Can mark notifications as read
5. ✅ Can click notification to navigate to loan details

### For Officers (Treasurer/President):
1. ✅ See all notifications in their barangay
2. ✅ Track member payment status
3. ✅ Monitor overdue penalties
4. ✅ Can mark as read or manage notifications

---

## 🔒 Access Control

- **Members**: Only see their own notifications
- **Officers**: See notifications for their barangay only
- **Admin**: Can generate notifications manually, see all data

---

## 📞 Support

For notification issues or to adjust penalty rates:
1. Check `/backend/routes/notifications.js` for notification logic
2. Check `/backend/routes/loans.js` for penalty calculation
3. Verify `/backend/scheduler/notification-scheduler.js` is running
4. Ensure `due_date_notifications` table exists in database
