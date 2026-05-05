# Google Authentication - Comprehensive Test Guide

**Version:** 1.0  
**Date:** March 21, 2026  
**Status:** Ready for QA Testing

---

## Pre-Test Checklist

- [ ] Backend running on http://localhost:3000
- [ ] Frontend running on http://localhost:5173
- [ ] Database migration executed
- [ ] Google credentials configured in .env files
- [ ] Database contains sample barangays
- [ ] Browser console open for debugging
- [ ] Test user Google account created (if testing with real Google)

---

## Test Environment Setup

### Google Test Credentials
```
Client ID: xxx.apps.googleusercontent.com
Client Secret: xxx (backend only, not needed for frontend)
Test Email: test@gmail.com
Test Password: (your Google test account password)
```

### Database Setup
```sql
-- Verify barangays exist
SELECT * FROM barangays LIMIT 5;

-- Should return at least 2 barangays (Camansihan, Managpi)
-- If empty, insert:
INSERT INTO barangays (name, location) VALUES
('Camansihan', 'Sample Location 1'),
('Managpi', 'Sample Location 2');
```

---

## Test Cases by Feature

## 1. Google Sign-In Button Display

### TC-001: Button Visibility on Login Page
```
Given: User is on Login page (/login)
When: Page loads
Then: "Continue with Google" button should be visible
  AND: Button should have Google logo
  AND: Button should be above/near login form
  AND: Button should be responsive on mobile

Browser: Chrome, Firefox, Safari
Device: Desktop, Tablet, Mobile
```

**Steps:**
1. Open http://localhost:5173/login
2. Verify "Continue with Google" button is visible
3. Inspect button with browser DevTools
4. Resize browser to mobile size (320px width)
5. Verify button still visible and clickable

**Pass Criteria:**
- ✓ Button visible on all screen sizes
- ✓ Button clickable
- ✓ Google logo displayed correctly

---

### TC-002: Button Visibility on Signup Page
```
Given: User is on Login page
When: User clicks "Create Account" toggle
Then: "Continue with Google" button should still be visible
  AND: Button should work for both signup and login
```

**Steps:**
1. Open Login page
2. Click "Create Account" button
3. Verify Google button still visible
4. Check for duplicate buttons (should only be one)

**Pass Criteria:**
- ✓ Button visible in signup mode
- ✓ No duplicate buttons
- ✓ Button can be used for both login and signup

---

## 2. Google Account Connection

### TC-003: Google Account Selection Flow
```
Given: User clicks "Continue with Google"
When: Google account selector appears
Then: User should be able to select their Google account
```

**Steps:**
1. Click "Continue with Google" button
2. Wait for Google sign-in popup/redirect
3. Select test Google account
4. Verify account selector shows account options

**Pass Criteria:**
- ✓ Google account selector appears
- ✓ Test account can be selected
- ✓ No errors in browser console

---

### TC-004: Google Token Reception
```
Given: User selected Google account
When: Google authentication completes
Then: Frontend should receive ID token
  AND: Token should contain user profile data
```

**Steps:**
1. Complete Google sign-in flow
2. Open browser DevTools → Network tab
3. Look for POST to `/api/auth/google/verify-token`
4. Check request contains token
5. Verify response contains profile data

**Pass Criteria:**
- ✓ Network request shows token
- ✓ Response includes: google_id, email, name, picture
- ✓ No 401/403 errors

---

## 3. New User Registration

### TC-005: New User Registration Flow
```
Given: User with new Google account clicks "Continue with Google"
When: Authentication succeeds
Then: Registration form should auto-populate with Google data
  AND: User should be able to complete registration
```

**Steps:**
1. Use a Google account that's not in the database
2. Click "Continue with Google"
3. Verify redirected to GoogleRegistration page
4. Check pre-filled fields:
   - Full Name: Should show Google name
   - Email: Should show Google email
   - Profile Picture: Should display Google picture
   - Reference Number: Should be auto-generated (GOO-xxx format)
5. Complete required fields:
   - Phone: 09171234567
   - DOB: 1990-05-15
   - Address: 123 Main St
   - Educational: High School Graduate
   - Barangay: Camansihan
   - Land Area: 2.5
   - Farm Location: 14.8159° N, 121.2965° E
   - Membership: Member
6. Check "I agree to terms"
7. Click "Complete Registration"
8. Verify success message
9. Verify redirect to login page

**Pass Criteria:**
- ✓ All Google fields pre-filled correctly
- ✓ Reference number auto-generated
- ✓ Form validation works
- ✓ Registration submits successfully
- ✓ Success message displayed
- ✓ Redirect to login page

---

### TC-006: Form Validation - Phone Number
```
Given: Registration form is displayed
When: User enters invalid phone number
Then: Error message should appear
```

**Phone Number Test Cases:**

| Input | Length | Expected Result |
|-------|--------|-----------------|
| 09171234567 | 11 | ✓ Valid |
| 9171234567 | 10 | ✗ Error: "must be 11 digits" |
| 091712345678 | 12 | ✗ Error: "must be 11 digits" |
| 0917-123-4567 | 11 (numeric) | ✓ Valid (formatted) |
| (empty) | 0 | ✗ Required field |

**Pass Criteria:**
- ✓ Only 11-digit numbers accepted
- ✓ Formatting flexibility allowed
- ✓ Error message displayed for invalid input

---

### TC-007: Form Validation - Date of Birth
```
Given: Registration form is displayed
When: User enters invalid date of birth
Then: Appropriate error/restriction should apply
```

**Date of Birth Test Cases:**

| Input | Age | Expected Result |
|-------|-----|-----------------|
| 2006-03-21 | 20 | ✓ Valid |
| 2008-03-21 | 18 | ✓ Valid (exactly 18) |
| 2009-03-21 | 17 | ✗ Error: "must be 18+" |
| Future date | - | ✗ Disabled (max date set) |

**Pass Criteria:**
- ✓ Max date field set to 18 years ago
- ✓ Age < 18 rejected with error
- ✓ Age >= 18 accepted

---

### TC-008: Form Validation - Barangay Selection
```
Given: Registration form is displayed
When: User attempts to submit without selecting barangay
Then: Error should appear
```

**Pass Criteria:**
- ✓ Barangay dropdown required
- ✓ "Required" text shows next to label
- ✓ Cannot submit form without barangay selected

---

### TC-009: Form Validation - Land Area
```
Given: Registration form is displayed
When: User enters invalid land area
Then: Error should appear
```

**Land Area Test Cases:**

| Input | Expected Result |
|-------|-----------------|
| 2.5 | ✓ Valid |
| 0.25 | ✓ Valid |
| 100 | ✓ Valid |
| 0 | ✗ Error: "must be positive" |
| -5 | ✗ Error: "must be positive" |
| abc | ✗ Error: "must be numeric" |

**Pass Criteria:**
- ✓ Positive numbers accepted
- ✓ Zero and negative rejected
- ✓ Non-numeric rejected

---

### TC-010: Database Entry for New User
```
Given: User completes registration successfully
When: Confirmation page appears
Then: Database should contain new farmer record
```

**Verify in Database:**
```sql
SELECT id, google_id, reference_number, full_name, email, 
       status, barangay_id, phone_number, is_farmer
FROM farmers 
WHERE email = 'test_new@gmail.com' 
LIMIT 1;
```

**Expected Results:**
- ✓ google_id: Contains Google sub value
- ✓ reference_number: Auto-generated
- ✓ full_name: Populated from Google
- ✓ email: Populated from Google
- ✓ status: 'pending'
- ✓ barangay_id: Selected value
- ✓ phone_number: Entered value
- ✓ is_farmer: 1

---

## 4. Existing User Login

### TC-011: Login with Approved Existing Google User
```
Given: User has existing account (status = approved)
When: User clicks "Continue with Google"
Then: User should be logged in and redirected to dashboard
```

**Steps:**
1. Create test user in database with status='approved'
2. Go to login page
3. Click "Continue with Google"
4. Select matching Google account
5. Verify JWT token stored in localStorage
6. Verify redirect to dashboard
7. Check user data displayed (name, profile picture)

**Verify Token:**
```javascript
// In browser console
localStorage.getItem('token')     // Should show JWT
localStorage.getItem('currentUser') // Should show user object
```

**Pass Criteria:**
- ✓ Login successful
- ✓ Token stored in localStorage
- ✓ JWT valid and not expired
- ✓ Redirect to dashboard
- ✓ User data displayed correctly

---

### TC-012: Login with Pending Existing Google User
```
Given: User has account with status = pending
When: User clicks "Continue with Google"
Then: Error message should appear
  AND: User should NOT be logged in
  AND: Message should suggest waiting for approval
```

**Steps:**
1. Manually set database: `UPDATE farmers SET status='pending' WHERE id=123`
2. Go to login page
3. Click "Continue with Google"
4. Select matching Google account
5. Verify error message appears
6. Verify NOT logged in (no token in localStorage)
7. Verify error message mentions "pending approval"

**Pass Criteria:**
- ✓ Error message displayed
- ✓ User not logged in
- ✓ No token stored
- ✓ Clear message about approval status

---

### TC-013: Login with Approved Status
```
Given: User has approved account
When: Status changed from pending to approved
Then: User should be able to log in
```

**Steps:**
1. Set user status to 'pending'
2. Try to log in (should fail - TC-012)
3. Admin approves: `UPDATE farmers SET status='approved' WHERE id=123`
4. Try to log in again
5. Should succeed this time

**Pass Criteria:**
- ✓ Status='pending' blocks login
- ✓ Status='approved' allows login
- ✓ No caching issues

---

## 5. Email Deduplication

### TC-014: Duplicate Email Detection (New Registration)
```
Given: User with email already exists in database
When: New user tries to register with same email
Then: System should link to existing account
  AND: Google ID should be added to existing account
```

**Steps:**
1. Ensure user exists: INSERT farmer with email='test@gmail.com'
2. Go to login, click "Continue with Google"
3. Use Google account with same email
4. System should detect duplicate email
5. Should prompt for linking flow

**Pass Criteria:**
- ✓ Duplicate email detected
- ✓ Account linking offered
- ✓ No duplicate accounts created

---

### TC-015: Account Linking Flow
```
Given: Email matches existing account but no google_id
When: User attempts linking
Then: User must verify identity with password
  AND: Google ID should be linked to existing account
```

**Steps:**
1. User detected during Google login
2. Prompted to enter password
3. After successful password verification
4. Google account linked
5. User can now log in with Google

**Pass Criteria:**
- ✓ Password verification required
- ✓ Correct password allows linking
- ✓ Wrong password prevents linking
- ✓ google_id stored in database

---

## 6. Barangay System Integration

### TC-016: Barangay Dropdown Population
```
Given: Registration form displayed
When: Page loads
Then: Barangay dropdown should be populated from database
```

**Steps:**
1. Open registration form
2. Click Barangay dropdown
3. Verify all barangays from database appear
4. Verify "Camansihan" is available
5. Verify "Managpi" is available

**Pass Criteria:**
- ✓ Dropdown populated from DB
- ✓ All active barangays shown
- ✓ Can select any barangay

---

### TC-017: Barangay Assignment Verification
```
Given: User selects barangay during registration
When: Account is created
Then: Database should link farmer to selected barangay
```

**Database Verification:**
```sql
SELECT barangay_id FROM farmers WHERE id = 123;
-- Should show selected barangay_id
```

**Pass Criteria:**
- ✓ Barangay correctly stored
- ✓ Foreign key constraint satisfied
- ✓ Barangay-based queries work

---

### TC-018: Barangay President Approval
```
Given: Farmer created with barangay_id=1
When: President (barangay_id=1) approves farmer
Then: Farmer status should change to approved
  AND: Farmer can now log in
```

**Steps:**
1. Create farmer with barangay_id=1, status=pending
2. Log in as President with barangay_id=1
3. Go to Farmer Approvals
4. Find farmer
5. Click Approve
6. Verify farmer status updated to 'approved'
7. Try logging in as farmer (should succeed)

**Pass Criteria:**
- ✓ Status updated correctly
- ✓ Can only approve own barangay farmers
- ✓ Farmer can log in after approval

---

## 7. JWT Token Handling

### TC-019: Token Generation
```
Given: User successfully logs in
When: Login completes
Then: JWT token should be generated
```

**Token Content (`JWT.decode`):**
```
{
  "id": 123,           // Farmer ID
  "reference_number": "REF-20260321-ABC12",
  "role": "farmer",
  "barangay_id": 1,
  "membership_status": "member",
  "exp": 1711000000    // Expires in 7 days
}
```

**Pass Criteria:**
- ✓ Token contains all required claims
- ✓ Expiration set to 7 days
- ✓ Signature valid (HMAC-SHA256)

---

### TC-020: Token Storage
```
Given: User logged in
When: Check localStorage
Then: JWT token should be stored securely
```

**Browser Console Check:**
```javascript
localStorage.getItem('token')
// Should return JWT string
localStorage.getItem('currentUser')
// Should return stringified user object
```

**Pass Criteria:**
- ✓ Token stored in localStorage
- ✓ User data stored in localStorage
- ✓ No sensitive data exposed

---

### TC-021: Token Expiration
```
Given: JWT token in localStorage
When: 7 days pass (or mock time)
Then: Token should be invalid
  AND: User should not be able to access protected pages
```

**Steps:**
1. Manually set token expiration to past time
2. Try to access protected page
3. Should redirect to login
4. Should show "Session expired" message

**Pass Criteria:**
- ✓ Expired tokens rejected
- ✓ Auto-redirect to login
- ✓ Clear message to user

---

## 8. API Endpoint Testing

### TC-022: Verify Token Endpoint
```
POST /api/auth/google/verify-token

Request:
{
  "token": "google_id_token_string"
}

Response (New User):
{
  "success": true,
  "status": "new",
  "profileData": { ... },
  "referenceNumber": "GOO-TS123AB-R4X7P"
}
```

**Test with cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/google/verify-token \
  -H "Content-Type: application/json" \
  -d '{"token":"your_token_here"}'
```

**Pass Criteria:**
- ✓ 200 OK response
- ✓ Proper JSON structure
- ✓ Correct status field

---

### TC-023: Registration Endpoint
```
POST /api/auth/google/register

Request:
{
  "google_id": "sub_value",
  "reference_number": "GOO-TS123AB-R4X7P",
  "full_name": "Test User",
  ... (other fields)
}

Response:
{
  "success": true,
  "message": "Registration successful!",
  "farmerId": 123
}
```

**Pass Criteria:**
- ✓ 200 OK response
- ✓ Farmer ID returned
- ✓ Database record created

---

### TC-024: Login Endpoint
```
POST /api/auth/google/login

Request:
{
  "google_id": "sub_value",
  "farmerId": 123
}

Response:
{
  "success": true,
  "farmer": { ... },
  "token": "jwt_token_here"
}
```

**Pass Criteria:**
- ✓ 200 OK response
- ✓ JWT token returned
- ✓ Farmer data included

---

## 9. Error Scenarios

### TC-025: Invalid Token Error
```
Given: Invalid Google token provided
When: Token verification attempted
Then: 401 Unauthorized should be returned
  AND: Appropriate error message shown
```

**Steps:**
1. Send fake/malformed token to /api/auth/google/verify-token
2. Verify 401 response
3. Check error message: "Failed to verify Google token"

**Pass Criteria:**
- ✓ 401 status code
- ✓ Clear error message
- ✓ No sensitive data in response

---

### TC-026: Missing Google Client ID
```
Given: GOOGLE_CLIENT_ID not configured
When: User attempts Google login
Then: 500 error with helpful message
```

**Pass Criteria:**
- ✓ 500 error returned
- ✓ Message: "Google Client ID not configured"
- ✓ User friendly error in frontend

---

### TC-027: Invalid Barangay ID
```
Given: Registration form with non-existent barangay_id
When: Form submitted
Then: 400 error: "Invalid barangay_id"
```

**Pass Criteria:**
- ✓ 400 Bad Request
- ✓ Clear error message
- ✓ No database record created

---

### TC-028: Network Connection Lost
```
Given: User filling registration form
When: Network connection lost during submission
Then: Appropriate error message shown
  AND: User can retry
```

**Pass Criteria:**
- ✓ Network error detected
- ✓ User-friendly error message
- ✓ Retry button available
- ✓ Form data preserved

---

## 10. Security Tests

### TC-029: SQL Injection Prevention
```
Given: Malicious input in registration form
When: Form submitted
Then: SQL injection should be prevented
```

**Test Payloads:**
```
Full Name: '; DROP TABLE farmers; --
Email: test@test.com' OR '1'='1
Phone: '; DELETE FROM farmers WHERE '1'='1
```

**Pass Criteria:**
- ✓ Payloads treated as data, not SQL
- ✓ Data inserted safely
- ✓ No tables dropped

---

### TC-030: XSS Prevention
```
Given: User profile picture URL from Google
When: Page loaded
Then: JavaScript in URL should not execute
```

**Test Case:**
```
Google picture URL: javascript:alert('XSS')
```

**Pass Criteria:**
- ✓ URL escaped/sanitized
- ✓ No JavaScript executed
- ✓ Image fails to load (safe)

---

### TC-031: CSRF Token (if applicable)
```
Given: Google registration form
When: Form submitted
Then: CSRF protection should be in place
```

**Pass Criteria:**
- ✓ CORS properly configured
- ✓ No unauthorized origin access
- ✓ Referer check implemented

---

## 11. Performance Tests

### TC-032: Token Verification Response Time
```
Given: Valid Google token
When: Token verification API called
Then: Response should arrive within 500ms
```

**Measurement:**
```
Network -> XHR -> verify-token -> Timing tab
Expected: < 500ms
```

**Pass Criteria:**
- ✓ Response time < 500ms
- ✓ No timeout errors
- ✓ Consistent performance

---

### TC-033: Database Query Performance
```
Given: Multiple farmers in database
When: Query by google_id executed
Then: Query should complete within 50ms
```

**Database Profiling:**
```sql
SET SESSION profiling = 1;
SELECT * FROM farmers WHERE google_id = 'sub_123';
SHOW PROFILES;
```

**Pass Criteria:**
- ✓ Query time < 50ms
- ✓ Index used effectively
- ✓ No full table scans

---

## 12. Cross-Browser Testing

### TC-034: Chrome Browser
- [ ] Google button displays
- [ ] Sign-in popup works
- [ ] Form validation works
- [ ] Responsive design works

### TC-035: Firefox Browser
- [ ] Google button displays
- [ ] Sign-in popup works
- [ ] Form validation works
- [ ] LocalStorage works

### TC-036: Safari Browser
- [ ] Google button displays
- [ ] Sign-in popup works
- [ ] Form validation works
- [ ] No cookie/storage issues

### TC-037: Edge Browser
- [ ] Google button displays
- [ ] Sign-in popup works
- [ ] JWT token handling works

---

## 13. Mobile Testing

### TC-038: Mobile Layout
```
GIVEN: Registration form on mobile (320px width)
WHEN: Page loads
THEN: Form should be fully responsive
```

**Test:**
- [ ] Text readable without scrolling horizontally
- [ ] Buttons touchable (min 44px height)
- [ ] Form inputs properly sized
- [ ] No overlapping elements

### TC-039: Mobile Google Sign-In
```
GIVEN: Mobile device
WHEN: Click "Continue with Google"
THEN: Mobile-friendly sign-in flow should work
```

---

## Final Checklist

### Pre-Deployment Tests
- [ ] TC-001 through TC-039 all passed
- [ ] No unresolved bugs
- [ ] Security tests passed
- [ ] Performance benchmarks met
- [ ] Cross-browser testing done
- [ ] Mobile testing done
- [ ] Database migration verified
- [ ] Error messages user-friendly

### Deployment Readiness
- [ ] Documentation complete
- [ ] Team trained on system
- [ ] Rollback plan tested
- [ ] Monitoring configured
- [ ] Support ready
- [ ] Users notified

---

**Test Plan Complete**  
**Status:** Ready for QA Execution  
**Next Step:** Execute tests and log results

---

For any issues found, create bug report with:
- Test case number
- Step to reproduce
- Expected vs actual result
- Browser/device used
- Screenshots/logs
