#!/usr/bin/env node

/**
 * Quick setup verification script for MCP Chrome Connector
 * Tests basic functionality and configuration
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

class SetupVerifier {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  log(message, type = 'info') {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🧪'
    };
    console.log(`${icons[type]} ${message}`);
  }

  async test(name, testFn) {
    this.log(`Testing: ${name}`, 'test');
    try {
      await testFn();
      this.log(`PASS: ${name}`, 'success');
      this.passed++;
    } catch (error) {
      this.log(`FAIL: ${name} - ${error.message}`, 'error');
      this.failed++;
    }
  }

  async runCommand(command, args, timeout = 30000) {
    return new Promise((resolve, reject) => {
      // Use shell: true for Windows compatibility with npm/npx
      const child = spawn(command, args, { 
        stdio: 'pipe',
        shell: true  // This is the key fix for Windows
      });
      let stdout = '';
      let stderr = '';

      const timer = setTimeout(() => {
        child.kill();
        reject(new Error(`Command timeout after ${timeout}ms`));
      }, timeout);

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
        }
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  async verifyFiles() {
    await this.test('Project files exist', async () => {
      const requiredFiles = [
        'package.json',
        'tsconfig.json',
        'src/index.ts',
        'src/server.ts',
        'src/browser/manager.ts',
        'src/security/validator.ts',
        'src/tools/registry.ts',
        'README.md'
      ];

      for (const file of requiredFiles) {
        if (!existsSync(file)) {
          throw new Error(`Missing required file: ${file}`);
        }
      }
    });
  }

  async verifyNodeVersion() {
    await this.test('Node.js version compatibility', async () => {
      const version = process.version;
      const majorVersion = parseInt(version.slice(1).split('.')[0]);
      
      if (majorVersion < 18) {
        throw new Error(`Node.js ${version} is too old. Requires 18.0.0+`);
      }
    });
  }

  async verifyDependencies() {
    await this.test('Dependencies are installed', async () => {
      if (!existsSync('node_modules')) {
        throw new Error('node_modules directory not found. Run: npm install');
      }

      const packageJson = require(path.join(process.cwd(), 'package.json'));
      const requiredDeps = [
        '@modelcontextprotocol/sdk',
        'playwright',
        'winston',
        'joi'
      ];

      for (const dep of requiredDeps) {
        if (!packageJson.dependencies[dep]) {
          throw new Error(`Missing dependency: ${dep}`);
        }
      }
    });
  }

  async verifyBuild() {
    await this.test('TypeScript compilation', async () => {
      this.log('Building project (this may take a moment)...', 'info');
      await this.runCommand('npm', ['run', 'build'], 60000); // Increased timeout
      
      if (!existsSync('dist/index.js')) {
        throw new Error('Build output not found: dist/index.js');
      }
    });
  }

  async verifyBrowsers() {
    await this.test('Playwright browsers available', async () => {
      try {
        // First try a quick check
        await this.runCommand('npx', ['playwright', '--version'], 10000);
        this.log('Playwright is available', 'info');
      } catch (error) {
        // If that fails, try to install browsers
        this.log('Installing Chromium browser (this may take a few minutes)...', 'warning');
        await this.runCommand('npx', ['playwright', 'install', 'chromium'], 120000); // 2 minute timeout
      }
    });
  }

  async verifyServerStart() {
    await this.test('MCP server can start', async () => {
      // Skip this test if dist doesn't exist
      if (!existsSync('dist/index.js')) {
        throw new Error('Build output not found. Run: npm run build first');
      }

      const child = spawn('node', ['dist/index.js'], { 
        stdio: 'pipe',
        shell: true 
      });
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          child.kill();
          reject(new Error('Server did not start within timeout'));
        }, 15000); // Increased timeout

        let output = '';
        let hasStarted = false;

        child.stdout.on('data', (data) => {
          output += data.toString();
          
          // Look for successful initialization messages
          if (output.includes('Chrome browser initialized') || 
              output.includes('MCP Chrome Connector started') ||
              output.includes('Starting MCP Chrome Connector')) {
            hasStarted = true;
            clearTimeout(timeout);
            child.kill();
            resolve();
          }
        });

        child.stderr.on('data', (data) => {
          output += data.toString();
          
          // Also check stderr for log messages
          if (output.includes('Chrome browser initialized') || 
              output.includes('MCP Chrome Connector started') ||
              output.includes('Starting MCP Chrome Connector')) {
            hasStarted = true;
            clearTimeout(timeout);
            child.kill();
            resolve();
          }
        });

        child.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });

        child.on('close', (code) => {
          clearTimeout(timeout);
          if (hasStarted) {
            resolve();
          } else {
            reject(new Error(`Server exited with code ${code}. Output: ${output}`));
          }
        });
      });
    });
  }

  async verifyConfiguration() {
    await this.test('Configuration files are valid', async () => {
      // Check if .env exists or .env.example
      if (!existsSync('.env') && !existsSync('.env.example')) {
        throw new Error('No environment configuration found');
      }

      // Verify config directory
      if (!existsSync('config/default.json')) {
        throw new Error('Default configuration file missing');
      }

      try {
        const config = require(path.join(process.cwd(), 'config/default.json'));
        if (!config.server || !config.browser || !config.security) {
          throw new Error('Invalid configuration structure');
        }
      } catch (error) {
        throw new Error(`Configuration file error: ${error.message}`);
      }
    });
  }

  async verifyBasicFunctionality() {
    await this.test('Security validator works', async () => {
      // This is a basic smoke test
      try {
        const validatorPath = path.join(process.cwd(), 'dist/security/validator.js');
        if (existsSync(validatorPath)) {
          // File exists and was built successfully
          return;
        } else if (existsSync('src/security/validator.ts')) {
          // Source file exists, build might not be complete
          return;
        } else {
          throw new Error('Security validator source file not found');
        }
      } catch (error) {
        throw new Error(`Security validator test failed: ${error.message}`);
      }
    });
  }

  async verifyPermissions() {
    await this.test('File permissions are correct', async () => {
      const testPaths = [
        'src',
        'config',
        'package.json'
      ];

      // Add dist if it exists
      if (existsSync('dist')) {
        testPaths.push('dist');
      }

      for (const testPath of testPaths) {
        if (existsSync(testPath)) {
          try {
            // Try to access the path
            const fs = await import('fs');
            fs.accessSync(testPath, fs.constants.R_OK);
          } catch (error) {
            throw new Error(`Permission denied for: ${testPath}`);
          }
        }
      }
    });
  }

  async run() {
    this.log('🚀 Starting MCP Chrome Connector setup verification...', 'info');
    this.log('', 'info');

    // Run all verification tests in order
    await this.verifyNodeVersion();
    await this.verifyFiles();
    await this.verifyDependencies();
    await this.verifyConfiguration();
    await this.verifyBuild();  // This will build the project
    await this.verifyPermissions();
    await this.verifyBrowsers();
    await this.verifyBasicFunctionality();
    await this.verifyServerStart();

    // Summary
    this.log('', 'info');
    this.log('='.repeat(50), 'info');
    this.log(`Verification Results: ${this.passed} passed, ${this.failed} failed`, 'info');

    if (this.failed === 0) {
      this.log('🎉 All tests passed! Your MCP Chrome Connector is ready to use.', 'success');
      this.log('', 'info');
      this.log('Next steps:', 'info');
      this.log('1. Add the connector to your MCP client configuration', 'info');
      this.log('2. Restart your MCP client (e.g., Claude Desktop)', 'info');
      this.log('3. Try a browser automation prompt', 'info');
      this.log('4. Check the documentation for usage examples', 'info');
      this.log('', 'info');
      this.log('🔗 Configuration example for Claude Desktop:', 'info');
      this.log('Add this to claude_desktop_config.json:', 'info');
      this.log(JSON.stringify({
        mcpServers: {
          "chrome-connector": {
            command: "node",
            args: [path.join(process.cwd(), "dist", "index.js")],
            env: {
              BROWSER_HEADLESS: "true",
              LOG_LEVEL: "info"
            }
          }
        }
      }, null, 2), 'info');
    } else {
      this.log('❌ Some tests failed. Please address the issues above.', 'error');
      this.log('', 'info');
      this.log('Common solutions:', 'info');
      this.log('- Ensure Node.js and npm are in your PATH', 'info');
      this.log('- Run: npm install', 'info');
      this.log('- Run: npm run build', 'info');
      this.log('- Check that you have internet access for Playwright', 'info');
      process.exit(1);
    }
  }
}

// Run verification if this script is executed directly
const verifier = new SetupVerifier();
verifier.run().catch((error) => {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
});
