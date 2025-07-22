/**
 * Element interaction tool for page interactions
 */

import { BrowserManager } from '../browser/manager.js';
import { Logger } from 'winston';

export class ElementInteractionTool {
  constructor(
    private browserManager: BrowserManager,
    private logger: Logger
  ) {}

  getSchema() {
    return {
      name: 'interact_element',
      description: 'Interact with page elements (click, type, select, etc.)',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description: 'Browser session ID. If not provided, will use default session'
          },
          selector: {
            type: 'string',
            description: 'CSS selector for the element to interact with'
          },
          action: {
            type: 'string',
            enum: ['click', 'type', 'select', 'hover', 'focus', 'clear'],
            description: 'Action to perform on the element'
          },
          value: {
            type: 'string',
            description: 'Value for type or select actions'
          },
          options: {
            type: 'object',
            description: 'Additional options for the interaction',
            properties: {
              delay: {
                type: 'number',
                description: 'Delay between keystrokes for typing (ms)',
                default: 0
              },
              force: {
                type: 'boolean',
                description: 'Force the action even if element is not visible',
                default: false
              },
              timeout: {
                type: 'number',
                description: 'Timeout for waiting for element (ms)',
                default: 5000
              }
            }
          }
        },
        required: ['selector', 'action']
      }
    };
  }

  async execute(args: any) {
    try {
      this.logger.info(`Executing element interaction`, { 
        sessionId: args.sessionId,
        selector: args.selector,
        action: args.action,
        value: args.value ? '[REDACTED]' : undefined
      });
      
      const result = await this.browserManager.interactElement(args.sessionId, {
        selector: args.selector,
        action: args.action,
        value: args.value,
        options: args.options || {}
      });

      if (result.success) {
        this.logger.info(`Element interaction completed successfully`, {
          action: args.action,
          elementTag: result.element?.tagName
        });
      } else {
        this.logger.error('Element interaction failed:', result.error);
      }

      return result;
    } catch (error) {
      this.logger.error('Element interaction tool error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
