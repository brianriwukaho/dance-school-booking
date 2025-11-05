import { describe, it, expect } from 'vitest';
import { ClassType } from './class-type.value-object.js';
import { ArgumentInvalidException } from '@repo/ddd';

describe('ClassType Value Object', () => {
  describe('valid class types', () => {
    it('should accept salsa with levels 1-3', () => {
      const salsa1 = new ClassType('salsa', 1);
      const salsa2 = new ClassType('salsa', 2);
      const salsa3 = new ClassType('salsa', 3);

      expect(salsa1.type).toBe('salsa');
      expect(salsa1.level).toBe(1);
      expect(salsa2.level).toBe(2);
      expect(salsa3.level).toBe(3);
    });

    it('should accept bachata with levels 1-2', () => {
      const bachata1 = new ClassType('bachata', 1);
      const bachata2 = new ClassType('bachata', 2);

      expect(bachata1.type).toBe('bachata');
      expect(bachata1.level).toBe(1);
      expect(bachata2.level).toBe(2);
    });

    it('should accept reggaeton without a level', () => {
      const reggaeton = new ClassType('reggaeton');

      expect(reggaeton.type).toBe('reggaeton');
      expect(reggaeton.level).toBeUndefined();
    });
  });

  describe('invalid class types', () => {
    it('should reject invalid dance types', () => {
      expect(() => new ClassType('invalid' as any, 1)).toThrow(
        ArgumentInvalidException
      );
      expect(() => new ClassType('tango' as any, 1)).toThrow(
        ArgumentInvalidException
      );
    });

    it('should reject invalid salsa levels', () => {
      expect(() => new ClassType('salsa', 0)).toThrow(ArgumentInvalidException);
      expect(() => new ClassType('salsa', 4)).toThrow(ArgumentInvalidException);
      expect(() => new ClassType('salsa', -1)).toThrow(ArgumentInvalidException);
    });

    it('should reject invalid bachata levels', () => {
      expect(() => new ClassType('bachata', 0)).toThrow(ArgumentInvalidException);
      expect(() => new ClassType('bachata', 3)).toThrow(ArgumentInvalidException);
      expect(() => new ClassType('bachata', -1)).toThrow(ArgumentInvalidException);
    });

    it('should reject level for reggaeton', () => {
      expect(() => new ClassType('reggaeton', 1)).toThrow(ArgumentInvalidException);
      expect(() => new ClassType('reggaeton', 1)).toThrow(
        'Reggaeton does not have levels'
      );
    });
  });

  describe('equals', () => {
    it('should return true for identical class types', () => {
      const salsa1 = new ClassType('salsa', 2);
      const salsa2 = new ClassType('salsa', 2);

      expect(salsa1.equals(salsa2)).toBe(true);
    });

    it('should return false for different levels', () => {
      const salsa1 = new ClassType('salsa', 1);
      const salsa2 = new ClassType('salsa', 2);

      expect(salsa1.equals(salsa2)).toBe(false);
    });

    it('should return false for different types', () => {
      const salsa = new ClassType('salsa', 1);
      const bachata = new ClassType('bachata', 1);

      expect(salsa.equals(bachata)).toBe(false);
    });

    it('should return true for identical reggaeton classes', () => {
      const reggaeton1 = new ClassType('reggaeton');
      const reggaeton2 = new ClassType('reggaeton');

      expect(reggaeton1.equals(reggaeton2)).toBe(true);
    });
  });

  describe('business rules', () => {
    it('should enforce salsa level constraints (1-3)', () => {
      expect(() => new ClassType('salsa', 1)).not.toThrow();
      expect(() => new ClassType('salsa', 2)).not.toThrow();
      expect(() => new ClassType('salsa', 3)).not.toThrow();

      expect(() => new ClassType('salsa', 0)).toThrow();
      expect(() => new ClassType('salsa', 4)).toThrow();
    });

    it('should enforce bachata level constraints (1-2)', () => {
      expect(() => new ClassType('bachata', 1)).not.toThrow();
      expect(() => new ClassType('bachata', 2)).not.toThrow();

      expect(() => new ClassType('bachata', 0)).toThrow();
      expect(() => new ClassType('bachata', 3)).toThrow();
    });

    it('should enforce reggaeton no-level constraint', () => {
      expect(() => new ClassType('reggaeton')).not.toThrow();

      expect(() => new ClassType('reggaeton', 1)).toThrow();
    });
  });
});
