import { Client } from '@elastic/elasticsearch';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import emailService from './email.service';

const USERS_INDEX = 'ismellbs-users';

export interface User {
  id: string;
  email: string;
  password: string;
  displayName: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  resetToken?: string;
  resetTokenExpiry?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastLogin?: string;
  postCount?: number;
}

export class UserService {
  private esClient: Client;
  private readonly JWT_SECRET: string;

  constructor(esClient: Client) {
    this.esClient = esClient;
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  WARNING: Using default JWT_SECRET. Set JWT_SECRET environment variable in production!');
    }
  }

  async initializeIndex(): Promise<void> {
    const indexExists = await this.esClient.indices.exists({
      index: USERS_INDEX,
    });

    if (!indexExists) {
      await this.esClient.indices.create({
        index: USERS_INDEX,
        body: {
          mappings: {
            properties: {
              email: { type: 'keyword' },
              password: { type: 'text' },
              displayName: { type: 'text' },
              createdAt: { type: 'date' },
              lastLogin: { type: 'date' },
              isActive: { type: 'boolean' },
              resetToken: { type: 'keyword' },
              resetTokenExpiry: { type: 'long' },
            },
          },
        },
      });
    }
  }

  async register(email: string, password: string, displayName: string): Promise<{ success: boolean; message: string; token?: string }> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Invalid email format' };
    }

    // Check if user already exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      return { success: false, message: 'Email already registered' };
    }

    // Validate password strength
    if (password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }

    // Validate display name
    if (!displayName || displayName.trim().length < 2) {
      return { success: false, message: 'Display name must be at least 2 characters' };
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await this.esClient.index({
      index: USERS_INDEX,
      document: {
        email: email.toLowerCase(),
        password: hashedPassword,
        displayName: displayName.trim(),
        createdAt: new Date().toISOString(),
        isActive: true,
      },
    });

    await this.esClient.indices.refresh({ index: USERS_INDEX });

    // Generate JWT token
    const token = jwt.sign(
      { userId: result._id, email: email.toLowerCase(), role: 'user' },
      this.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { success: true, message: 'Account created successfully', token };
  }

  async login(email: string, password: string): Promise<{ success: boolean; message: string; token?: string; user?: UserProfile }> {
    const user = await this.findByEmail(email.toLowerCase());
    
    if (!user) {
      return { success: false, message: 'Invalid email or password' };
    }

    if (!user.isActive) {
      return { success: false, message: 'Account is disabled. Please contact support.' };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return { success: false, message: 'Invalid email or password' };
    }

    // Update last login
    await this.esClient.update({
      index: USERS_INDEX,
      id: user.id,
      doc: {
        lastLogin: new Date().toISOString(),
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: 'user' },
      this.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.esClient.search({
        index: USERS_INDEX,
        body: {
          query: {
            term: { email: email.toLowerCase() },
          },
        },
      });

      if (result.hits.hits.length === 0) {
        return null;
      }

      const hit = result.hits.hits[0];
      return {
        id: hit._id as string,
        ...(hit._source as Omit<User, 'id'>),
      };
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  }

  async findById(userId: string): Promise<User | null> {
    try {
      const result = await this.esClient.get({
        index: USERS_INDEX,
        id: userId,
      });

      return {
        id: result._id as string,
        ...(result._source as Omit<User, 'id'>),
      };
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const user = await this.findById(userId);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };
  }

  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const result = await this.esClient.search({
        index: USERS_INDEX,
        body: {
          query: { match_all: {} },
          sort: [{ createdAt: 'desc' }],
          size: 1000,
        },
      });

      return result.hits.hits.map((hit: any) => ({
        id: hit._id,
        email: hit._source.email,
        displayName: hit._source.displayName,
        createdAt: hit._source.createdAt,
        lastLogin: hit._source.lastLogin,
        isActive: hit._source.isActive,
      }));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  async toggleUserStatus(userId: string, isActive: boolean): Promise<{ success: boolean; message: string }> {
    try {
      await this.esClient.update({
        index: USERS_INDEX,
        id: userId,
        doc: {
          isActive,
        },
      });

      await this.esClient.indices.refresh({ index: USERS_INDEX });
      return { success: true, message: `User ${isActive ? 'activated' : 'deactivated'} successfully` };
    } catch (error) {
      console.error('Error toggling user status:', error);
      return { success: false, message: 'Failed to update user status' };
    }
  }

  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.esClient.delete({
        index: USERS_INDEX,
        id: userId,
      });

      await this.esClient.indices.refresh({ index: USERS_INDEX });
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, message: 'Failed to delete user' };
    }
  }

  verifyToken(token: string): { valid: boolean; userId?: string; email?: string } {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string; email: string; role: string };
      return { valid: true, userId: decoded.userId, email: decoded.email };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Create a new user (admin only) and send welcome email with temporary password
   */
  async createUser(email: string, displayName: string, tempPassword: string): Promise<{ success: boolean; message: string; userId?: string }> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Invalid email format' };
    }

    // Check if user already exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      return { success: false, message: 'Email already registered' };
    }

    // Validate display name
    if (!displayName || displayName.trim().length < 2) {
      return { success: false, message: 'Display name must be at least 2 characters' };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    try {
      const result = await this.esClient.index({
        index: USERS_INDEX,
        document: {
          email: email.toLowerCase(),
          password: hashedPassword,
          displayName: displayName.trim(),
          createdAt: new Date().toISOString(),
          isActive: true,
        },
      });

      await this.esClient.indices.refresh({ index: USERS_INDEX });

      // Send welcome email with temporary password
      await emailService.sendAccountCreationEmail(email, tempPassword);

      return { 
        success: true, 
        message: 'User created successfully. Welcome email sent.', 
        userId: result._id 
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, message: 'Failed to create user' };
    }
  }

  /**
   * Generate password reset token and send email
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const user = await this.findByEmail(email.toLowerCase());
    
    if (!user) {
      // Return success even if user doesn't exist (security: don't reveal if email is registered)
      return { success: true, message: 'If the email exists, a password reset link has been sent.' };
    }

    if (!user.isActive) {
      return { success: false, message: 'Account is disabled. Please contact support.' };
    }

    // Generate reset token
    const { token, expires } = emailService.generateResetToken();

    try {
      // Save token to user
      await this.esClient.update({
        index: USERS_INDEX,
        id: user.id,
        doc: {
          resetToken: token,
          resetTokenExpiry: expires,
        },
      });

      await this.esClient.indices.refresh({ index: USERS_INDEX });

      // Send password reset email
      await emailService.sendPasswordResetEmail(user.email, token);

      return { success: true, message: 'Password reset email sent. Check your inbox.' };
    } catch (error) {
      console.error('Error requesting password reset:', error);
      return { success: false, message: 'Failed to send password reset email' };
    }
  }

  /**
   * Admin-triggered password reset (sends email with reset link)
   */
  async adminResetPassword(userId: string): Promise<{ success: boolean; message: string }> {
    const user = await this.findById(userId);
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Generate reset token
    const { token, expires } = emailService.generateResetToken();

    try {
      // Save token to user
      await this.esClient.update({
        index: USERS_INDEX,
        id: user.id,
        doc: {
          resetToken: token,
          resetTokenExpiry: expires,
        },
      });

      await this.esClient.indices.refresh({ index: USERS_INDEX });

      // Send password reset email
      await emailService.sendPasswordResetEmail(user.email, token);

      return { success: true, message: 'Password reset email sent to user.' };
    } catch (error) {
      console.error('Error sending password reset:', error);
      return { success: false, message: 'Failed to send password reset email' };
    }
  }

  /**
   * Verify reset token and update password
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    // Validate password strength
    if (newPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }

    try {
      // Find user by reset token
      const result = await this.esClient.search({
        index: USERS_INDEX,
        body: {
          query: {
            term: { resetToken: token },
          },
        },
      });

      if (result.hits.hits.length === 0) {
        return { success: false, message: 'Invalid or expired reset token' };
      }

      const hit = result.hits.hits[0];
      const user = {
        id: hit._id as string,
        ...(hit._source as Omit<User, 'id'>),
      };

      // Check if token has expired
      if (!user.resetTokenExpiry || user.resetTokenExpiry < Date.now()) {
        return { success: false, message: 'Reset token has expired. Please request a new one.' };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset token
      await this.esClient.update({
        index: USERS_INDEX,
        id: user.id,
        doc: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      await this.esClient.indices.refresh({ index: USERS_INDEX });

      return { success: true, message: 'Password reset successfully. You can now log in.' };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { success: false, message: 'Failed to reset password' };
    }
  }

  /**
   * Verify if a reset token is valid (without resetting password)
   */
  async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    try {
      const result = await this.esClient.search({
        index: USERS_INDEX,
        body: {
          query: {
            term: { resetToken: token },
          },
        },
      });

      if (result.hits.hits.length === 0) {
        return { valid: false };
      }

      const hit = result.hits.hits[0];
      const user = {
        id: hit._id as string,
        ...(hit._source as Omit<User, 'id'>),
      };

      // Check if token has expired
      if (!user.resetTokenExpiry || user.resetTokenExpiry < Date.now()) {
        return { valid: false };
      }

      return { valid: true, email: user.email };
    } catch (error) {
      console.error('Error verifying reset token:', error);
      return { valid: false };
    }
  }
}
