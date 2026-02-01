import { ID, Models } from 'appwrite';
import { account } from './appwrite';

export interface AuthUser extends Models.User<Models.Preferences> {}

/**
 * Authentication Service for VisionCheck Kenya
 * Handles user registration, login, logout, and session management
 */
class AuthService {
  /**
   * Create a new user account with email and password
   */
  async createAccount(email: string, password: string, name: string): Promise<AuthUser> {
    try {
      const newAccount = await account.create(
        ID.unique(),
        email,
        password,
        name
      );
      
      // Automatically log in after creating account
      if (newAccount) {
        await this.login(email, password);
      }
      
      return newAccount;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  /**
   * Log in an existing user with email and password
   */
  async login(email: string, password: string): Promise<Models.Session> {
    try {
      const session = await account.createEmailPasswordSession(email, password);
      return session;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  /**
   * Get the currently logged-in user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const user = await account.get();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Log out the current user and delete the session
   */
  async logout(): Promise<void> {
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  /**
   * Get the current active session
   */
  async getSession(): Promise<Models.Session | null> {
    try {
      const session = await account.getSession('current');
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Send password recovery email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      // You'll need to configure the reset password URL in Appwrite dashboard
      const resetUrl = `${process.env.EXPO_PUBLIC_APP_URL}/reset-password`;
      await account.createRecovery(email, resetUrl);
    } catch (error) {
      console.error('Error sending password recovery:', error);
      throw error;
    }
  }

  /**
   * Complete password recovery with secret and new password
   */
  async confirmPasswordReset(
    userId: string,
    secret: string,
    password: string
  ): Promise<void> {
    try {
      await account.updateRecovery(userId, secret, password);
    } catch (error) {
      console.error('Error confirming password reset:', error);
      throw error;
    }
  }

  /**
   * Update user's name
   */
  async updateName(name: string): Promise<AuthUser> {
    try {
      const updatedUser = await account.updateName(name);
      return updatedUser;
    } catch (error) {
      console.error('Error updating name:', error);
      throw error;
    }
  }

  /**
   * Update user's email
   */
  async updateEmail(email: string, password: string): Promise<AuthUser> {
    try {
      const updatedUser = await account.updateEmail(email, password);
      return updatedUser;
    } catch (error) {
      console.error('Error updating email:', error);
      throw error;
    }
  }

  /**
   * Update user's password
   */
  async updatePassword(newPassword: string, oldPassword: string): Promise<AuthUser> {
    try {
      const updatedUser = await account.updatePassword(newPassword, oldPassword);
      return updatedUser;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  /**
   * Delete the current user account
   * Note: This requires account deletion to be enabled in Appwrite dashboard
   */
  async deleteAccount(): Promise<void> {
    try {
      // First delete all sessions, then the account will need to be deleted via Appwrite API
      await account.deleteSessions();
      // Note: Actual account deletion may require server-side implementation
      // due to Appwrite security restrictions
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create anonymous session (for guest users)
   */
  async createAnonymousSession(): Promise<Models.Session> {
    try {
      const session = await account.createAnonymousSession();
      return session;
    } catch (error) {
      console.error('Error creating anonymous session:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
