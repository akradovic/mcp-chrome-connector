/**
 * Tool registry for managing all MCP tools
 */

import { BrowserManager } from '../browser/manager.js';
import { NavigationTool } from './navigation.js';
import { ScreenshotTool } from './screenshot.js';
import { ContentExtractionTool } from './content.js';
import { ElementInteractionTool } from './interaction.js';
import { ScriptExecutionTool } from './script.js';
import { Logger } from 'winston';

export interface Tool {
  getSchema(): any;
  execute(args: any): Promise<any>;
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private logger: Logger;

  constructor(browserManager: BrowserManager, logger: Logger) {
    this.logger = logger;
    this.initializeTools(browserManager);
  }

  private initializeTools(browserManager: BrowserManager) {
    // Register all available tools
    const tools = [
      new NavigationTool(browserManager, this.logger),
      new ScreenshotTool(browserManager, this.logger),
      new ContentExtractionTool(browserManager, this.logger),
      new ElementInteractionTool(browserManager, this.logger),
      new ScriptExecutionTool(browserManager, this.logger)
    ];

    for (const tool of tools) {
      const schema = tool.getSchema();
      this.tools.set(schema.name, tool);
      this.logger.debug(`Registered tool: ${schema.name}`);
    }
  }

  /**
   * Get all tool schemas for MCP server capabilities
   */
  getToolSchemas(): any[] {
    return Array.from(this.tools.values()).map(tool => tool.getSchema());
  }

  /**
   * Execute a tool by name
   */
  async executeTool(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool '${name}' not found`);
    }

    this.logger.info(`Executing tool: ${name}`);
    const startTime = Date.now();
    
    try {
      const result = await tool.execute(args);
      const duration = Date.now() - startTime;
      
      this.logger.info(`Tool execution completed`, {
        tool: name,
        duration: `${duration}ms`,
        success: result.success
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error(`Tool execution failed`, {
        tool: name,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }

  /**
   * Check if a tool exists
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get list of available tool names
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
}
