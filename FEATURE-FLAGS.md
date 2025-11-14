# Feature Flags

## Overview

Feature flags allow you to enable or disable features without code changes. This is useful for:
- Rolling out features gradually
- Quickly disabling problematic features
- A/B testing
- Emergency rollbacks

## Available Feature Flags

### Password Reset Feature

**Environment Variable:** `FEATURE_PASSWORD_RESET`  
**Default:** `true` (enabled)  
**Type:** Boolean

Controls the password reset functionality including:
- Admin user creation with welcome emails
- Admin-triggered password resets
- User-requested password resets
- Password reset page (`/password_reset`)

#### Enable Password Reset
```bash
FEATURE_PASSWORD_RESET=true
```

#### Disable Password Reset
```bash
FEATURE_PASSWORD_RESET=false
```

#### Not Set (Default Behavior)
```bash
# Omit the variable entirely - defaults to enabled
```

## How to Use

### Development

Add to your local `.env` file:
```bash
# Enable password reset (default)
FEATURE_PASSWORD_RESET=true

# Or disable it
FEATURE_PASSWORD_RESET=false
```

### Production (EC2)

1. **Edit environment file:**
   ```bash
   sudo nano /path/to/.env
   ```

2. **Update or add the flag:**
   ```bash
   FEATURE_PASSWORD_RESET=false
   ```

3. **Restart the application:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Quick Toggle (No Restart)

While the current implementation requires a restart, you can monitor the feature flag status in the server logs:

```bash
# Check current status in logs
docker logs ismellbs-backend-1 | grep "Feature Flags"

# You'll see:
# 🚩 Feature Flags: Password Reset = ENABLED
# or
# 🚩 Feature Flags: Password Reset = DISABLED
```

## API Behavior When Disabled

When `FEATURE_PASSWORD_RESET=false`, the following endpoints return HTTP 503:

### Admin Endpoints
```
POST /api/admin/app-users/create
POST /api/admin/app-users/:userId/reset-password
```

### User Endpoints
```
POST /api/users/forgot-password
POST /api/users/reset-password
GET /api/users/verify-reset-token
```

**Response:**
```json
{
  "success": false,
  "error": "Password reset feature is currently disabled"
}
```

## Frontend Handling

The password reset page (`/password_reset`) will display a user-friendly message when the feature is disabled:

> "Password reset feature is temporarily disabled. Please try again later or contact support."

## Use Cases

### Emergency Disable

If you discover an issue with password reset emails or security concern:

1. **SSH into EC2:**
   ```bash
   ssh ec2-user@ismellbullshit.com
   ```

2. **Edit .env:**
   ```bash
   cd /path/to/ismellbs
   nano .env
   # Change FEATURE_PASSWORD_RESET=true to false
   ```

3. **Restart:**
   ```bash
   docker-compose down && docker-compose up -d
   ```

4. **Verify:**
   ```bash
   docker logs ismellbs-backend-1 | grep "Feature Flags"
   # Should show: 🚩 Feature Flags: Password Reset = DISABLED
   ```

### Gradual Rollout

1. **Start disabled:**
   ```bash
   FEATURE_PASSWORD_RESET=false
   ```

2. **Test internally** with feature enabled in development

3. **Enable in production** when confident:
   ```bash
   FEATURE_PASSWORD_RESET=true
   ```

### SMTP Configuration Issues

If SMTP credentials are not yet configured:

```bash
# Temporarily disable to prevent error emails to users
FEATURE_PASSWORD_RESET=false

# Configure SMTP (see PASSWORD-RESET-GUIDE.md)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Re-enable
FEATURE_PASSWORD_RESET=true
```

## Monitoring

### Server Logs
```bash
# Check feature status on startup
docker logs ismellbs-backend-1 | grep "Feature Flags"

# Monitor password reset attempts when disabled
docker logs -f ismellbs-backend-1 | grep "Password reset feature"
```

### Metrics to Track

When the feature is enabled:
- Number of password reset requests
- Number of successful resets
- Email delivery success rate
- Token expiration rate

When disabled:
- Number of 503 responses
- User support tickets related to password reset

## Best Practices

1. **Always test before enabling in production**
   - Test locally with flag enabled
   - Test on staging environment
   - Verify SMTP configuration works

2. **Monitor after enabling**
   - Watch server logs for errors
   - Check email delivery
   - Monitor user feedback

3. **Have a rollback plan**
   - Know how to quickly disable the flag
   - Document who has SSH access
   - Keep admin credentials handy

4. **Communicate changes**
   - Notify users if disabling the feature
   - Update status page or support docs
   - Provide alternative contact methods

## Future Flags

You can add more feature flags to `server/config/secrets.ts`:

```typescript
export const FEATURE_FLAGS = {
  PASSWORD_RESET_ENABLED: process.env.FEATURE_PASSWORD_RESET !== 'false',
  
  // Add new flags here:
  COMMENTS_ENABLED: process.env.FEATURE_COMMENTS !== 'false',
  NOTIFICATIONS_ENABLED: process.env.FEATURE_NOTIFICATIONS !== 'false',
  ADMIN_API_ENABLED: process.env.FEATURE_ADMIN_API !== 'false',
};
```

## Troubleshooting

### Flag Not Taking Effect

1. **Check .env file exists:**
   ```bash
   ls -la .env
   cat .env | grep FEATURE_PASSWORD_RESET
   ```

2. **Verify Docker environment:**
   ```bash
   docker-compose config | grep FEATURE_PASSWORD_RESET
   ```

3. **Ensure container restarted:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

4. **Check startup logs:**
   ```bash
   docker logs ismellbs-backend-1 | head -n 50
   ```

### Feature Shows Wrong Status

- Clear browser cache
- Check correct `.env` file is being used
- Verify environment variable syntax (no spaces around `=`)
- Restart Docker containers completely

## Quick Reference

```bash
# Enable feature
FEATURE_PASSWORD_RESET=true

# Disable feature  
FEATURE_PASSWORD_RESET=false

# Check status
docker logs ismellbs-backend-1 | grep "Feature Flags"

# Restart to apply changes
docker-compose restart backend
```
