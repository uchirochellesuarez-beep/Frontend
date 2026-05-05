# Pending Loans Visibility and Permissions Fix - COMPLETE

## Issue Summary
Pending farmer loans were not showing in the Loan Management page for treasurer/president users assigned to the same barangay. Additionally, presidents were able to approve/reject farmer loans, which violated the business rules.

## Root Causes Identified

### 1. Frontend Filtering Bug
**File**: `farmer-registration/src/views/AdminLoansPage.vue`  
**Problem**: The `fetchLoans()` function filtered OUT farmer loans, only showing officer-to-officer loans (treasurer ↔ president)

### 2. Backend Permission Gap  
**File**: `backend/routes/loans.js` - Approval endpoint  
**Problem**: President role was allowed to approve farmer loans (should only be treasurer)

**File**: `backend/routes/loans.js` - Rejection endpoint  
**Problem**: President role was allowed to reject farmer loans (should only be treasurer)

### 3. Frontend Data Pass Bug
**File**: `farmer-registration/src/views/AdminLoansPage.vue` - rejectLoan() function  
**Problem**: Rejection requests weren't including `rejected_by` user ID (required by backend)

## Fixes Applied

### Fix 1: Frontend Loan Visibility (AdminLoansPage.vue fetchLoans)
**Status**: ✅ COMPLETED

Updated the loan filter expressions to INCLUDE farmer loans:

```javascript
// PRESIDENT view - now includes farmer loans
if (userRole === 'president') {
  loans.value = data.loans.filter(loan => 
    loan.applicant_role === 'farmer' ||              // ← ADDED
    loan.applicant_role === 'treasurer' || 
    (loan.applicant_role === 'president' && loan.farmer_id === userId)
  );
}

// TREASURER view - now includes farmer loans  
if (userRole === 'treasurer') {
  loans.value = data.loans.filter(loan =>
    loan.applicant_role === 'farmer' ||              // ← ADDED
    loan.applicant_role === 'president' ||
    (loan.applicant_role === 'treasurer' && loan.farmer_id === userId)
  );
}
```

**Effect**: Farmers' pending loans now visible to both treasurer and president in their assigned barangay.

### Fix 2: Backend Approval Permission (loans.js PUT /:id/approve)
**Status**: ✅ COMPLETED

Added role-based permission check to prevent president from approving farmer loans:

```javascript
// Check if this is a farmer loan
const isFarmerLoan = approver.applicant_role === 'farmer' 
                  || approver.applicant_role === 'member';

if (isFarmerLoan) {
  // Only treasurers can approve farmer loans
  const isPresident = approver.role === 'president';
  if (isPresident) {
    return res.status(403).json({ 
      success: false, 
      message: 'President cannot approve farmer loans. Only Treasurer can approve farmer loans.'
    });
  }
}
```

**Effect**: President attempting to approve farmer loan receives 403 error with clear message.

### Fix 3: Backend Rejection Permission (loans.js PUT /:id/reject)
**Status**: ✅ COMPLETED

Updated farmer loan rejection logic to exclude president role:

```javascript
// Farmer loan rejection logic - only treasurer, operation_manager, business_manager, or admin
const rejecterRoles = ['treasurer', 'operation_manager', 'business_manager', 'admin'];

if (!rejecterRoles.includes(rejecter.role)) {
  return res.status(403).json({ 
    success: false, 
    message: 'Only treasurers can reject farmer loans. Presidents can only approve or reject officer loans.' 
  });
}
```

**Effect**: President attempting to reject farmer loan receives 403 error.

### Fix 4: Frontend Rejection Data (AdminLoansPage.vue rejectLoan)
**Status**: ✅ COMPLETED

Updated rejectLoan() function to include rejected_by user ID:

```javascript
async function rejectLoan() {
  const adminId = authStore.currentUser?.id || authStore.userId
  
  // ... validation ...
  
  const response = await fetch(`/api/loans/${selectedLoan.value.id}/reject`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ... },
    body: JSON.stringify({
      rejected_by: adminId,              // ← ADDED
      rejection_reason: rejectionForm.value.reason
    })
  })
}
```

**Effect**: Rejection requests now properly include rejecting user information for audit trail.

## Permission Matrix (Final State)

### Farmer Loan Operations
| Operation | Treasurer | President | Officer | Farmer | Admin |
|-----------|-----------|-----------|---------|--------|-------|
| **View** | ✅ | ✅ | - | ✅ own | ✅ |
| **Approve** | ✅ | ❌ | - | - | ✅ |
| **Reject** | ✅ | ❌ | - | - | ✅ |

### Officer Loan Operations (Treasurer ↔ President)
| Operation | Treasurer Approving | President Approving |
|-----------|-------------------|-------------------|
| **View** | ✅ All President loans | ✅ All Treasurer loans |
| **Approve** | ✅ President loans | ✅ Treasurer loans |
| **Reject** | ✅ President loans | ✅ Treasurer loans |
| **Self-Approve** | ❌ Cannot approve own | ❌ Cannot approve own |

## Testing Checklist

### ✅ Frontend Visibility
- [ ] Log in as **Treasurer** assigned to Barangay A
- [ ] Navigate to Loan Management page
- [ ] Verify **pending farmer loans** from Barangay A appear in the list
- [ ] Verify approval/rejection buttons are visible
- [ ] Log in as **President** assigned to Barangay A
- [ ] Verify **pending farmer loans** from Barangay A appear (with approval buttons disabled/grayed)

### ✅ Permission Enforcement  
- [ ] As **President**: Click approval button on farmer loan → Should receive error "President cannot approve farmer loans"
- [ ] As **President**: Click rejection button on farmer loan → Should receive error (check exact message)
- [ ] As **Treasurer**: Click approval button on farmer loan → Should succeed and show "Approved successfully"
- [ ] As **Treasurer**: Click rejection button on farmer loan → Should succeed and show "Rejected successfully"

### ✅ Cross-Approval
- [ ] As **Treasurer**: Approve **President's officer loan** → Should succeed
- [ ] As **President**: Approve **Treasurer's officer loan** → Should succeed  
- [ ] As **Treasurer**: Cannot approve own **Treasurer loan** → Should receive error
- [ ] As **President**: Cannot approve own **President loan** → Should receive error

## Files Modified
1. ✅ `backend/routes/loans.js` - Approval & rejection permission logic
2. ✅ `frontend/src/views/AdminLoansPage.vue` - Loan visibility filter & rejection data

## Deployment Notes
- No database migrations required
- No new environment variables added
- Changes are backward compatible
- Error messages displayed via JavaScript alerts (existing UI pattern)

## Related Issues Fixed Previously
- ✅ Interest rate corrected from 2% to 1%
- ✅ Penalty rate set to 1% per 6-month period
- ✅ Double interest calculation removed
- ✅ Database data cleanup and backfill
- ✅ Loan editing with proper recalculation

## Status
**ALL CHANGES COMPLETE** - Ready for testing and deployment
