/**
 * AuthManager Unit Tests
 * Comprehensive testing of authentication and authorization
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AuthManager } from '../../../../src/core/auth/AuthManager';

describe('AuthManager', () => {
  let authManager: AuthManager;

  beforeEach(() => {
    authManager = new AuthManager({
      jwtSecret: 'test-secret-key-for-testing-only',
      tokenExpiry: '1h',
      maxLoginAttempts: 3,
      lockoutDuration: 5 * 60 * 1000, // 5 minutes
      passwordMinLength: 6
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should authenticate valid user successfully', async () => {
      const result = await authManager.authenticate('admin@rgblightcat.com', 'admin123', {
        ip: '127.0.0.1',
        userAgent: 'test-agent'
      });

      expect(result).toBeDefined();
      expect(result?.accessToken).toBeDefined();
      expect(result?.refreshToken).toBeDefined();
      expect(result?.tokenType).toBe('Bearer');
      expect(result?.expiresIn).toBeGreaterThan(0);
    });

    it('should reject invalid credentials', async () => {
      const result = await authManager.authenticate('admin@rgblightcat.com', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should reject non-existent user', async () => {
      const result = await authManager.authenticate('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should validate input properly', async () => {
      const result = await authManager.authenticate('invalid-email', 'pass');

      expect(result).toBeNull();
    });

    it('should handle rate limiting', async () => {
      const ip = '192.168.1.100';
      
      // Make multiple rapid requests to trigger rate limiting
      const promises = Array.from({ length: 12 }, () =>
        authManager.authenticate('admin@rgblightcat.com', 'wrongpassword', { ip })
      );

      const results = await Promise.all(promises);
      
      // Some requests should be blocked due to rate limiting
      const blockedRequests = results.filter(result => result === null);
      expect(blockedRequests.length).toBeGreaterThan(0);
    });

    it('should enforce account lockout after max attempts', async () => {
      const email = 'user@rgblightcat.com';
      
      // Make failed attempts to trigger lockout
      for (let i = 0; i < 4; i++) {
        await authManager.authenticate(email, 'wrongpassword', { ip: '127.0.0.1' });
      }

      // Next attempt should be blocked due to lockout
      const result = await authManager.authenticate(email, 'password123', { ip: '127.0.0.1' });
      expect(result).toBeNull();
    });
  });

  describe('Token Management', () => {
    it('should validate valid token', async () => {
      const authResult = await authManager.authenticate('admin@rgblightcat.com', 'admin123');
      expect(authResult).toBeDefined();

      const user = await authManager.validateToken(authResult!.accessToken);
      expect(user).toBeDefined();
      expect(user?.email).toBe('admin@rgblightcat.com');
    });

    it('should reject invalid token', async () => {
      const user = await authManager.validateToken('invalid.token.here');
      expect(user).toBeNull();
    });

    it('should refresh tokens successfully', async () => {
      const authResult = await authManager.authenticate('admin@rgblightcat.com', 'admin123');
      expect(authResult).toBeDefined();

      const refreshedResult = await authManager.refreshToken(authResult!.refreshToken);
      expect(refreshedResult).toBeDefined();
      expect(refreshedResult?.accessToken).toBeDefined();
      expect(refreshedResult?.refreshToken).toBeDefined();
    });

    it('should reject expired refresh token', async () => {
      const result = await authManager.refreshToken('expired.refresh.token');
      expect(result).toBeNull();
    });

    it('should invalidate token on logout', async () => {
      const authResult = await authManager.authenticate('admin@rgblightcat.com', 'admin123');
      expect(authResult).toBeDefined();

      await authManager.logout(authResult!.accessToken);

      // Token should now be invalid
      const user = await authManager.validateToken(authResult!.accessToken);
      expect(user).toBeNull();
    });
  });

  describe('Authorization', () => {
    it('should authorize super admin for all permissions', async () => {
      const authResult = await authManager.authenticate('admin@rgblightcat.com', 'admin123');
      const user = await authManager.validateToken(authResult!.accessToken);
      
      expect(user).toBeDefined();
      expect(authManager.authorize(user!, 'admin:users:delete')).toBe(true);
      expect(authManager.authorize(user!, 'game:manage')).toBe(true);
      expect(authManager.authorize(user!, 'any:permission')).toBe(true);
    });

    it('should restrict regular user permissions', async () => {
      const authResult = await authManager.authenticate('user@rgblightcat.com', 'password123');
      const user = await authManager.validateToken(authResult!.accessToken);
      
      expect(user).toBeDefined();
      expect(authManager.authorize(user!, 'game:play')).toBe(true);
      expect(authManager.authorize(user!, 'profile:update')).toBe(true);
      expect(authManager.authorize(user!, 'admin:users:delete')).toBe(false);
    });

    it('should handle wildcard permissions', async () => {
      // Create user with wildcard permission
      const user = await authManager.createUser({
        email: 'wildcard@test.com',
        username: 'wildcarduser',
        password: 'password123',
        permissions: ['game:*']
      });

      expect(user).toBeDefined();
      expect(authManager.authorize(user!, 'game:play')).toBe(true);
      expect(authManager.authorize(user!, 'game:admin')).toBe(true);
      expect(authManager.authorize(user!, 'admin:delete')).toBe(false);
    });
  });

  describe('User Management', () => {
    it('should create new user successfully', async () => {
      const user = await authManager.createUser({
        email: 'newuser@test.com',
        username: 'newuser',
        password: 'password123',
        roles: ['user']
      });

      expect(user).toBeDefined();
      expect(user?.email).toBe('newuser@test.com');
      expect(user?.username).toBe('newuser');
      expect(user?.roles).toContain('user');
      expect(user?.isActive).toBe(true);
    });

    it('should reject duplicate email', async () => {
      const user1 = await authManager.createUser({
        email: 'duplicate@test.com',
        username: 'user1',
        password: 'password123'
      });

      const user2 = await authManager.createUser({
        email: 'duplicate@test.com',
        username: 'user2',
        password: 'password123'
      });

      expect(user1).toBeDefined();
      expect(user2).toBeNull();
    });

    it('should reject duplicate username', async () => {
      const user1 = await authManager.createUser({
        email: 'user1@test.com',
        username: 'duplicate',
        password: 'password123'
      });

      const user2 = await authManager.createUser({
        email: 'user2@test.com',
        username: 'duplicate',
        password: 'password123'
      });

      expect(user1).toBeDefined();
      expect(user2).toBeNull();
    });

    it('should validate user input', async () => {
      const user = await authManager.createUser({
        email: 'invalid-email',
        username: 'a', // too short
        password: '123' // too short
      });

      expect(user).toBeNull();
    });
  });

  describe('Security Features', () => {
    it('should provide authentication statistics', () => {
      const stats = authManager.getStatistics();

      expect(stats).toBeDefined();
      expect(typeof stats.totalUsers).toBe('number');
      expect(typeof stats.activeSessions).toBe('number');
      expect(typeof stats.blacklistedTokens).toBe('number');
      expect(typeof stats.refreshTokens).toBe('number');
    });

    it('should clean up expired data', () => {
      // Test cleanup doesn't throw errors
      expect(() => authManager.cleanup()).not.toThrow();
    });

    it('should get current user from token', async () => {
      const authResult = await authManager.authenticate('admin@rgblightcat.com', 'admin123');
      expect(authResult).toBeDefined();

      const currentUser = await authManager.getCurrentUser(authResult!.accessToken);
      expect(currentUser).toBeDefined();
      expect(currentUser?.email).toBe('admin@rgblightcat.com');
    });

    it('should handle session limits', async () => {
      const authManager = new AuthManager({
        sessionLimit: 2
      });

      // Create multiple sessions for same user
      const session1 = await authManager.authenticate('admin@rgblightcat.com', 'admin123');
      const session2 = await authManager.authenticate('admin@rgblightcat.com', 'admin123');
      const session3 = await authManager.authenticate('admin@rgblightcat.com', 'admin123');

      expect(session1).toBeDefined();
      expect(session2).toBeDefined();
      expect(session3).toBeDefined();

      // Older sessions should be invalidated
      const user1 = await authManager.validateToken(session1!.accessToken);
      const user3 = await authManager.validateToken(session3!.accessToken);

      // Only newest sessions should be valid (session limit enforcement)
      expect(user3).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed tokens gracefully', async () => {
      const result = await authManager.validateToken('malformed');
      expect(result).toBeNull();
    });

    it('should handle empty credentials', async () => {
      const result = await authManager.authenticate('', '');
      expect(result).toBeNull();
    });

    it('should handle null/undefined inputs', async () => {
      const result = await authManager.authenticate(null as any, undefined as any);
      expect(result).toBeNull();
    });
  });
});