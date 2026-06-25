# Forgot Password with OTP Email Verification — Design Spec

**Date:** 2026-06-25
**Status:** Approved

## Overview

Add a "Forgot Password" flow to the Login page that sends a 6-digit OTP to the user's registered email. The user verifies the OTP, then sets a new password. The flow is contained within the existing Login card as a multi-step wizard.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Email provider | Resend | Modern API, free tier (100/day), simple Python SDK |
| OTP storage | Database columns on User model | Simple, no new infrastructure |
| OTP format | 6-digit numeric | Industry standard, easy to type |
| OTP expiry | 5 minutes | Secure but user-friendly |
| UI approach | In-card multi-step (not separate page) | Matches existing Login/Sign Up toggle pattern |

## User Flow

```
Login page → "Forgot Password?" link
  → Step 1: Enter email → "Send OTP"
    → Backend generates 6-digit OTP, stores in DB, sends via Resend
      → Step 2: Enter 6-digit OTP → "Verify"
        → Backend verifies OTP match + expiry
          → Step 3: Enter new password + confirm password → "Reset Password"
            → Backend updates password_hash, clears OTP
              → Step 4: Success message → auto-redirect to Login
```

## Backend Changes

### Database Migration (User model)

Add two columns to the `users` table:

- `otp_code` — `String(6), nullable=True` — stores the 6-digit OTP
- `otp_expires_at` — `DateTime, nullable=True` — timestamp when OTP expires

### New Endpoints (on `/auth` router)

#### `POST /auth/forgot-password`

**Request body:**
```json
{ "email": "user@example.com" }
```

**Behavior:**
1. Look up user by email
2. If not found, return 404 with "No account found with this email"
3. Generate a random 6-digit numeric OTP
4. Store `otp_code` and `otp_expires_at` (current time + 5 minutes) on the user record
5. Send OTP email via Resend
6. Return 200 with success message

**Response:**
```json
{ "message": "OTP sent to your email" }
```

#### `POST /auth/verify-otp`

**Request body:**
```json
{ "email": "user@example.com", "otp": "482916" }
```

**Behavior:**
1. Look up user by email
2. Check `otp_code` and `otp_expires_at` exist and are not expired
3. Compare OTP (constant-time comparison)
4. If valid, generate a one-time reset token (JWT with short expiry, e.g. 10 minutes), return it
5. Clear the OTP fields from the user record (single-use)

**Response:**
```json
{ "reset_token": "<jwt>" }
```

**Errors:**
- 400: "Invalid or expired OTP"
- 404: "No account found with this email"

#### `POST /auth/reset-password`

**Request body:**
```json
{ "reset_token": "<jwt>", "new_password": "newpass123" }
```

**Behavior:**
1. Decode the reset token JWT
2. Extract email from token `sub`
3. Look up user by email
4. Hash new password with bcrypt
5. Update `password_hash` on user record
6. Return 200 with success message

**Response:**
```json
{ "message": "Password reset successful" }
```

**Errors:**
- 400: "Invalid or expired reset token"
- 404: "User not found"

### Email Service

New file: `backend/email_service.py`

- Initialize Resend client with `RESEND_API_KEY` from `.env`
- Function `send_otp_email(to_email, otp_code)` — sends a branded HTML email with:
  - BehaviorEdge branding (violet/purple theme)
  - OTP code displayed prominently
  - Expiry notice (5 minutes)
  - Security warning (don't share this code)

### Environment Variables

Add to `backend/.env`:
```
RESEND_API_KEY=re_xxxxx
```

### Dependencies

Add to `backend/requirements.txt`:
```
resend>=2.0.0
```

## Frontend Changes

### `Login.jsx` — Multi-Step Card

Replace the simple `isSignup` toggle with a `view` state machine:

```jsx
const [view, setView] = useState('login')
// Views: 'login' | 'signup' | 'forgot' | 'verify-otp' | 'reset-password' | 'success'
```

**Step views:**

| View | Content |
|------|---------|
| `login` | Current login form + "Forgot Password?" link below Sign In button |
| `signup` | Current signup form |
| `forgot` | Email input + "Send OTP" button + "Back to Login" link |
| `verify-otp` | 6-digit OTP input + "Verify" button + "Resend OTP" link (with 60s cooldown) + "Back" link |
| `reset-password` | New password + confirm password inputs + "Reset Password" button |
| `success` | Green success message with checkmark icon, auto-redirects to login after 2 seconds |

**Additional state:**
- `forgotEmail` — stores the email entered in forgot step (carried through verify and reset steps)
- `resetToken` — stores the JWT from OTP verification
- `otpCooldown` — countdown timer (60 seconds) for resend button
- `otpTimer` — auto-redirect countdown on success view

### `api/client.js` — New API Functions

```js
export const forgotPassword = (data) => api.post('/auth/forgot-password', data)
export const verifyOtp = (data) => api.post('/auth/verify-otp', data)
export const resetPassword = (data) => api.post('/auth/reset-password', data)
```

## Error Handling

| Scenario | Backend Response | Frontend Display |
|----------|-----------------|-------------------|
| Email not found | 404 "No account found with this email" | Error message in card |
| OTP expired | 400 "Invalid or expired OTP" | Error + prompt to resend |
| OTP incorrect | 400 "Invalid or expired OTP" | Error + retry |
| Password too short | 422 validation error | Error below field |
| Passwords don't match | Frontend validation | Error below confirm field |
| Reset token expired | 400 "Invalid or expired reset token" | Error + redirect to forgot step |
| Resend cooldown active | Frontend disabled state | Button disabled with countdown |

## Files to Create/Modify

### New Files
- `backend/email_service.py` — Resend email wrapper with OTP template

### Modified Files
- `backend/models.py` — Add `otp_code`, `otp_expires_at` to User model
- `backend/schemas.py` — Add `ForgotPassword`, `VerifyOtp`, `ResetPassword` schemas
- `backend/routers/auth.py` — Add 3 new endpoints
- `backend/requirements.txt` — Add `resend` dependency
- `backend/.env` — Add `RESEND_API_KEY`
- `backend/main.py` — (No changes needed, router auto-included)
- `frontend/src/pages/Login.jsx` — Multi-step Forgot Password UI
- `frontend/src/api/client.js` — Add 3 API functions

### Database Migration
Run after model changes to add the two new columns to the `users` table.
