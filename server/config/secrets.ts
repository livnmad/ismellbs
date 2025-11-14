/**
 * Centralized secrets and configuration management
 * All sensitive configuration should be loaded from environment variables
 */

export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Feature Flags
export const FEATURE_FLAGS = {
  PASSWORD_RESET_ENABLED: process.env.FEATURE_PASSWORD_RESET !== 'false', // Enabled by default
};

// Warn if using default values
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: Using default JWT_SECRET. Set JWT_SECRET environment variable in production!');
}

// Log feature flag status
console.log(`🚩 Feature Flags: Password Reset = ${FEATURE_FLAGS.PASSWORD_RESET_ENABLED ? 'ENABLED' : 'DISABLED'}`);

// Export for type safety
export const getJWTSecret = (): string => {
  return JWT_SECRET;
};
