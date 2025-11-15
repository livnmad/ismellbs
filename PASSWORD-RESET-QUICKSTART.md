# Password Reset Feature - Quick Start

## What Was Added

### Backend Services
- ✅ `server/services/email.service.ts` - Email service with nodemailer
- ✅ Updated `server/services/user.service.ts` - Added password reset methods
- ✅ Updated `server/routes/admin.routes.ts` - Admin user creation and reset
- ✅ Updated `server/routes/user.routes.ts` - Public password reset endpoints
- ✅ Updated `server/config/secrets.ts` - Added feature flag control

### Frontend Components
- ✅ `client/src/components/PasswordReset.tsx` - Password reset page
- ✅ `client/src/components/PasswordReset.css` - Styling
- ✅ Updated `client/src/App.tsx` - Added /password_reset route

### Dependencies
- ✅ `nodemailer@6.10.1` - SMTP email sending
- ✅ `@types/nodemailer@6.4.21` - TypeScript types

### Feature Flag
- ✅ `FEATURE_PASSWORD_RESET` - Enable/disable password reset (enabled by default)
- ✅ See `FEATURE-FLAGS.md` for complete documentation

## New API Endpoints

### Admin (Requires Authentication)
```
POST /api/admin/app-users/create
POST /api/admin/app-users/:userId/reset-password
```

### Public (Rate Limited)
```
POST /api/users/forgot-password
POST /api/users/reset-password
GET /api/users/verify-reset-token
```

## Frontend Route
```
https://www.ismellbullshit.com/password_reset?token=<reset-token>
```

## Next Steps

### 1. Configure Email (Required for Production)

Add to `.env` file:

```bash
# Feature Flag (enabled by default)
FEATURE_PASSWORD_RESET=true

# Gmail Example (Quick Setup)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM="I Smell Bullshit <noreply@ismellbullshit.com>"
```

**Gmail App Password Setup:**
1. Enable 2FA: https://myaccount.google.com/security
2. Create App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character password in `SMTP_PASSWORD`

### 2. Build and Deploy

```bash
# Build backend
npm run build

# Build frontend
cd client && npm run build && cd ..

# Deploy to EC2
# Copy .env with SMTP settings
# Restart Docker containers
docker-compose down
docker-compose up -d
```

### 3. Test the Feature

**Without SMTP (Development):**
- Emails are logged to console
- Check Docker logs: `docker logs ismellbs-backend-1`
- Copy reset URL from logs

**With SMTP (Production):**
1. Admin creates user account
2. User receives welcome email with temp password
3. User logs in and changes password
4. Or user clicks "Forgot Password"
5. User receives reset email with link
6. User clicks link → redirected to /password_reset page
7. User enters new password
8. User can now log in

## Security Features

- ✅ Reset tokens expire after 1 hour
- ✅ Tokens are 32-byte secure random values
- ✅ Rate limiting: 5 requests per 5 minutes
- ✅ Passwords bcrypt hashed
- ✅ No email enumeration (always returns success)
- ✅ Single-use tokens (cleared after use)

## Quick Test (Development)

```bash
# 1. Start backend
npm run dev

# 2. Request password reset
curl -X POST http://localhost:3000/api/users/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# 3. Check console output for reset URL
# Console will show:
# 📧 PASSWORD RESET EMAIL (SMTP not configured):
# Reset URL: https://www.ismellbullshit.com/password_reset?token=abc123...

# 4. Open URL in browser (change domain to localhost for dev)
# http://localhost:3000/password_reset?token=abc123...

# 5. Enter new password and submit
```

## Troubleshooting

**Email not sending:**
- Check SMTP credentials in `.env`
- Verify Gmail App Password (not regular password)
- Check logs: `docker logs ismellbs-backend-1`

**Reset link expired:**
- Tokens expire after 1 hour
- Request new reset link

**Rate limited:**
- Wait 5 minutes
- Or admin can clear: `POST /api/admin/rate-limit/clear`

**Feature disabled:**
- Check feature flag: `FEATURE_PASSWORD_RESET=true` in `.env`
- Restart: `docker-compose restart backend`
- Verify in logs: `docker logs ismellbs-backend-1 | grep "Feature Flags"`

## Emergency Disable

If you need to quickly disable password reset:

```bash
# Edit .env
FEATURE_PASSWORD_RESET=false

# Restart
docker-compose restart backend

# Verify
docker logs ismellbs-backend-1 | grep "Feature Flags"
# Should show: 🚩 Feature Flags: Password Reset = DISABLED
```

See `FEATURE-FLAGS.md` for complete feature flag documentation.

## Documentation

See `PASSWORD-RESET-GUIDE.md` for complete documentation including:
- API endpoint details
- Email template customization
- Admin dashboard integration
- Production SMTP providers (SendGrid, Mailgun, AWS SES)
- Security best practices
