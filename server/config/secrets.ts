/**
 * Centralized secrets and configuration management
 * All sensitive configuration should be loaded from environment variables
 */

export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Warn if using default values
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: Using default JWT_SECRET. Set JWT_SECRET environment variable in production!');
}

// Export for type safety
export const getJWTSecret = (): string => {
  return JWT_SECRET;
};
