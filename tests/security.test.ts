/**
 * Basic tests for MCP Chrome Connector
 */

import { SecurityValidator, defaultSecurityConfig } from '../src/security/validator';

describe('SecurityValidator', () => {
  let validator: SecurityValidator;

  beforeEach(() => {
    validator = new SecurityValidator(defaultSecurityConfig);
  });

  describe('URL validation', () => {
    test('should accept valid HTTPS URLs', () => {
      const result = validator.validateUrl('https://example.com');
      expect(result.valid).toBe(true);
    });

    test('should accept valid HTTP URLs', () => {
      const result = validator.validateUrl('http://example.com');
      expect(result.valid).toBe(true);
    });

    test('should reject blocked domains', () => {
      const result = validator.validateUrl('http://localhost:3000');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('blocked');
    });

    test('should reject dangerous protocols', () => {
      const result = validator.validateUrl('javascript:alert("xss")');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    test('should reject malformed URLs', () => {
      const result = validator.validateUrl('not-a-url');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid URL format');
    });
  });

  describe('Selector validation', () => {
    test('should accept valid CSS selectors', () => {
      const result = validator.validateSelector('#my-id .class-name');
      expect(result.valid).toBe(true);
    });

    test('should accept complex selectors', () => {
      const result = validator.validateSelector('div[data-test="value"] > span:nth-child(2)');
      expect(result.valid).toBe(true);
    });

    test('should reject selectors with javascript', () => {
      const result = validator.validateSelector('div[onclick="javascript:alert()"]');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous');
    });

    test('should reject selectors with event handlers', () => {
      const result = validator.validateSelector('div[onload="malicious()"]');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous');
    });
  });

  describe('Script validation', () => {
    test('should accept safe scripts', () => {
      const result = validator.validateScript('return document.title;');
      expect(result.valid).toBe(true);
    });

    test('should reject scripts with eval', () => {
      const result = validator.validateScript('eval("malicious code")');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous');
    });

    test('should reject scripts with Function constructor', () => {
      const result = validator.validateScript('new Function("return 1")()');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous');
    });

    test('should reject scripts accessing localStorage', () => {
      const result = validator.validateScript('localStorage.getItem("data")');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous');
    });
  });

  describe('Input text validation', () => {
    test('should accept normal text input', () => {
      const result = validator.validateInputText('Hello, World!');
      expect(result.valid).toBe(true);
    });

    test('should accept empty string', () => {
      const result = validator.validateInputText('');
      expect(result.valid).toBe(true);
    });

    test('should reject very long input', () => {
      const longText = 'a'.repeat(10001);
      const result = validator.validateInputText(longText);
      expect(result.valid).toBe(false);
    });
  });

  describe('String sanitization', () => {
    test('should remove angle brackets', () => {
      const result = validator.sanitizeString('<script>alert("xss")</script>');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    test('should remove javascript protocol', () => {
      const result = validator.sanitizeString('javascript:alert("xss")');
      expect(result).not.toContain('javascript:');
    });

    test('should remove event handlers', () => {
      const result = validator.sanitizeString('onclick="malicious()"');
      expect(result).not.toContain('onclick=');
    });
  });

  describe('Limit checking', () => {
    test('should pass within execution time limit', () => {
      const result = validator.checkLimits('test', 1000);
      expect(result.valid).toBe(true);
    });

    test('should fail when exceeding execution time limit', () => {
      const result = validator.checkLimits('test', 50000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('time limit');
    });

    test('should pass within memory limit', () => {
      const result = validator.checkLimits('test', undefined, 100);
      expect(result.valid).toBe(true);
    });

    test('should fail when exceeding memory limit', () => {
      const result = validator.checkLimits('test', undefined, 1000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('memory limit');
    });
  });
});
