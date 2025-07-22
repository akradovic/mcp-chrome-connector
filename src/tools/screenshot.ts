/**
 * Screenshot tool for visual state capture
 */

import { BrowserManager } from '../browser/manager.js';
import { Logger } from 'winston';

export class ScreenshotTool {
  constructor(
    private browserManager: BrowserManager,
    private logger: Logger
  ) {}

  getSchema() {
    return {
      name: 'screenshot',
      description: 'Capture a screenshot of the current page or specific element',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description: 'Browser session ID. If not provided, will use default session'
          },
          selector: {
            type: 'string',
            description: 'CSS selector for specific element to screenshot. If not provided, captures full page'
          },
          fullPage: {
            type: 'boolean',
            description: 'Whether to capture the full scrollable page',
            default: false
          },
          format: {
            type: 'string',
            enum: ['png', 'jpeg'],
            description: 'Image format for the screenshot',
            default: 'png'
          },
          quality: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'JPEG quality (0-100). Only applies to JPEG format',
            default: 80
          },
          clip: {
            type: 'object',
            description: 'Clip area for screenshot',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
              width: { type: 'number' },
              height: { type: 'number' }
            },
            required: ['x', 'y', 'width', 'height']
          },
          waitCondition: {
            type: 'string',
            enum: ['load', 'domcontentloaded', 'networkidle'],
            description: 'Wait condition before taking screenshot',
            default: 'networkidle'
          },
          waitTimeout: {
            type: 'number',
            description: 'Timeout for waiting before screenshot (ms)',
            default: 5000
          },
          additionalDelay: {
            type: 'number',
            description: 'Additional delay after wait condition is met (ms)',
            default: 1000
          }
        },
        required: []
      }
    };
  }

  async execute(args: any) {
    try {
      this.logger.info(`Executing screenshot capture`, { 
        sessionId: args.sessionId,
        selector: args.selector,
        fullPage: args.fullPage,
        waitCondition: args.waitCondition || 'networkidle',
        waitTimeout: args.waitTimeout || 5000,
        additionalDelay: args.additionalDelay || 1000
      });
      
      const result = await this.browserManager.screenshot(args.sessionId, {
        selector: args.selector,
        fullPage: args.fullPage || false,
        format: args.format || 'png',
        quality: args.quality,
        clip: args.clip,
        waitCondition: args.waitCondition || 'networkidle',
        waitTimeout: args.waitTimeout || 5000,
        additionalDelay: args.additionalDelay || 1000
      });

      if (result.success) {
        this.logger.info(`Screenshot captured successfully`, {
          format: result.metadata?.format,
          width: result.metadata?.width,
          height: result.metadata?.height
        });
      } else {
        this.logger.error('Screenshot capture failed:', result.error);
      }

      return result;
    } catch (error) {
      this.logger.error('Screenshot tool error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
