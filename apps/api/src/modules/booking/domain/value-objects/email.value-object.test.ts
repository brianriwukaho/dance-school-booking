import { describe, it, expect } from 'vitest';
import { Email } from './email.value-object.js';
import { ArgumentInvalidException } from '@repo/ddd';

describe('Email Value Object', () => {
  describe('valid emails', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.com',
        'user+tag@example.co.uk',
        'user_name@example.org',
        'user123@test-domain.com',
      ];

      validEmails.forEach((emailStr) => {
        expect(() => new Email(emailStr)).not.toThrow();
        const email = new Email(emailStr);
        expect(email.value).toBe(emailStr);
      });
    });
  });

  describe('invalid emails', () => {
    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        'user@',
        '@example.com',
        'user @example.com',
        'user@example',
        'user@@example.com',
        'user@.com',
      ];

      invalidEmails.forEach((emailStr) => {
        expect(() => new Email(emailStr)).toThrow(ArgumentInvalidException);
      });
    });

    it('should throw with descriptive error message', () => {
      expect(() => new Email('invalid')).toThrow('Invalid email format');
    });

    it('should reject empty email', () => {
      expect(() => new Email('')).toThrow();
    });
  });

  describe('equals', () => {
    it('should return true for identical emails', () => {
      const email1 = new Email('user@example.com');
      const email2 = new Email('user@example.com');

      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = new Email('user1@example.com');
      const email2 = new Email('user2@example.com');

      expect(email1.equals(email2)).toBe(false);
    });

    it('should be case-sensitive', () => {
      const email1 = new Email('User@Example.com');
      const email2 = new Email('user@example.com');

      // Email addresses are technically case-insensitive, but our implementation
      // treats them as case-sensitive for exact matching
      expect(email1.equals(email2)).toBe(false);
    });
  });
});
