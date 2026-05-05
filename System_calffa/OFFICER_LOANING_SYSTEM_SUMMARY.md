# Officer Loaning System - Implementation Summary

## Overview
Added officer loan application and approval functionality for Treasurer and President roles, with cross-approval mechanism (Treasurer loans approved by President and vice versa). Officers can now apply for loans similar to farmers, with barangay-based approval.

## Changes Made

### 1. Backend Modifications (`backend/routes/loans.js`)

#### New/Modified Functions:
- **`canApplyForLoan()`** - Updated to support both farmers and officers
  - Checks for unsettled loans
  - Enforces 6-month loan cycle
  - Works for any user ID (farmer or officer)

- **`getOfficerLoanApprover()`** - NEW function
  - Determines who can approve officer loans
  - Treasurer loans → President approves
  - President loans → Treasurer approves
  - Other officers cannot apply
  - Finds approver from same barangay only

#### Modified Endpoints:

**GET /api/loans** - Enhanced with payment details
- Now includes all loan payments in the response
- Payments are aggregated from `loan_payments` table
- Returns as `payments` array with fields: id, amount, payment_date, payment_method, reference_number, remarks
- Maintains barangay filtering for officers

**PUT /api/loans/:id/approve** - New approval logic
- Officer loan approval rules:
  - Treasurer loan: MUST be approved by President
  - President loan: MUST be approved by Treasurer
  - Farmer loan: Can be approved by Treasurer, President, or Admin
- Prevents self-approval
- Validates approver is from same barangay
- Automatically calculates due date (6 months from approval)

**PUT /api/loans/:id/reject** - New rejection logic
- Officer loan rejection rules:
  - Treasurer loan: MUST be rejected by President
  - President loan: MUST be rejected by Treasurer
  - Farmer loan: Can be rejected by Treasurer, President, or Admin
- Prevents self-rejection
- Validates rejector is from same barangay

**POST /api/loans/:id/payment** - Payment recording
- Officers can record payments for loans in their barangay
- Allowed roles: Treasurer, President, Operation Manager, Business Manager, Admin
- Barangay validation enforced

### 2. Frontend Changes

#### New Component: `OfficerLoansPage.vue`
**Location**: `src/views/OfficerLoansPage.vue`
**Features**:
- Loan application form (Agricultural, Provident, Educational)
- Loan statistics dashboard
- Tabbed view: Pending, Approved, Active, Rejected
- Loan details modal with payment history
- Edit/Delete functionality for pending loans
- Dynamic approval descriptions based on role
- Payment history display for each loan

**Key Calculated Values**:
```javascript
pageTitle: "My Loans (Treasurer)" or "My Loans (President)"
approvalDescription: "Your loan will be reviewed by the President" (Treasurer)
                    "Your loan will be reviewed by the Treasurer" (President)
```

#### Modified Component: `Sidebar.vue`
**Changes**:
- Added `canCommunity` computed property
  - Returns true for: farmer, treasurer, president
- Modified `communityItems` to be computed property
  - Farmers see `/loan` route
  - Treasurer/President see `/officer-loans` route
  - Only farmers see "Kita sa Pagsasaka" link

#### Router Configuration: `src/router/index.js`
**New Route**:
```javascript
{ path: 'officer-loans', component: () => import('../views/OfficerLoansPage.vue'), meta: { requiresOfficerLoan: true } }
```

**New Navigation Guard**: `requiresOfficerLoan`
- Only Treasurer and President can access
- Admins also allowed
- Blocks other officers (Auditor, Agriculturist, etc.)

### 3. Database Considerations
No schema changes required. The system uses existing:
- `loans` table (farmer_id field used for both farmers and officers)
- `loan_payments` table (for payment history)
- `activity_logs` table (for audit trail)

All officer accounts exist in the `farmers` table with appropriate role assignments.

## How It Works

### For Treasurer or President Users:
1. **Sidebar**: See "Loans" in COMMUNITY section → points to `/officer-loans`
2. **Loan Application**:
   - Select loan type (Agricultural, Provident, Educational)
   - Enter amount and purpose
   - System shows "Your loan will be reviewed by the [other_role]"
   - Submit application

3. **Approval Process**:
   - If Treasurer applies → President sees it in Loan Management page
   - If President applies → Treasurer sees it in Loan Management page
   - Approver can approve/reject
   - Cannot approve own loan

4. **Payment Recording**:
   - Once approved, payments can be recorded
   - Officers from same barangay can record payments

### For Presidents/Treasurers in Loan Management (`/admin-loans`):
1. See all officer loans from their barangay
2. Can approve Treasurer's loan (if President)
3. Can approve President's loan (if Treasurer)
4. View payment history for each loan
5. Record new payments when approved

## Eligibility Rules

**Both Farmers and Officers**:
- Cannot have multiple unsettled loans
- Can only apply once every 6 months
- Must complete existing loans before applying new one

**Officer-Specific**:
- Only Treasurer and President can apply
- Auditor and Agriculturist cannot apply
- Approver must be from same barangay

## Loan Terms (Same for All)
- Interest Rate: Fixed 1%
- Payment Term: 6 months
- Loan Limits: 
  - Agricultural: ₱5,000
  - Provident: ₱3,000
  - Educational: ₱3,000

## Testing Checklist

- [ ] Treasurer can apply for loan (sidebar shows button)
- [ ] President can apply for loan (sidebar shows button)
- [ ] Auditor/Agriculturist cannot see loan button
- [ ] Treasurer loan shows approval by President
- [ ] President loan shows approval by Treasurer
- [ ] Cannot approve own loan (403 error)
- [ ] Payment history shows in loan details
- [ ] Only officers from same barangay can approve
- [ ] Admin can approve any officer loan
- [ ] Payment recording works for both approved and active loans
- [ ] Loan becomes "Active" after first payment, "Paid" when fully paid
- [ ] 6-month eligibility rule enforced
- [ ] Role-based sidebar filtering works correctly

## Files Modified

1. `backend/routes/loans.js` - Core loan logic
2. `farmer-registration/src/views/OfficerLoansPage.vue` - NEW
3. `farmer-registration/src/components/Sidebar.vue` - Menu updates
4. `farmer-registration/src/router/index.js` - Route + guard

## API Endpoints Summary

```
GET    /api/loans                      - List all loans (with payments)
GET    /api/loans/:id                  - Loan details (with payments)
GET    /api/loans/eligibility/:userId  - Check eligibility
POST   /api/loans                      - Create new loan application
PUT    /api/loans/:id                  - Update loan
PUT    /api/loans/:id/approve          - Approve with cross-role validation
PUT    /api/loans/:id/reject           - Reject with cross-role validation
POST   /api/loans/:id/payment          - Record payment
DELETE /api/loans/:id                  - Delete pending loan
```

## Security Features

- JWT token validation on all endpoints
- Barangay-based access control
- Role-based action restrictions
- Self-approval prevention
- Activity logging for all actions
- Cross-approval mechanism prevents collusion

## Future Enhancements

- SMS/Email notifications for loan applications
- Automated payment reminders
- Loan history analytics for officers
- Interest rate customization per barangay
- Flexible payment schedules
