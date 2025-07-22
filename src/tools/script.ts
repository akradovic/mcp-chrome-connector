/**
 * Script execution tool for running JavaScript in the browser
 */

import { BrowserManager } from '../browser/manager.js';
import { Logger } from 'winston';

export class ScriptExecutionTool {
  constructor(
    private browserManager: BrowserManager,
    private logger: Logger
  ) {}

  getSchema() {
    return {
      name: 'execute_script',
      description: 'Execute JavaScript code in the browser page context',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description: 'Browser session ID. If not provided, will use default session'
          },
          script: {
            type: 'string',
            description: 'JavaScript code to execute'
          },
          args: {
            type: 'array',
            description: 'Arguments to pass to the script',
            items: {
              type: 'string'
            }
          },
          awaitPromise: {
            type: 'boolean',
            description: 'Whether to await the result if it returns a Promise',
            default: false
          }
        },
        required: ['script']
      }
    };
  }

  async execute(args: any) {
    try {
      this.logger.info(`Executing JavaScript script`, { 
        sessionId: args.sessionId,
        scriptLength: args.script?.length,
        argsCount: args.args?.length || 0
      });
      
      const result = await this.browserManager.executeScript(args.sessionId, {
        script: args.script,
        args: args.args || [],
        awaitPromise: args.awaitPromise || false
      });

      if (result.success) {
        this.logger.info(`Script execution completed successfully`, {
          resultType: typeof result.result
        });
      } else {
        this.logger.error('Script execution failed:', result.error);
      }

      return result;
    } catch (error) {
      this.logger.error('Script execution tool error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
