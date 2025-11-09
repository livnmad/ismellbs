import { Client } from '@elastic/elasticsearch';
import bcrypt from 'bcrypt';

const ADMIN_USERS_INDEX = 'admin-users';

export interface AdminUser {
  id: string;
  username: string;
  password: string;
  createdAt: string;
  createdBy?: string;
}

export class AdminUserService {
  private esClient: Client;

  constructor(esClient: Client) {
    this.esClient = esClient;
  }

  async initializeIndex(): Promise<void> {
    const indexExists = await this.esClient.indices.exists({
      index: ADMIN_USERS_INDEX,
    });

    if (!indexExists) {
      await this.esClient.indices.create({
        index: ADMIN_USERS_INDEX,
        body: {
          mappings: {
            properties: {
              username: { type: 'keyword' },
              password: { type: 'text' },
              createdAt: { type: 'date' },
              createdBy: { type: 'keyword' },
            },
          },
        },
      });

      // Create default admin account
      const hashedPassword = await bcrypt.hash('admin', 10);
      await this.esClient.index({
        index: ADMIN_USERS_INDEX,
        document: {
          username: 'admin',
          password: hashedPassword,
          createdAt: new Date().toISOString(),
          createdBy: 'system',
        },
      });

      await this.esClient.indices.refresh({ index: ADMIN_USERS_INDEX });
    }
  }

  async createAdmin(username: string, password: string, createdBy: string): Promise<{ success: boolean; message: string }> {
    // Check if username already exists
    const existingUser = await this.findByUsername(username);
    if (existingUser) {
      return { success: false, message: 'Username already exists' };
    }

    // Validate password strength
    if (password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }

    // Hash password and create admin
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.esClient.index({
      index: ADMIN_USERS_INDEX,
      document: {
        username,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        createdBy,
      },
    });

    await this.esClient.indices.refresh({ index: ADMIN_USERS_INDEX });
    return { success: true, message: 'Admin created successfully' };
  }

  async changePassword(username: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    // Find user
    const user = await this.findByUsername(username);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Verify old password
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return { success: false, message: 'Current password is incorrect' };
    }

    // Validate new password
    if (newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters' };
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.esClient.update({
      index: ADMIN_USERS_INDEX,
      id: user.id,
      doc: {
        password: hashedPassword,
      },
    });

    await this.esClient.indices.refresh({ index: ADMIN_USERS_INDEX });
    return { success: true, message: 'Password changed successfully' };
  }

  async findByUsername(username: string): Promise<AdminUser | null> {
    try {
      const result = await this.esClient.search({
        index: ADMIN_USERS_INDEX,
        body: {
          query: {
            term: { username },
          },
        },
      });

      if (result.hits.hits.length === 0) {
        return null;
      }

      const hit = result.hits.hits[0];
      return {
        id: hit._id as string,
        ...(hit._source as Omit<AdminUser, 'id'>),
      };
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  }

  async getAllAdmins(): Promise<Array<{ username: string; createdAt: string; createdBy?: string }>> {
    try {
      const result = await this.esClient.search({
        index: ADMIN_USERS_INDEX,
        body: {
          query: { match_all: {} },
          sort: [{ createdAt: 'desc' }],
        },
      });

      return result.hits.hits.map((hit: any) => ({
        username: hit._source.username,
        createdAt: hit._source.createdAt,
        createdBy: hit._source.createdBy,
      }));
    } catch (error) {
      console.error('Error getting admins:', error);
      return [];
    }
  }

  async deleteAdmin(username: string, requestingUser: string): Promise<{ success: boolean; message: string }> {
    // Prevent deleting yourself
    if (username === requestingUser) {
      return { success: false, message: 'Cannot delete your own account' };
    }

    // Prevent deleting the default admin
    if (username === 'admin') {
      return { success: false, message: 'Cannot delete the default admin account' };
    }

    const user = await this.findByUsername(username);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    await this.esClient.delete({
      index: ADMIN_USERS_INDEX,
      id: user.id,
    });

    await this.esClient.indices.refresh({ index: ADMIN_USERS_INDEX });
    return { success: true, message: 'Admin deleted successfully' };
  }
}
