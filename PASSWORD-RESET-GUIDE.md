# Password Reset Feature Documentation

## Overview

The password reset feature allows administrators to create user accounts and send password reset emails. Users can also request password resets themselves. All reset links are time-limited (1 hour) and use secure tokens.

## Features

### Admin Features
1. **Create User Accounts** - Admin can create new user accounts with temporary passwords
2. **Trigger Password Resets** - Admin can send password reset emails to existing users
3. **User Management** - View all users, toggle active status, delete users

### User Features
1. **Forgot Password** - Request a password reset email
2. **Reset Password** - Use the emailed link to set a new password
3. **Secure Tokens** - Reset links expire after 1 hour for security

## API Endpoints

### Admin Endpoints (Require Authentication)

#### Create User
```
POST /api/admin/app-users/create
Authorization: Bearer <admin-token>

Body:
{
  "email": "user@example.com",
  "displayName": "John Doe",
  "tempPassword": "TempPass123"
}

Response:
{
  "success": true,
  "message": "User created successfully. Welcome email sent.",
  "userId": "elasticsearch-doc-id"
}
```

#### Admin Reset Password
```
POST /api/admin/app-users/:userId/reset-password
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "message": "Password reset email sent to user."
}
```

### Public User Endpoints

#### Request Password Reset
```
POST /api/users/forgot-password

Body:
{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "Password reset email sent. Check your inbox."
}

Note: Always returns success even if email doesn't exist (security)
Rate Limit: 5 requests per 5 minutes per IP
```

#### Reset Password
```
POST /api/users/reset-password

Body:
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePassword123"
}

Response:
{
  "success": true,
  "message": "Password reset successfully. You can now log in."
}

Rate Limit: 5 requests per 5 minutes per IP
```

#### Verify Reset Token
```
GET /api/users/verify-reset-token?token=<reset-token>

Response:
{
  "success": true,
  "email": "user@example.com"
}
```

## Frontend Routes

### Password Reset Page
```
URL: https://www.ismellbullshit.com/password_reset?token=<reset-token>
```

The page will:
1. Extract token from URL query parameters
2. Verify the token is valid and not expired
3. Display a password reset form
4. Submit new password with token
5. Redirect to login on success

## Email Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Gmail Configuration (Recommended for testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM="I Smell Bullshit <noreply@ismellbullshit.com>"
```

### Gmail Setup Steps

1. **Enable 2-Factor Authentication**
   - Go to Google Account settings
   - Security → 2-Step Verification → Turn On

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other (Custom name)" → "I Smell Bullshit"
   - Click "Generate"
   - Copy the 16-character password
   - Use this password in `SMTP_PASSWORD` (not your regular Gmail password)

3. **Update .env file**
   ```bash
   SMTP_USER=your-gmail-address@gmail.com
   SMTP_PASSWORD=abcd efgh ijkl mnop  # 16-character app password
   ```

### Alternative SMTP Providers

#### SendGrid (Production Recommended)
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<your-sendgrid-api-key>
```

#### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=<mailgun-smtp-username>
SMTP_PASSWORD=<mailgun-smtp-password>
```

#### AWS SES
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=<aws-ses-smtp-username>
SMTP_PASSWORD=<aws-ses-smtp-password>
```

## Email Templates

### Welcome Email (New User)
- Sent when admin creates a user
- Contains temporary password
- Instructs user to change password immediately
- Includes login link

### Password Reset Email
- Sent on password reset request
- Contains secure reset link with token
- Link expires in 1 hour
- Includes security warnings

## Security Features

1. **Token Expiration** - Reset tokens expire after 1 hour
2. **Secure Token Generation** - Uses crypto.randomBytes(32)
3. **Rate Limiting** - Prevents brute force attacks:
   - Forgot password: 5 requests per 5 minutes
   - Reset password: 5 requests per 5 minutes
4. **Password Hashing** - All passwords bcrypt hashed with salt rounds 10
5. **No Email Enumeration** - "Forgot password" always returns success
6. **Single Use Tokens** - Tokens cleared after successful reset

## Database Schema

User document in Elasticsearch includes:
```typescript
{
  email: string;
  password: string; // bcrypt hashed
  displayName: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  resetToken?: string; // cleared after use
  resetTokenExpiry?: number; // timestamp
}
```

## Testing

### Development Mode (Without SMTP)
If `SMTP_USER` is not configured, emails are logged to console:
```
📧 PASSWORD RESET EMAIL (SMTP not configured):
To: user@example.com
Reset URL: https://www.ismellbullshit.com/password_reset?token=abc123...
```

### Testing Flow

1. **Admin Creates User**
   ```bash
   curl -X POST http://localhost:3000/api/admin/app-users/create \
     -H "Authorization: Bearer <admin-token>" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","displayName":"Test User","tempPassword":"TempPass123"}'
   ```

2. **User Requests Reset**
   ```bash
   curl -X POST http://localhost:3000/api/users/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

3. **Check Console for Reset Link** (if SMTP not configured)

4. **Visit Reset Page**
   ```
   http://localhost:3000/password_reset?token=<token-from-console>
   ```

5. **Submit New Password**

## Deployment Checklist

- [ ] Install dependencies: `npm install` (includes nodemailer)
- [ ] Configure SMTP credentials in `.env`
- [ ] Test email sending in development
- [ ] Update Elasticsearch user index mapping (add resetToken fields)
- [ ] Build and deploy updated code
- [ ] Test password reset flow end-to-end
- [ ] Monitor email delivery logs

## Troubleshooting

### Emails Not Sending

1. **Check SMTP credentials**
   ```bash
   # Verify environment variables are set
   echo $SMTP_USER
   echo $SMTP_HOST
   ```

2. **Gmail Issues**
   - Ensure 2FA is enabled
   - Use App Password, not regular password
   - Check "Less secure app access" is OFF (use App Password instead)

3. **Check Server Logs**
   ```bash
   docker logs ismellbs-backend-1
   ```

### Token Expired

- Tokens expire after 1 hour
- User must request a new reset link
- Old tokens cannot be reused

### Rate Limiting

- Wait 5 minutes between multiple attempts
- Admin can clear rate limits: `POST /api/admin/rate-limit/clear`

## Admin Dashboard Integration

Add to `AdminDashboard.tsx`:

```typescript
// Create new user
const createUser = async (email: string, displayName: string) => {
  const tempPassword = generateRandomPassword(); // implement this
  const response = await axios.post('/api/admin/app-users/create', {
    email,
    displayName,
    tempPassword
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  return response.data;
};

// Send password reset
const resetUserPassword = async (userId: string) => {
  const response = await axios.post(
    `/api/admin/app-users/${userId}/reset-password`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  return response.data;
};
```

## Future Enhancements

- [ ] Email verification on registration
- [ ] Password strength meter in UI
- [ ] Account lockout after failed attempts
- [ ] Password history (prevent reuse)
- [ ] Multi-factor authentication
- [ ] Email templates customization
- [ ] Bulk user import
- [ ] User invitation system
