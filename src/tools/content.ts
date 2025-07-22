/**
 * Content extraction tool for getting page content
 */

import { BrowserManager } from '../browser/manager.js';
import { Logger } from 'winston';

export class ContentExtractionTool {
  constructor(
    private browserManager: BrowserManager,
    private logger: Logger
  ) {}

  getSchema() {
    return {
      name: 'extract_content',
      description: 'Extract content from the current page in various formats',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description: 'Browser session ID. If not provided, will use default session'
          },
          format: {
            type: 'string',
            enum: ['text', 'html', 'markdown'],
            description: 'Format for content extraction',
            default: 'text'
          },
          selector: {
            type: 'string',
            description: 'CSS selector for specific element to extract. If not provided, extracts from entire page'
          },
          removeScripts: {
            type: 'boolean',
            description: 'Remove script tags from HTML extraction',
            default: true
          },
          removeStyles: {
            type: 'boolean',
            description: 'Remove style tags from HTML extraction',
            default: false
          }
        },
        required: ['format']
      }
    };
  }

  async execute(args: any) {
    try {
      this.logger.info(`Executing content extraction`, { 
        sessionId: args.sessionId,
        format: args.format,
        selector: args.selector 
      });
      
      const result = await this.browserManager.extractContent(args.sessionId, {
        format: args.format,
        selector: args.selector,
        removeScripts: args.removeScripts !== false,
        removeStyles: args.removeStyles === true
      });

      if (result.success) {
        this.logger.info(`Content extracted successfully`, {
          format: args.format,
          length: result.metadata?.length,
          encoding: result.metadata?.encoding
        });
      } else {
        this.logger.error('Content extraction failed:', result.error);
      }

      return result;
    } catch (error) {
      this.logger.error('Content extraction tool error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
