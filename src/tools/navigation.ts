/**
 * Navigation tool for browser control
 */

import { BrowserManager } from '../browser/manager.js';
import { Logger } from 'winston';

export class NavigationTool {
  constructor(
    private browserManager: BrowserManager,
    private logger: Logger
  ) {}

  getSchema() {
    return {
      name: 'navigate',
      description: 'Navigate to a specific URL in the browser',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to navigate to'
          },
          sessionId: {
            type: 'string',
            description: 'Optional browser session ID. If not provided, a new session will be created'
          },
          waitCondition: {
            type: 'string',
            enum: ['load', 'domcontentloaded', 'networkidle'],
            description: 'Wait condition for page load completion',
            default: 'domcontentloaded'
          },
          timeout: {
            type: 'number',
            description: 'Navigation timeout in milliseconds',
            default: 30000
          }
        },
        required: ['url']
      }
    };
  }

  async execute(args: any) {
    try {
      this.logger.info(`Executing navigation to: ${args.url}`);
      
      const result = await this.browserManager.navigate(
        args.url,
        args.sessionId,
        {
          waitUntil: args.waitCondition || 'domcontentloaded',
          timeout: args.timeout || 30000
        }
      );

      this.logger.info(`Navigation result: ${result.success ? 'success' : 'failed'}`);
      return result;
    } catch (error) {
      this.logger.error('Navigation tool error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
