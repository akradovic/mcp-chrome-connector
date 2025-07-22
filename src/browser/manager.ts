/**
 * Browser Manager for Chrome automation using Playwright
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { BrowserConfig, BrowserSession } from '../types/index.js';
import { SecurityValidator } from '../security/validator.js';
import { Logger } from 'winston';

export class BrowserManager {
  private browser: Browser | null = null;
  private sessions: Map<string, BrowserSession> = new Map();
  private config: BrowserConfig;
  private security: SecurityValidator;
  private logger: Logger;

  constructor(config: BrowserConfig, security: SecurityValidator, logger: Logger) {
    this.config = config;
    this.security = security;
    this.logger = logger;
  }

  /**
   * Initialize browser instance
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Chrome browser...');
      
      const launchOptions = {
        headless: this.config.headless ?? false, // Set to false for debugging
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          // Removed problematic arguments that might prevent content loading
          '--disable-blink-features=AutomationControlled',
          '--no-first-run',
          '--disable-default-apps',
          // Keep essential user agent
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          ...(this.config.args || [])
        ]
      };

      this.browser = await chromium.launch(launchOptions);
      this.logger.info('Chrome browser initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize browser:', error);
      throw new Error(`Browser initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a new browser session
   */
  async createSession(sessionId?: string): Promise<string> {
    if (!this.browser) {
      await this.initialize();
    }

    const id = sessionId || this.generateSessionId();
    
    try {
      const context = await this.browser!.newContext({
        viewport: this.config.viewport || { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        // Advanced human-like properties
        locale: 'en-US',
        timezoneId: 'America/New_York',
        permissions: ['geolocation', 'notifications'],
        // Simulate real browser with JavaScript enabled
        javaScriptEnabled: true,
        // Accept all cookies to avoid issues with WordPress sites
        acceptDownloads: true,
        // Set realistic screen size
        screen: { width: 1920, height: 1080 },
        // WordPress-friendly headers that mimic real browsers
        extraHTTPHeaders: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0',
          'sec-ch-ua': '"Chromium";v="120", "Google Chrome";v="120", "Not-A.Brand";v="99"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1'
        }
      });

      const page = await context.newPage();

      // Initialize stealth mode to avoid detection
      await this.initializeStealthMode(page);

      // Set up error handling - using pageerror event instead of error
      page.on('pageerror', (error: Error) => {
        this.logger.error(`Page error in session ${id}:`, error);
      });

      page.on('console', (msg) => {
        this.logger.debug(`Console ${msg.type()} in session ${id}: ${msg.text()}`);
      });

      const session: BrowserSession = {
        id,
        context,
        page,
        createdAt: new Date(),
        lastActivity: new Date(),
        config: this.config
      };

      this.sessions.set(id, session);
      this.logger.info(`Created browser session: ${id}`);
      
      return id;
    } catch (error) {
      this.logger.error(`Failed to create session ${id}:`, error);
      throw new Error(`Session creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get existing session or create new one
   */
  async getSession(sessionId?: string): Promise<BrowserSession> {
    if (sessionId && this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      session.lastActivity = new Date();
      return session;
    }

    const newSessionId = await this.createSession(sessionId);
    return this.sessions.get(newSessionId)!;
  }

  /**
   * Navigate to URL with security validation and human-like behavior
   */
  async navigate(url: string, sessionId?: string, options: any = {}): Promise<any> {
    // Validate URL
    const urlValidation = this.security.validateUrl(url);
    if (!urlValidation.valid) {
      throw new Error(urlValidation.error);
    }

    const session = await this.getSession(sessionId);
    
    try {
      this.logger.info(`Starting human-like navigation to ${url}`);
      
      // Human-like browsing: Visit homepage first if going to a sub-page
      if (url.includes('/products/') && !url.endsWith('/')) {
        const baseUrl = new URL(url).origin;
        this.logger.info(`First visiting homepage: ${baseUrl}`);
        
        await session.page.goto(baseUrl, {
          waitUntil: 'domcontentloaded',
          timeout: options.timeout || this.config.timeout || 30000
        });
        
        // Human-like delay between navigation
        await this.humanDelay(800, 1500);
      }
      
      this.logger.info(`Navigating to target URL: ${url}`);
      
      const response = await session.page.goto(url, {
        waitUntil: options.waitUntil || 'domcontentloaded',
        timeout: options.timeout || this.config.timeout || 30000
      });

      const title = await session.page.title();
      
      return {
        success: true,
        url: session.page.url(),
        title,
        statusCode: response?.status()
      };
    } catch (error) {
      this.logger.error(`Navigation failed for ${url}:`, error);
      return {
        success: false,
        url,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Take screenshot
   */
  async screenshot(sessionId?: string, options: any = {}): Promise<any> {
    const session = await this.getSession(sessionId);
    
    try {
      // Wait for the specified condition before taking screenshot
      if (options.waitCondition) {
        this.logger.info(`Waiting for ${options.waitCondition} before screenshot...`);
        try {
          await session.page.waitForLoadState(options.waitCondition, {
            timeout: options.waitTimeout || 5000
          });
        } catch (waitError) {
          this.logger.warn(`Wait condition '${options.waitCondition}' timeout, proceeding with screenshot`);
        }
      }

      // WordPress-specific waiting: Wait for specific content to be present
      if (session.page.url().includes('/products/')) {
        this.logger.info('Detected WordPress products page, waiting for content...');
        
        // Simulate human-like mouse movement
        await this.simulateHumanBehavior(session.page);
        
        try {
          // Wait for either product cards to be present OR no-products message
          await Promise.race([
            session.page.waitForSelector('.product-card', { timeout: 10000 }),
            session.page.waitForSelector('.no-products', { timeout: 10000 }),
            session.page.waitForSelector('.products-grid', { timeout: 10000 })
          ]);
          this.logger.info('WordPress products content detected');
          
          // Additional wait for WordPress to finish any AJAX calls
          await this.waitForWordPressReady(session.page);
          
        } catch (contentError) {
          this.logger.warn('WordPress content wait timeout, proceeding with screenshot');
        }
      }

      // Additional delay to ensure everything is rendered
      if (options.additionalDelay && options.additionalDelay > 0) {
        this.logger.info(`Additional delay of ${options.additionalDelay}ms before screenshot...`);
        await new Promise(resolve => setTimeout(resolve, options.additionalDelay));
      }
      let screenshotOptions: any = {
        type: options.format || 'png',
        fullPage: options.fullPage || false
      };

      if (options.quality && options.format === 'jpeg') {
        screenshotOptions.quality = options.quality;
      }

      if (options.clip) {
        screenshotOptions.clip = options.clip;
      }

      let element = session.page;
      if (options.selector) {
        const selectorValidation = this.security.validateSelector(options.selector);
        if (!selectorValidation.valid) {
          throw new Error(selectorValidation.error);
        }
        element = await session.page.locator(options.selector);
      }

      const buffer = await element.screenshot(screenshotOptions);
      const base64 = buffer.toString('base64');

      return {
        success: true,
        data: base64,
        metadata: {
          width: screenshotOptions.clip?.width || session.config.viewport?.width || 1280,
          height: screenshotOptions.clip?.height || session.config.viewport?.height || 720,
          format: options.format || 'png'
        }
      };
    } catch (error) {
      this.logger.error(`Screenshot failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Extract page content with improved timing and debugging
   */
  async extractContent(sessionId?: string, options: any = {}): Promise<any> {
    const session = await this.getSession(sessionId);
    
    try {
      this.logger.info(`Starting content extraction for ${session.page.url()}`);
      
      // Enhanced waiting strategy - wait for page to be fully loaded
      await this.waitForPageReady(session.page);
      
      let content: string;
      
      if (options.selector) {
        const selectorValidation = this.security.validateSelector(options.selector);
        if (!selectorValidation.valid) {
          throw new Error(selectorValidation.error);
        }
        
        this.logger.info(`Extracting content from selector: ${options.selector}`);
        const element = session.page.locator(options.selector);
        
        // Wait for the specific element to be present
        await element.waitFor({ timeout: 10000 }).catch(() => {
          this.logger.warn(`Selector ${options.selector} not found, proceeding anyway`);
        });
        
        switch (options.format) {
          case 'text':
            content = await element.textContent() || '';
            break;
          case 'html':
            content = await element.innerHTML();
            break;
          default:
            content = await element.textContent() || '';
        }
      } else {
        this.logger.info(`Extracting full page content in ${options.format || 'text'} format`);
        
        switch (options.format) {
          case 'text':
            // Try multiple methods to get text content
            content = await this.extractTextContent(session.page);
            break;
          case 'html':
            // Enhanced HTML extraction with retries
            content = await this.extractHtmlContent(session.page);
            break;
          case 'markdown':
            // Get HTML first, then convert to markdown
            const htmlContent = await this.extractHtmlContent(session.page);
            content = this.htmlToMarkdown(htmlContent);
            break;
          default:
            content = await this.extractTextContent(session.page);
        }
      }

      this.logger.info(`Content extraction completed. Length: ${content.length} characters`);
      
      if (content.length === 0) {
        this.logger.warn('Content extraction returned empty result - debugging page state');
        await this.debugPageState(session.page);
      }

      return {
        success: true,
        content,
        metadata: {
          length: content.length,
          encoding: 'utf-8',
          url: session.page.url(),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error(`Content extraction failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Interact with page elements
   */
  async interactElement(sessionId: string | undefined, options: any): Promise<any> {
    const selectorValidation = this.security.validateSelector(options.selector);
    if (!selectorValidation.valid) {
      throw new Error(selectorValidation.error);
    }

    const session = await this.getSession(sessionId);
    
    try {
      const element = session.page.locator(options.selector);
      
      // Wait for element to be available
      await element.waitFor({ timeout: options.options?.timeout || 5000 });

      switch (options.action) {
        case 'click':
          await element.click({ 
            force: options.options?.force,
            timeout: options.options?.timeout 
          });
          break;
          
        case 'type':
          if (options.value) {
            const textValidation = this.security.validateInputText(options.value);
            if (!textValidation.valid) {
              throw new Error(textValidation.error);
            }
            await element.fill(options.value);
          }
          break;
          
        case 'select':
          if (options.value) {
            await element.selectOption(options.value);
          }
          break;
          
        case 'hover':
          await element.hover();
          break;
          
        case 'focus':
          await element.focus();
          break;
          
        case 'clear':
          await element.clear();
          break;
          
        default:
          throw new Error(`Unsupported action: ${options.action}`);
      }

      const elementInfo = {
        tagName: await element.evaluate((el: Element) => el.tagName),
        text: await element.textContent() || '',
        value: await element.inputValue().catch(() => undefined)
      };

      return {
        success: true,
        element: elementInfo
      };
    } catch (error) {
      this.logger.error(`Element interaction failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Execute JavaScript code
   */
  async executeScript(sessionId: string | undefined, options: any): Promise<any> {
    const scriptValidation = this.security.validateScript(options.script);
    if (!scriptValidation.valid) {
      throw new Error(scriptValidation.error);
    }

    const session = await this.getSession(sessionId);
    
    try {
      const result = await session.page.evaluate(
        (script: string, args: any[]) => {
          // Create a safe evaluation context
          const func = new Function('args', script);
          return func(args);
        },
        options.script,
        options.args || []
      );

      return {
        success: true,
        result
      };
    } catch (error) {
      this.logger.error(`Script execution failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Close session
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.context.close();
      this.sessions.delete(sessionId);
      this.logger.info(`Closed session: ${sessionId}`);
    }
  }

  /**
   * Clean up all sessions and browser
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up browser sessions...');
    
    for (const [sessionId, session] of this.sessions) {
      await session.context.close();
    }
    this.sessions.clear();

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    
    this.logger.info('Browser cleanup completed');
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Simulate human-like behavior on the page
   */
  private async simulateHumanBehavior(page: any): Promise<void> {
    try {
      this.logger.info('Simulating human-like behavior...');
      
      // Random mouse movements
      for (let i = 0; i < 3; i++) {
        const x = Math.floor(Math.random() * 800) + 100;
        const y = Math.floor(Math.random() * 600) + 100;
        await page.mouse.move(x, y);
        await this.humanDelay(200, 500);
      }
      
      // Random scroll simulation
      const scrollDistance = Math.floor(Math.random() * 300) + 100;
      await page.evaluate((distance) => {
        window.scrollBy(0, distance);
      }, scrollDistance);
      
      await this.humanDelay(500, 1000);
      
      // Scroll back to top
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      
      await this.humanDelay(300, 700);
      
      this.logger.info('Human behavior simulation completed');
    } catch (error) {
      this.logger.warn('Error simulating human behavior:', error);
    }
  }

  /**
   * Human-like delay with random variation
   */
  private async humanDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    this.logger.info(`Human delay: ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Initialize stealth mode to avoid bot detection
   */
  private async initializeStealthMode(page: any): Promise<void> {
    try {
      this.logger.info('Initializing stealth mode...');
      
      // Override automation detection mechanisms
      await page.evaluateOnNewDocument(() => {
        // Remove webdriver property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        // Override the plugins property to mimic a real browser
        Object.defineProperty(navigator, 'plugins', {
          get: () => [
            {
              0: {
                type: "application/x-google-chrome-pdf",
                suffixes: "pdf",
                description: "Portable Document Format",
                enabledPlugin: true
              },
              description: "Portable Document Format",
              filename: "internal-pdf-viewer",
              length: 1,
              name: "Chrome PDF Plugin"
            },
            {
              0: {
                type: "application/pdf",
                suffixes: "pdf", 
                description: "Portable Document Format",
                enabledPlugin: true
              },
              description: "Portable Document Format",
              filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
              length: 1,
              name: "Chrome PDF Viewer"
            }
          ],
        });
        
        // Override languages to seem more human
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
        
        // Mock a realistic hardware concurrency
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => 8,
        });
        
        // Mock realistic device memory
        Object.defineProperty(navigator, 'deviceMemory', {
          get: () => 8,
        });
        
        // Remove automation traces from window.chrome
        if (window.chrome) {
          delete (window as any).chrome.runtime;
        }
        
        // Override permission query
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters: any) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
        
        // Mock WebGL renderer info
        const getParameter = WebGLRenderingContext.getParameter;
        WebGLRenderingContext.prototype.getParameter = function(parameter) {
          if (parameter === 37445) {
            return 'Intel Inc.';
          }
          if (parameter === 37446) {
            return 'Intel(R) Iris(R) Plus Graphics 655';
          }
          return getParameter(parameter);
        };
        
        // Mock realistic screen properties
        Object.defineProperty(screen, 'availWidth', { get: () => 1920 });
        Object.defineProperty(screen, 'availHeight', { get: () => 1040 });
        Object.defineProperty(screen, 'colorDepth', { get: () => 24 });
        Object.defineProperty(screen, 'pixelDepth', { get: () => 24 });
        
        // Mock realistic timing
        const originalNow = performance.now;
        performance.now = function() {
          return originalNow.call(performance) + Math.random();
        };
      });
      
      this.logger.info('Stealth mode initialized successfully');
    } catch (error) {
      this.logger.warn('Error initializing stealth mode:', error);
    }
  }

  /**
   * Enhanced page ready detection with multiple strategies
   */
  private async waitForPageReady(page: any): Promise<void> {
    try {
      this.logger.info('Waiting for page to be fully ready...');
      
      // Strategy 1: Wait for network to be mostly idle
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
        this.logger.warn('Network idle timeout, continuing...');
      });
      
      // Strategy 2: Wait for DOM to be fully loaded
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {
        this.logger.warn('DOM content loaded timeout, continuing...');
      });
      
      // Strategy 3: Wait for basic HTML structure
      await page.waitForSelector('body', { timeout: 10000 }).catch(() => {
        this.logger.warn('Body element not found, continuing...');
      });
      
      // Strategy 4: Additional delay for dynamic content
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.logger.info('Page ready detection completed');
    } catch (error) {
      this.logger.warn('Error in page ready detection:', error);
    }
  }

  /**
   * Extract text content using multiple strategies
   */
  private async extractTextContent(page: any): Promise<string> {
    try {
      // Try multiple approaches to get text content
      let content = '';
      
      // Method 1: Get text from body
      try {
        content = await page.textContent('body') || '';
        if (content.trim().length > 0) {
          this.logger.info(`Text extracted via body selector: ${content.length} chars`);
          return content;
        }
      } catch (error) {
        this.logger.warn('Body text extraction failed:', error);
      }
      
      // Method 2: Use evaluate to get innerText
      try {
        content = await page.evaluate(() => {
          return document.body ? document.body.innerText : '';
        }) || '';
        if (content.trim().length > 0) {
          this.logger.info(`Text extracted via innerText: ${content.length} chars`);
          return content;
        }
      } catch (error) {
        this.logger.warn('InnerText extraction failed:', error);
      }
      
      // Method 3: Use evaluate to get textContent
      try {
        content = await page.evaluate(() => {
          return document.body ? document.body.textContent : '';
        }) || '';
        if (content.trim().length > 0) {
          this.logger.info(`Text extracted via textContent: ${content.length} chars`);
          return content;
        }
      } catch (error) {
        this.logger.warn('TextContent extraction failed:', error);
      }
      
      this.logger.warn('All text extraction methods returned empty content');
      return '';
    } catch (error) {
      this.logger.error('Text content extraction error:', error);
      return '';
    }
  }

  /**
   * Extract HTML content using multiple strategies with retries
   */
  private async extractHtmlContent(page: any): Promise<string> {
    try {
      let content = '';
      
      // Method 1: Standard page.content()
      try {
        content = await page.content() || '';
        if (content.length > 100) { // Basic sanity check
          this.logger.info(`HTML extracted via page.content(): ${content.length} chars`);
          return content;
        }
      } catch (error) {
        this.logger.warn('Standard content extraction failed:', error);
      }
      
      // Method 2: Get outerHTML via evaluate
      try {
        content = await page.evaluate(() => {
          return document.documentElement ? document.documentElement.outerHTML : '';
        }) || '';
        if (content.length > 100) {
          this.logger.info(`HTML extracted via outerHTML: ${content.length} chars`);
          return content;
        }
      } catch (error) {
        this.logger.warn('OuterHTML extraction failed:', error);
      }
      
      // Method 3: Get innerHTML of body
      try {
        content = await page.evaluate(() => {
          if (document.body) {
            return `<html><head>${document.head ? document.head.innerHTML : ''}</head><body>${document.body.innerHTML}</body></html>`;
          }
          return '';
        }) || '';
        if (content.length > 100) {
          this.logger.info(`HTML extracted via body innerHTML: ${content.length} chars`);
          return content;
        }
      } catch (error) {
        this.logger.warn('Body innerHTML extraction failed:', error);
      }
      
      this.logger.warn('All HTML extraction methods returned minimal content');
      return content; // Return whatever we got, even if it's minimal
    } catch (error) {
      this.logger.error('HTML content extraction error:', error);
      return '<html><head></head><body></body></html>';
    }
  }

  /**
   * Debug page state when content extraction fails
   */
  private async debugPageState(page: any): Promise<void> {
    try {
      this.logger.info('=== DEBUG: Analyzing page state ===');
      
      // Check basic page properties
      const url = page.url();
      const title = await page.title().catch(() => 'Unable to get title');
      
      this.logger.info(`URL: ${url}`);
      this.logger.info(`Title: ${title}`);
      
      // Check if page is still loading
      const readyState = await page.evaluate(() => document.readyState).catch(() => 'unknown');
      this.logger.info(`Document ready state: ${readyState}`);
      
      // Check for basic HTML elements
      const hasHtml = await page.locator('html').count() > 0;
      const hasHead = await page.locator('head').count() > 0;
      const hasBody = await page.locator('body').count() > 0;
      
      this.logger.info(`HTML elements - html: ${hasHtml}, head: ${hasHead}, body: ${hasBody}`);
      
      // Check body content length via different methods
      const bodyTextLength = await page.locator('body').textContent().then(text => text?.length || 0).catch(() => 0);
      const bodyHtmlLength = await page.locator('body').innerHTML().then(html => html?.length || 0).catch(() => 0);
      
      this.logger.info(`Body content - text length: ${bodyTextLength}, html length: ${bodyHtmlLength}`);
      
      // Check for any error messages in console
      const errors = await page.evaluate(() => {
        // Check for any visible error messages
        const errorElements = document.querySelectorAll('*[class*="error"], *[id*="error"]');
        return Array.from(errorElements).map(el => el.textContent).filter(text => text && text.trim().length > 0);
      }).catch(() => []);
      
      if (errors.length > 0) {
        this.logger.warn(`Page errors found: ${JSON.stringify(errors)}`);
      }
      
      this.logger.info('=== END DEBUG ===');
    } catch (error) {
      this.logger.error('Debug page state failed:', error);
    }
  }

  /**
   * Wait for WordPress to be fully ready (AJAX calls complete, etc.)
   */
  private async waitForWordPressReady(page: any): Promise<void> {
    try {
      this.logger.info('Waiting for WordPress to be fully ready...');
      
      // Wait for jQuery to be available and AJAX calls to complete
      await page.evaluate(() => {
        return new Promise((resolve) => {
          // Check if jQuery is available (cast to any to avoid TypeScript errors)
          const jq = (window as any).jQuery;
          if (typeof jq !== 'undefined') {
            // Wait for jQuery AJAX calls to complete
            const checkAjax = () => {
              if (jq.active === 0) {
                resolve(true);
              } else {
                setTimeout(checkAjax, 100);
              }
            };
            checkAjax();
          } else {
            // If no jQuery, just wait a bit for any vanilla JS to complete
            setTimeout(() => resolve(true), 1000);
          }
        });
      });
      
      this.logger.info('WordPress appears to be ready');
    } catch (error) {
      this.logger.warn('Error waiting for WordPress ready state:', error);
    }
  }

  private htmlToMarkdown(html: string): string {
    // Basic HTML to markdown conversion
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up multiple newlines
      .trim();
  }
}
