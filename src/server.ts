/**
 * Main MCP Chrome Connector Server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { createLogger, format, transports, Logger } from 'winston';
import { BrowserManager } from './browser/manager.js';
import { SecurityValidator, defaultSecurityConfig } from './security/validator.js';
import { ToolRegistry } from './tools/registry.js';
import { ConnectorConfig, BrowserConfig } from './types/index.js';
import * as dotenv from 'dotenv';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

export class MCPChromeConnector {
  private server!: Server;
  private browserManager!: BrowserManager;
  private security!: SecurityValidator;
  private toolRegistry!: ToolRegistry;
  private logger!: Logger;
  private config!: ConnectorConfig;

  constructor() {
    this.loadConfig();
    this.setupLogger();
    this.setupSecurity();
    this.setupBrowserManager();
    this.setupMCPServer();
    this.setupToolRegistry();
  }

  private loadConfig() {
    this.config = {
      browser: {
        headless: process.env.BROWSER_HEADLESS !== 'false',
        viewport: {
          width: parseInt(process.env.BROWSER_WIDTH || '1280'),
          height: parseInt(process.env.BROWSER_HEIGHT || '720')
        },
        timeout: parseInt(process.env.BROWSER_TIMEOUT || '30000'),
        userDataDir: process.env.BROWSER_USER_DATA_DIR,
        args: process.env.BROWSER_ARGS ? process.env.BROWSER_ARGS.split(',') : []
      },
      security: {
        ...defaultSecurityConfig,
        allowedDomains: process.env.ALLOWED_DOMAINS ? process.env.ALLOWED_DOMAINS.split(',') : [],
        blockedDomains: process.env.BLOCKED_DOMAINS ? 
          process.env.BLOCKED_DOMAINS.split(',') : defaultSecurityConfig.blockedDomains,
        maxExecutionTime: parseInt(process.env.MAX_EXECUTION_TIME || '30000'),
        maxMemoryUsage: parseInt(process.env.MAX_MEMORY_USAGE || '512'),
        enableSandbox: process.env.ENABLE_SANDBOX !== 'false'
      },
      logging: {
        level: (process.env.LOG_LEVEL as any) || 'info',
        file: process.env.LOG_FILE || './logs/mcp-chrome-connector.log'
      },
      server: {
        name: 'mcp-chrome-connector',
        version: '1.0.0'
      }
    };
  }

  private setupLogger() {
    // Ensure logs directory exists
    const logDir = path.dirname(this.config.logging.file!);
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    // For MCP stdio transport, we MUST NOT log to console as it interferes with JSON-RPC communication
    // All logging goes to files only
    const loggerTransports: any[] = [
      new transports.File({
        filename: this.config.logging.file,
        format: format.combine(
          format.timestamp(),
          format.errors({ stack: true }),
          format.json()
        ),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
      })
    ];

    // Only add console logging if we're not using stdio (for debugging)
    if (process.env.MCP_DEBUG === 'true') {
      loggerTransports.push(
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.timestamp(),
            format.printf(({ timestamp, level, message, ...meta }) => {
              return `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
            })
          )
        })
      );
    }

    this.logger = createLogger({
      level: this.config.logging.level,
      transports: loggerTransports,
      // Prevent uncaught exceptions from interfering with MCP
      exitOnError: false
    });
  }

  private setupSecurity() {
    this.security = new SecurityValidator(this.config.security);
  }

  private setupBrowserManager() {
    this.browserManager = new BrowserManager(
      this.config.browser,
      this.security,
      this.logger
    );
  }

  private setupMCPServer() {
    this.server = new Server(
      {
        name: this.config.server.name,
        version: this.config.server.version
      },
      {
        capabilities: {
          tools: {},
          prompts: {}
        }
      }
    );
  }

  private setupToolRegistry() {
    this.toolRegistry = new ToolRegistry(this.browserManager, this.logger);
    this.registerMCPHandlers();
  }

  private registerMCPHandlers() {
    // Register tool listing handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.info('Handling tools/list request');
      return {
        tools: this.toolRegistry.getToolSchemas()
      };
    });

    // Register tool execution handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      this.logger.info(`Handling tool execution: ${name}`, { args });
      
      try {
        const result = await this.toolRegistry.executeTool(name, args);
        this.logger.info(`Tool execution completed: ${name}`, { success: result.success });
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        this.logger.error(`Tool execution error for ${name}:`, { error: error instanceof Error ? error.message : String(error) });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    });

    // Register prompt listing handler
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      this.logger.info('Handling prompts/list request');
      return {
        prompts: [
          {
            name: 'browser_automation_help',
            description: 'Get help with browser automation using this MCP connector'
          },
          {
            name: 'security_guidelines',
            description: 'Security guidelines and best practices for browser automation'
          }
        ]
      };
    });

    // Register prompt retrieval handler
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name } = request.params;
      
      this.logger.info(`Handling prompt request: ${name}`);
      
      switch (name) {
        case 'browser_automation_help':
          return {
            messages: [{
              role: 'user',
              content: {
                type: 'text',
                text: this.getBrowserAutomationHelpPrompt()
              }
            }]
          };
          
        case 'security_guidelines':
          return {
            messages: [{
              role: 'user',
              content: {
                type: 'text',
                text: this.getSecurityGuidelinesPrompt()
              }
            }]
          };
          
        default:
          throw new Error(`Unknown prompt: ${name}`);
      }
    });
  }

  private getBrowserAutomationHelpPrompt(): string {
    return `# Browser Automation with MCP Chrome Connector

This MCP server provides powerful browser automation capabilities using Chrome/Chromium. Available tools:

## Navigation
- **navigate**: Navigate to URLs with wait conditions and security validation
- Parameters: url (required), sessionId (optional), waitCondition, timeout

## Visual Capture
- **screenshot**: Capture screenshots of pages or specific elements
- Parameters: sessionId, selector, fullPage, format (png/jpeg), quality, clip area

## Content Extraction
- **extract_content**: Extract page content as text, HTML, or markdown
- Parameters: sessionId, format (text/html/markdown), selector, removeScripts, removeStyles

## Element Interaction
- **interact_element**: Click, type, select, hover, focus, or clear elements
- Parameters: sessionId, selector (required), action (required), value, options

## Script Execution
- **execute_script**: Run JavaScript code in the browser context
- Parameters: sessionId, script (required), args, awaitPromise

## Session Management
- Each browser operation can specify a sessionId for persistent browser sessions
- If no sessionId is provided, operations use a default session
- Sessions maintain authentication state and browsing context

## Security Features
- URL validation against allowed/blocked domain lists
- Input sanitization for selectors and scripts
- Execution time and memory limits
- Sandbox mode for safe script execution

## Usage Tips
1. Start with navigation to establish a browser session
2. Use screenshots to visually understand page state
3. Extract content to analyze page information
4. Use element interaction for form filling and clicking
5. Execute scripts for complex page manipulation

Example workflow:
1. navigate → screenshot → extract_content → interact_element → screenshot`;
  }

  private getSecurityGuidelinesPrompt(): string {
    return `# Security Guidelines for Browser Automation

## Domain Security
- Configure ALLOWED_DOMAINS environment variable to restrict navigation
- Configure BLOCKED_DOMAINS to prevent access to dangerous sites
- Default blocks localhost, 127.0.0.1, file://, and ftp:// protocols

## Script Execution Security
- All JavaScript is validated for dangerous patterns
- Blocked functions: eval, Function constructor, setTimeout, setInterval
- Blocked DOM manipulation: innerHTML, outerHTML, document.write
- Blocked storage access: localStorage, sessionStorage, document.cookie

## Input Validation
- CSS selectors are validated for XSS prevention
- Text inputs are sanitized to prevent injection attacks
- URL validation prevents protocol-based attacks

## Resource Limits
- Execution timeout: ${this.config.security.maxExecutionTime}ms (configurable)
- Memory limit: ${this.config.security.maxMemoryUsage}MB (configurable)
- Sandbox mode: ${this.config.security.enableSandbox ? 'enabled' : 'disabled'}

## Environment Variables
- ALLOWED_DOMAINS: Comma-separated list of allowed domains
- BLOCKED_DOMAINS: Comma-separated list of blocked domains
- MAX_EXECUTION_TIME: Maximum script execution time (ms)
- MAX_MEMORY_USAGE: Maximum memory usage (MB)
- ENABLE_SANDBOX: Enable/disable sandbox mode (true/false)
- BROWSER_HEADLESS: Run browser in headless mode (true/false)

## Best Practices
1. Always validate URLs before navigation
2. Use specific CSS selectors to avoid unintended interactions
3. Prefer built-in tools over custom script execution
4. Monitor execution time and resource usage
5. Keep browser sessions clean and close when done
6. Log all automation activities for audit trails

## Error Handling
- All tools return structured error responses
- Failed operations include detailed error messages
- Security violations are logged and blocked
- Resource limit violations stop execution safely`;
  }

  async start() {
    try {
      this.logger.info('Starting MCP Chrome Connector...');
      
      // Initialize browser
      await this.browserManager.initialize();
      this.logger.info('Browser manager initialized successfully');
      
      // Start MCP server
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      this.logger.info('MCP Chrome Connector started successfully');
      
      // Handle graceful shutdown
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());
      
    } catch (error) {
      this.logger.error('Failed to start MCP Chrome Connector:', { error: error instanceof Error ? error.message : String(error) });
      process.exit(1);
    }
  }

  private async shutdown() {
    this.logger.info('Shutting down MCP Chrome Connector...');
    
    try {
      await this.browserManager.cleanup();
      this.logger.info('Shutdown completed successfully');
    } catch (error) {
      this.logger.error('Error during shutdown:', { error: error instanceof Error ? error.message : String(error) });
    }
    
    process.exit(0);
  }
}
