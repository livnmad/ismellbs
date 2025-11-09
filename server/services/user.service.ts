import { Client } from '@elastic/elasticsearch';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const USERS_INDEX = 'ismellbs-users';

export interface User {
  id: string;
  email: string;
  password: string;
  displayName: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
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
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

  constructor(esClient: Client) {
    this.esClient = esClient;
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
}
