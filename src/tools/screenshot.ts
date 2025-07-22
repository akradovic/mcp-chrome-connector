/**
 * Screenshot tool for visual state capture with automatic file saving
 */

import { BrowserManager } from '../browser/manager.js';
import { Logger } from 'winston';
import * as fs from 'fs/promises';
import * as path from 'path';

export class ScreenshotTool {
  private screenshotDir: string;

  constructor(
    private browserManager: BrowserManager,
    private logger: Logger
  ) {
    // Create screenshots directory relative to project root
    this.screenshotDir = path.join(process.cwd(), 'screenshots');
    this.ensureScreenshotDir();
  }

  private async ensureScreenshotDir(): Promise<void> {
    try {
      await fs.access(this.screenshotDir);
    } catch {
      await fs.mkdir(this.screenshotDir, { recursive: true });
      this.logger.info(`Created screenshots directory: ${this.screenshotDir}`);
    }
  }

  private generateFilename(format: string = 'png'): string {
    const timestamp = new Date().toISOString()
      .replace(/:/g, '-')
      .replace(/\./g, '-')
      .replace(/T/g, '_')
      .slice(0, -5); // Remove milliseconds and 'Z'
    
    return `screenshot_${timestamp}.${format}`;
  }

  getSchema() {
    return {
      name: 'screenshot',
      description: 'Capture a screenshot of the current page or specific element and save to file',
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
          },
          filename: {
            type: 'string',
            description: 'Custom filename (without extension). If not provided, uses timestamp'
          }
        },
        required: []
      }
    };
  }

  async execute(args: any) {
    try {
      await this.ensureScreenshotDir();

      this.logger.info(`Executing screenshot capture`, { 
        sessionId: args.sessionId,
        selector: args.selector,
        fullPage: args.fullPage,
        waitCondition: args.waitCondition || 'networkidle',
        waitTimeout: args.waitTimeout || 5000,
        additionalDelay: args.additionalDelay || 1000
      });
      
      // Get screenshot data from browser manager
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

      if (!result.success) {
        this.logger.error('Screenshot capture failed:', result.error);
        return result;
      }

      // Generate filename
      const format = args.format || 'png';
      const filename = args.filename 
        ? `${args.filename}.${format}`
        : this.generateFilename(format);
      
      const filepath = path.join(this.screenshotDir, filename);

      // Save base64 data to file
      if (result.data) {
        try {
          // Convert base64 to buffer and save
          const buffer = Buffer.from(result.data, 'base64');
          await fs.writeFile(filepath, buffer);

          this.logger.info(`Screenshot saved successfully`, {
            filepath,
            format: result.metadata?.format,
            width: result.metadata?.width,
            height: result.metadata?.height,
            size: buffer.length
          });

          // Return just the essential info
          return {
            success: true,
            screenshot_path: filepath,
            filename,
            metadata: {
              format: result.metadata?.format || format,
              width: result.metadata?.width,
              height: result.metadata?.height,
              size: buffer.length,
              timestamp: new Date().toISOString()
            }
          };
        } catch (saveError) {
          this.logger.error('Failed to save screenshot:', saveError);
          return {
            success: false,
            error: `Failed to save screenshot: ${saveError instanceof Error ? saveError.message : String(saveError)}`
          };
        }
      } else {
        this.logger.error('No screenshot data received from browser');
        return {
          success: false,
          error: 'No screenshot data received from browser'
        };
      }

    } catch (error) {
      this.logger.error('Screenshot tool error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
