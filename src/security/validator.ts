/**
 * Security validation and protection module
 */

import Joi from 'joi';
import { SecurityConfig } from '../types/index.js';

export class SecurityValidator {
  private config: SecurityConfig;

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  /**
   * Validate URL against allowed/blocked domains
   */
  validateUrl(url: string): { valid: boolean; error?: string } {
    try {
      const urlObj = new URL(url);
      
      // Check blocked domains
      if (this.config.blockedDomains) {
        for (const blockedDomain of this.config.blockedDomains) {
          if (urlObj.hostname.includes(blockedDomain)) {
            return { valid: false, error: `Domain ${urlObj.hostname} is blocked` };
          }
        }
      }

      // Check allowed domains (if specified, only these are allowed)
      if (this.config.allowedDomains && this.config.allowedDomains.length > 0) {
        const isAllowed = this.config.allowedDomains.some(domain => 
          urlObj.hostname.includes(domain)
        );
        if (!isAllowed) {
          return { valid: false, error: `Domain ${urlObj.hostname} is not in allowed list` };
        }
      }

      // Check for dangerous protocols
      const allowedProtocols = ['http:', 'https:'];
      if (!allowedProtocols.includes(urlObj.protocol)) {
        return { valid: false, error: `Protocol ${urlObj.protocol} is not allowed` };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Invalid URL format: ${error}` };
    }
  }

  /**
   * Validate CSS selector to prevent XSS and injection attacks
   */
  validateSelector(selector: string): { valid: boolean; error?: string } {
    const selectorSchema = Joi.string()
      .max(1000)
      .pattern(/^[a-zA-Z0-9\s\-_\[\]='".:>#,\(\)]+$/)
      .required();

    const { error } = selectorSchema.validate(selector);
    if (error) {
      return { valid: false, error: `Invalid selector: ${error.message}` };
    }

    // Check for dangerous selector patterns
    const dangerousPatterns = [
      /javascript:/i,
      /expression\(/i,
      /script:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(selector)) {
        return { valid: false, error: 'Selector contains potentially dangerous content' };
      }
    }

    return { valid: true };
  }

  /**
   * Validate JavaScript code for execution
   */
  validateScript(script: string): { valid: boolean; error?: string } {
    const scriptSchema = Joi.string()
      .max(10000) // Limit script size
      .required();

    const { error } = scriptSchema.validate(script);
    if (error) {
      return { valid: false, error: `Invalid script: ${error.message}` };
    }

    // Check for dangerous script patterns
    const dangerousPatterns = [
      /eval\s*\(/i,
      /Function\s*\(/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i,
      /document\.write/i,
      /innerHTML\s*=/i,
      /outerHTML\s*=/i,
      /location\s*=/i,
      /window\s*\./i,
      /document\.cookie/i,
      /localStorage/i,
      /sessionStorage/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(script)) {
        return { valid: false, error: 'Script contains potentially dangerous operations' };
      }
    }

    return { valid: true };
  }

  /**
   * Validate input text for form interactions
   */
  validateInputText(text: string): { valid: boolean; error?: string } {
    const textSchema = Joi.string()
      .max(10000)
      .allow('')
      .required();

    const { error } = textSchema.validate(text);
    if (error) {
      return { valid: false, error: `Invalid input text: ${error.message}` };
    }

    return { valid: true };
  }

  /**
   * Sanitize string input to prevent injection attacks
   */
  sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Check if operation exceeds security limits
   */
  checkLimits(operation: string, duration?: number, memoryUsage?: number): { valid: boolean; error?: string } {
    if (duration && this.config.maxExecutionTime && duration > this.config.maxExecutionTime) {
      return { 
        valid: false, 
        error: `Operation ${operation} exceeded time limit of ${this.config.maxExecutionTime}ms` 
      };
    }

    if (memoryUsage && this.config.maxMemoryUsage && memoryUsage > this.config.maxMemoryUsage) {
      return { 
        valid: false, 
        error: `Operation ${operation} exceeded memory limit of ${this.config.maxMemoryUsage}MB` 
      };
    }

    return { valid: true };
  }
}

/**
 * Default security configuration
 */
export const defaultSecurityConfig: SecurityConfig = {
  allowedDomains: [], // Empty means all domains allowed (except blocked)
  blockedDomains: [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'file://',
    'ftp://'
  ],
  maxExecutionTime: 30000, // 30 seconds
  maxMemoryUsage: 512, // 512MB
  enableSandbox: true
};
