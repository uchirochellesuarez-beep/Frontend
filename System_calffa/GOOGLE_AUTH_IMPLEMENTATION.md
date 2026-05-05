# Google Authentication with Assisted Registration System

## System Overview

This document describes the complete implementation of Google OAuth 2.0 authentication with assisted registration for the Barangay-Based Farmer Management System.

## Architecture

### Technology Stack

**Frontend:**
- Vue 3 (Composition API)
- Vite
- Pinia (State Management)
- Vue Router
- Google Identity Services (GIS)

**Backend:**
- Node.js
- Express.js
- MySQL
- JWT Authentication

### Key Components

#### Backend Components

1. **Google Auth Utility** (`utils/googleAuth.js`)
   - `verifyGoogleToken()` - Validates Google ID tokens with Google's API
   - `generateGoogleReferenceNumber()` - Creates unique reference numbers for Google users
   - `extractGoogleProfileData()` - Extracts profile information from tokens
   - `findUserByEmail()` - Database lookup by email
   - `findUserByGoogleId()` - Database lookup by Google ID

2. **Auth Routes** (`routes/auth.js`)
   - `POST /api/auth/google/verify-token` - Verifies Google ID token
   - `POST /api/auth/google/register` - Registers new user via Google
   - `POST /api/auth/google/login` - Logs in existing Google user
   - `POST /api/auth/google/link` - Links Google account to existing user

3. **Database Migration** (`migrations/add-google-auth.js`)
   - Adds `google_id` column to farmers table
   - Creates index for faster lookups

#### Frontend Components

1. **GoogleSignInButton.vue** (`components/GoogleSignInButton.vue`)
   - Displays "Continue with Google" button
   - Handles Google sign-in flow
   - Routes users based on account status

2. **GoogleRegistration.vue** (`views/GoogleRegistration.vue`)
   - Assisted registration form
   - Pre-fills user data from Google profile
   - Collects required farm information
   - Progress indicator for multi-step flow

3. **AuthStore** (`stores/authStore.js`)
   - `googleLogin()` - Pinia action for Google login
   - `verifyGoogleToken()` - Token verification action
   - `googleRegister()` - Registration action

### Database Schema Changes

#### New Column: farmers.google_id

```sql
ALTER TABLE farmers ADD COLUMN google_id VARCHAR(255) UNIQUE NULL AFTER password_hash;
CREATE INDEX idx_google_id ON farmers(google_id);
```

#### Required Columns (must exist):
- `email` (VARCHAR) - User's email address
- `profile_picture` (VARCHAR) - URL to user's Google profile picture

## Setup Instructions

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable "Google Identity Services API"
4. Go to "Credentials" → Create OAuth 2.0 Client ID
5. Choose "Web Application"
6. Add authorized redirect URIs:
   - `http://localhost:3000` (local development)
   - `http://localhost:5173` (Vite dev server)
   - Your production domain
7. Copy the Client ID

### Step 2: Database Migration

```bash
cd backend
node migrations/add-google-auth.js
```

This will:
- Add `google_id` column to farmers table
- Create index for performance
- Verify the migration completed

### Step 3: Configure Environment Variables

**Backend (`backend/.env`):**
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_PORT=3306
DB_NAME=agriculture_portal
JWT_SECRET=your-super-secret-jwt-key-change-in-production
GOOGLE_CLIENT_ID=your-google-client-id-here
```

**Frontend (`farmer-registration/.env`):**
```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
```

### Step 4: Install Dependencies (if needed)

Backend already has required dependencies. Frontend Google SDK is loaded via script tag in GoogleSignInButton.vue.

### Step 5: Run Migrations

```bash
cd backend
npm run dev
# Backend should start on http://localhost:3000
```

```bash
cd farmer-registration
npm run dev
# Frontend should start on http://localhost:5173
```

## User Flows

### Flow 1: New User Registration via Google

```
1. User clicks "Continue with Google"
   ↓
2. Google account selector appears
   ↓
3. User selects Google account
   ↓
4. Frontend sends ID token to backend
   ↓
5. Backend verifies token with Google
   ↓
6. Check if google_id exists in database
   - If exists: Proceed to login
   - If new: Continue to step 7
   ↓
7. Frontend receives profile data
   ↓
8. GoogleRegistration page loads with pre-filled data:
   - Full Name
   - Email
   - Profile Picture
   - Reference Number (auto-generated)
   ↓
9. User completes required fields:
   - Phone Number
   - Date of Birth
   - Address
   - Educational Status
   - Barangay (dropdown)
   - Land Area
   - Farm Location
   - Membership Type
   ↓
10. User agrees to terms and conditions
    ↓
11. Click "Complete Registration"
    ↓
12. Backend creates farmer record with:
    - status: 'pending'
    - is_farmer: 1
    - role: 'farmer'
    ↓
13. Frontend redirects to Login page
    ↓
14. Account pending approval from Barangay President
```

### Flow 2: Existing User Login via Google

```
1. User clicks "Continue with Google"
   ↓
2. Google account selector appears
   ↓
3. User selects Google account
   ↓
4. Backend checks if google_id exists
   ↓
5a. If google_id found AND status = 'approved':
    - Generate JWT token (7 days)
    - Set token in localStorage
    - Redirect to dashboard
    - Login successful ✓
    ↓
5b. If google_id found AND status = 'pending':
    - Show error: "Account pending approval"
    - User cannot log in ✗
    ↓
5c. If email exists but no google_id:
    - Account was registered manually before
    - Offer to link Google account
    - User enters password to verify identity
```

### Flow 3: Account Linking (Manual Registration + Google)

```
1. User has existing account (registered manually)
   ↓
2. Tries to log in with Google
   ↓
3. Email matches existing account
   ↓
4. Backend prompts for password verification
   ↓
5. User enters password
   ↓
6. Backend verifies password and links google_id
   - Update farmers.google_id
   ↓
7. Login proceeds (if account approved)
```

### Flow 4: Barangay-Based Approval

```
FARMER                    BARANGAY PRESIDENT           ADMIN
   |                            |                       |
   | Account Created (pending)  |                       |
   |                            |                       |
   | -------- Notification ---> |                       |
   |                            |                       |
   |                  Reviews Application               |
   |                            |                       |
   |                  Approves Account                  |
   |                  (status='approved')               |
   |                            |                       |
   | <---- Approval Notice ----- |                       |
   |                            |                       |
   | Can now login              |                       |
   |                            |                       |
```

**Rules:**
- Only President in same barangay can approve farmers
- Admin can approve users from any barangay
- Once approved, user can log in
- Permission check in SQL: `WHERE farmer.barangay_id = president.barangay_id`

## API Endpoints

### 1. Verify Google Token
```http
POST /api/auth/google/verify-token
Content-Type: application/json

{
  "token": "google_id_token_here"
}

Response (Existing User):
{
  "success": true,
  "status": "existing",
  "user": {
    "id": 123,
    "reference_number": "REF-20260321-ABC12",
    "full_name": "Juan dela Cruz",
    "status": "approved",
    "role": "farmer",
    "barangay_id": 1
  },
  "profileData": {
    "google_id": "sub_string",
    "email": "juan@example.com",
    "given_name": "Juan",
    "family_name": "dela Cruz",
    "name": "Juan dela Cruz",
    "picture": "https://..."
  }
}

Response (New User):
{
  "success": true,
  "status": "new",
  "profileData": { ... },
  "referenceNumber": "GOO-TS123AB-R4X7P"
}

Response (Email Exists):
{
  "success": true,
  "status": "existing-email",
  "user": { ... },
  "profileData": { ... }
}
```

### 2. Register New User
```http
POST /api/auth/google/register
Content-Type: application/json

{
  "google_id": "sub_string",
  "reference_number": "GOO-TS123AB-R4X7P",
  "full_name": "Juan dela Cruz",
  "email": "juan@example.com",
  "given_name": "Juan",
  "family_name": "dela Cruz",
  "profile_picture": "https://...",
  "phone_number": "09171234567",
  "educational_status": "High School Graduate",
  "land_area": 2.5,
  "farm_location": "14.8159° N, 121.2965° E",
  "barangay_id": 1,
  "membership_type": "member",
  "date_of_birth": "1985-05-15",
  "address": "123 Main St, Barangay Camansihan"
}

Response:
{
  "success": true,
  "message": "Registration successful! Your account is pending approval...",
  "farmerId": 456
}
```

### 3. Login Existing User
```http
POST /api/auth/google/login
Content-Type: application/json

{
  "google_id": "sub_string",
  "farmerId": 123
}

Response (Approved):
{
  "success": true,
  "message": "Login successful!",
  "farmer": {
    "id": 123,
    "reference_number": "REF-20260321-ABC12",
    "full_name": "Juan dela Cruz",
    "email": "juan@example.com",
    "role": "farmer",
    "barangay_id": 1,
    "status": "approved"
  },
  "barangay": {
    "id": 1,
    "name": "Camansihan",
    "location": "..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response (Pending):
{
  "success": false,
  "message": "Your account is still pending approval from your Barangay President."
}
```

### 4. Link Google Account
```http
POST /api/auth/google/link
Content-Type: application/json

{
  "farmerId": 123,
  "google_id": "sub_string",
  "password": "user_password"
}

Response:
{
  "success": true,
  "message": "Google account linked successfully!"
}
```

## Security Considerations

### Token Verification
- Google ID tokens are verified against Google's token endpoint
- Audience validation ensures token is for correct Client ID
- Email verification ensures user's email is verified by Google
- Token expiration is checked

### Data Protection
- Google ID is stored in unique indexed column to prevent duplicates
- Passwords are never transmitted in Google authentication flows
- JWT tokens expire in 7 days
- Sensitive fields (password_hash) are never returned to frontend

### Barangay Data Isolation
- Farmers can only be seen by their barangay president or admin
- Officers can only manage data within their assigned barangay
- System enforces `barangay_id` foreign key constraints

### Email Deduplication
- System checks for duplicate emails before registration
- Prevents multiple accounts with same email address
- Allows account linking for users who registered manually before

## Error Handling

### Backend Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Token invalid" | Google token expired or malformed | Ask user to sign in again |
| "Token audience mismatch" | Wrong Client ID | Check GOOGLE_CLIENT_ID in .env |
| "Email not verified" | Google email not verified | User needs to verify email in Google |
| "User not found" | google_id doesn't exist | Proceed to registration |
| "Account pending approval" | Farmer status = pending | Wait for barangay president approval |
| "Invalid barangay_id" | Barangay doesn't exist | Check barangays table |

### Frontend Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Google Sign-In library not loaded" | Script failed to load | Check internet connection |
| "Cannot connect to server" | Backend not running | Start backend on port 3000 |
| "Phone number must be 11 digits" | Invalid format | Use Philippine format (09xx-xxx-xxxx) |
| "You must be at least 18 years old" | Invalid birthdate | Enter valid date of birth |

## Testing

### Manual Testing Checklist

```
Google Registration Flow:
[ ] Google Sign-In button appears on login page
[ ] Clicking button opens Google account selector
[ ] Selecting account redirects to registration form
[ ] Form has pre-filled data (name, email, picture)
[ ] Reference number is auto-generated
[ ] Phone number validation works (11 digits)
[ ] Date of birth shows error for age < 18
[ ] Barangay dropdown populates from database
[ ] Form submission creates pending account
[ ] Redirects to login after successful registration

Google Login Flow:
[ ] Existing user can log in with Google
[ ] Approved account redirects to dashboard
[ ] Pending account shows error message
[ ] Token is stored in localStorage
[ ] JWT token includes farmer_id, role, barangay_id

Account Linking:
[ ] User with existing email can link Google
[ ] Password verification works
[ ] google_id is updated in database
[ ] User can log in with Google after linking

Barangay Approval Flow:
[ ] New farmer shows status = pending
[ ] Barangay President can see pending farmers
[ ] President can approve/reject farmers
[ ] After approval, farmer can log in
[ ] Farmers from other barangays don't appear for non-presidents
```

### Performance Testing

- Token verification response time < 500ms
- Database query on google_id index < 50ms
- Registration form page load < 2s

## Troubleshooting

### Issue: Google Sign-In button not appearing

**Check:**
1. Google Identity Services script loaded: `google.accounts.id`
2. VITE_GOOGLE_CLIENT_ID is set in .env
3. Browser console for script load errors

### Issue: "Token audience mismatch" error

**Check:**
1. GOOGLE_CLIENT_ID in backend .env matches frontend VITE_GOOGLE_CLIENT_ID
2. Client ID is correct from Google Cloud Console

### Issue: Farmer can't log in after registration

**Check:**
1. Farmer status in database is "pending"
2. Request Barangay President to approve account
3. After approval, try logging in again

### Issue: Email already registered error

**Check:**
1. User already has account in system
2. Either link Google account or use existing password to log in
3. Contact admin if account issues persist

## Future Enhancements

1. **Multi-factor Authentication (MFA)**
   - Android/iOS OTP
   - Email verification

2. **Social Linking**
   - Facebook Login
   - GitHub Login (for officers)

3. **Profile Picture Upload**
   - Allow users to upload custom profile picture
   - Fallback to Google picture if not provided

4. **Single Sign-On (SSO)**
   - Integrate with government systems
   - SAML 2.0 support

5. **Sessions Management**
   - Remember me feature
   - Device management
   - Session timeout customization

## References

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi)
- [Google OAuth 2.0 Token Info API](https://developers.google.com/identity/protocols/oauth2/web-server#obtain-authorization-grants)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Security Best Practices](https://owasp.org/www-project-top-ten/)

---

**Document Version:** 1.0  
**Last Updated:** March 21, 2026  
**Maintained by:** Development Team
