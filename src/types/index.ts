/**
 * Core types for MCP Chrome Connector
 */

export interface BrowserConfig {
  headless?: boolean;
  viewport?: {
    width: number;
    height: number;
  };
  timeout?: number;
  userDataDir?: string;
  args?: string[];
}

export interface NavigationOptions {
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  timeout?: number;
  referer?: string;
}

export interface NavigationResult {
  success: boolean;
  url: string;
  title: string;
  statusCode?: number;
  error?: string;
}

export interface ScreenshotOptions {
  selector?: string;
  fullPage?: boolean;
  format?: 'png' | 'jpeg';
  quality?: number;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ScreenshotResult {
  success: boolean;
  data?: string; // base64 encoded image
  error?: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
  };
}

export interface ContentExtractionOptions {
  format: 'text' | 'html' | 'markdown';
  selector?: string;
  removeScripts?: boolean;
  removeStyles?: boolean;
}

export interface ContentResult {
  success: boolean;
  content?: string;
  error?: string;
  metadata?: {
    length: number;
    encoding: string;
  };
}

export interface ElementInteractionOptions {
  selector: string;
  action: 'click' | 'type' | 'select' | 'hover' | 'focus' | 'clear';
  value?: string;
  options?: {
    delay?: number;
    force?: boolean;
    timeout?: number;
  };
}

export interface InteractionResult {
  success: boolean;
  element?: {
    tagName: string;
    text: string;
    value?: string;
  };
  error?: string;
}

export interface ScriptExecutionOptions {
  script: string;
  args?: any[];
  awaitPromise?: boolean;
}

export interface ScriptResult {
  success: boolean;
  result?: any;
  error?: string;
  logs?: string[];
}

export interface SecurityConfig {
  allowedDomains?: string[];
  blockedDomains?: string[];
  maxExecutionTime?: number;
  maxMemoryUsage?: number;
  enableSandbox?: boolean;
}

export interface BrowserSession {
  id: string;
  context: any; // Playwright BrowserContext
  page: any; // Playwright Page
  createdAt: Date;
  lastActivity: Date;
  config: BrowserConfig;
}

export interface ConnectorConfig {
  browser: BrowserConfig;
  security: SecurityConfig;
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    file?: string;
  };
  server: {
    name: string;
    version: string;
  };
}
