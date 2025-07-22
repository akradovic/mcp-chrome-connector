/**
 * Example usage script for MCP Chrome Connector
 * This script demonstrates how to interact with the MCP server
 */

import { spawn, ChildProcess } from 'child_process';
import { writeFileSync } from 'fs';

interface MCPRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params: any;
}

interface MCPResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: any;
}

class MCPClient {
  private process: ChildProcess;
  private requestId = 1;
  private pendingRequests = new Map<number, (response: MCPResponse) => void>();

  constructor(serverPath: string) {
    this.process = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Handle server output
    this.process.stdout?.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      for (const line of lines) {
        try {
          const response: MCPResponse = JSON.parse(line);
          const callback = this.pendingRequests.get(response.id);
          if (callback) {
            callback(response);
            this.pendingRequests.delete(response.id);
          }
        } catch (error) {
          console.error('Failed to parse server response:', line);
        }
      }
    });

    this.process.stderr?.on('data', (data) => {
      console.error('Server error:', data.toString());
    });
  }

  async sendRequest(method: string, params: any = {}): Promise<any> {
    const id = this.requestId++;
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, (response) => {
        if (response.error) {
          reject(new Error(response.error.message || 'Unknown error'));
        } else {
          resolve(response.result);
        }
      });

      this.process.stdin?.write(JSON.stringify(request) + '\n');
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  async initialize(): Promise<void> {
    await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: 'mcp-chrome-example',
        version: '1.0.0'
      }
    });

    await this.sendRequest('initialized');
  }

  async listTools(): Promise<any[]> {
    const result = await this.sendRequest('tools/list');
    return result.tools;
  }

  async callTool(name: string, arguments_: any): Promise<any> {
    const result = await this.sendRequest('tools/call', {
      name,
      arguments: arguments_
    });
    return result;
  }

  close(): void {
    this.process.kill();
  }
}

async function demonstrateUsage() {
  console.log('🚀 Starting MCP Chrome Connector Example');
  
  const client = new MCPClient('./dist/index.js');
  
  try {
    // Initialize the connection
    console.log('📡 Initializing MCP connection...');
    await client.initialize();
    
    // List available tools
    console.log('🔧 Available tools:');
    const tools = await client.listTools();
    tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    
    // Example 1: Navigate to a website
    console.log('\n🧭 Example 1: Navigating to a website');
    const navResult = await client.callTool('navigate', {
      url: 'https://example.com',
      waitCondition: 'domcontentloaded'
    });
    console.log('Navigation result:', JSON.parse(navResult.content[0].text));
    
    // Example 2: Take a screenshot
    console.log('\n📸 Example 2: Taking a screenshot');
    const screenshotResult = await client.callTool('screenshot', {
      fullPage: false,
      format: 'png'
    });
    const screenshot = JSON.parse(screenshotResult.content[0].text);
    if (screenshot.success) {
      // Save screenshot to file
      const buffer = Buffer.from(screenshot.data, 'base64');
      writeFileSync('./example-screenshot.png', buffer);
      console.log('Screenshot saved to example-screenshot.png');
    }
    
    // Example 3: Extract page content
    console.log('\n📄 Example 3: Extracting page content');
    const contentResult = await client.callTool('extract_content', {
      format: 'text'
    });
    const content = JSON.parse(contentResult.content[0].text);
    if (content.success) {
      console.log('Page content (first 200 chars):', 
        content.content.substring(0, 200) + '...');
    }
    
    // Example 4: Interact with elements (if there are any)
    console.log('\n🖱️ Example 4: Checking for interactive elements');
    try {
      const interactionResult = await client.callTool('interact_element', {
        selector: 'a',
        action: 'click'
      });
      const interaction = JSON.parse(interactionResult.content[0].text);
      console.log('Element interaction result:', interaction);
    } catch (error) {
      console.log('No clickable elements found (expected for example.com)');
    }
    
    // Example 5: Execute JavaScript
    console.log('\n⚡ Example 5: Executing JavaScript');
    const scriptResult = await client.callTool('execute_script', {
      script: 'return { title: document.title, url: window.location.href, timestamp: Date.now() };'
    });
    const script = JSON.parse(scriptResult.content[0].text);
    if (script.success) {
      console.log('Script execution result:', script.result);
    }
    
    console.log('\n✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during demonstration:', error);
  } finally {
    client.close();
  }
}

// Run the demonstration
demonstrateUsage().catch(console.error);

export { MCPClient, demonstrateUsage };
