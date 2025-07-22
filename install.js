#!/usr/bin/env node

/**
 * Installation and setup script for MCP Chrome Connector
 */

import { spawn } from 'child_process';
import { existsSync, copyFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class Installer {
  constructor() {
    this.projectRoot = process.cwd();
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📝',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    if (type === 'error') this.errors.push(message);
    if (type === 'warning') this.warnings.push(message);
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'inherit',
        ...options
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }

  async runCommandSilent(command, args, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { stdio: 'pipe' });
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
        resolve({ code, stdout, stderr });
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  async checkPrerequisites() {
    this.log('Checking prerequisites...');

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      this.log(`Node.js version ${nodeVersion} is too old. Please install Node.js 18.0.0 or higher.`, 'error');
      return false;
    } else {
      this.log(`Node.js version ${nodeVersion} is compatible`, 'success');
    }

    // Check npm availability with improved detection
    try {
      const result = await this.runCommandSilent('npm', ['--version'], 5000);
      if (result.code === 0 && result.stdout.trim()) {
        this.log(`npm version ${result.stdout.trim()} is available`, 'success');
      } else {
        throw new Error('npm command failed');
      }
    } catch (error) {
      this.log('npm is not available or not working properly. Please check your npm installation.', 'error');
      this.log('You can verify npm works by running: npm --version', 'info');
      return false;
    }

    // Check TypeScript availability (optional)
    try {
      const result = await this.runCommandSilent('npx', ['tsc', '--version'], 10000);
      if (result.code === 0) {
        this.log('TypeScript is available', 'success');
      } else {
        this.log('TypeScript not found globally, will use local version', 'warning');
      }
    } catch (error) {
      this.log('TypeScript not found globally, will use local version', 'warning');
    }

    return this.errors.length === 0;
  }

  async installDependencies() {
    this.log('Installing project dependencies...');
    
    try {
      await this.runCommand('npm', ['install']);
      this.log('Dependencies installed successfully', 'success');
    } catch (error) {
      this.log(`Failed to install dependencies: ${error.message}`, 'error');
      throw error;
    }
  }

  async setupConfiguration() {
    this.log('Setting up configuration files...');

    // Copy .env.example to .env if it doesn't exist
    if (!existsSync(path.join(this.projectRoot, '.env'))) {
      if (existsSync(path.join(this.projectRoot, '.env.example'))) {
        copyFileSync(
          path.join(this.projectRoot, '.env.example'),
          path.join(this.projectRoot, '.env')
        );
        this.log('.env file created from .env.example', 'success');
      } else {
        this.log('.env.example file not found', 'warning');
      }
    } else {
      this.log('.env file already exists', 'info');
    }

    // Create logs directory if it doesn't exist
    const logsDir = path.join(this.projectRoot, 'logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
      this.log('Logs directory created', 'success');
    }

    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(this.projectRoot, 'screenshots');
    if (!existsSync(screenshotsDir)) {
      mkdirSync(screenshotsDir, { recursive: true });
      this.log('Screenshots directory created', 'success');
    }
  }

  async buildProject() {
    this.log('Building TypeScript project...');
    
    try {
      await this.runCommand('npm', ['run', 'build']);
      this.log('Project built successfully', 'success');
    } catch (error) {
      this.log(`Failed to build project: ${error.message}`, 'error');
      throw error;
    }
  }

  async installBrowsers() {
    this.log('Installing Playwright browsers...');
    
    try {
      await this.runCommand('npx', ['playwright', 'install', 'chromium']);
      this.log('Chromium browser installed successfully', 'success');
    } catch (error) {
      this.log(`Failed to install browsers: ${error.message}`, 'warning');
      this.log('You may need to install Chromium manually', 'warning');
    }
  }

  async runTests() {
    this.log('Running basic tests...');
    
    try {
      await this.runCommand('npm', ['test'], { stdio: 'pipe' });
      this.log('All tests passed', 'success');
    } catch (error) {
      this.log('Some tests failed, but installation can continue', 'warning');
    }
  }

  async verifyInstallation() {
    this.log('Verifying installation...');

    // Check if build artifacts exist
    const distDir = path.join(this.projectRoot, 'dist');
    if (!existsSync(distDir)) {
      this.log('Build directory not found', 'error');
      return false;
    }

    const indexJs = path.join(distDir, 'index.js');
    if (!existsSync(indexJs)) {
      this.log('Main entry point not found', 'error');
      return false;
    }

    this.log('Installation verification completed', 'success');
    return true;
  }

  async run() {
    this.log('🚀 Starting MCP Chrome Connector installation...');

    try {
      // Check prerequisites
      const prerequisitesOk = await this.checkPrerequisites();
      if (!prerequisitesOk) {
        throw new Error('Prerequisites check failed');
      }

      // Install dependencies
      await this.installDependencies();

      // Setup configuration
      await this.setupConfiguration();

      // Build project
      await this.buildProject();

      // Install browsers
      await this.installBrowsers();

      // Run tests
      await this.runTests();

      // Verify installation
      const verificationOk = await this.verifyInstallation();
      if (!verificationOk) {
        throw new Error('Installation verification failed');
      }

      // Summary
      this.log('🎉 Installation completed successfully!', 'success');
      
      if (this.warnings.length > 0) {
        this.log(`⚠️  ${this.warnings.length} warning(s) encountered:`, 'warning');
        this.warnings.forEach(warning => this.log(`   - ${warning}`, 'warning'));
      }

      this.log('', 'info');
      this.log('Next steps:', 'info');
      this.log('1. Review and customize .env configuration file', 'info');
      this.log('2. Test the server: npm start', 'info');
      this.log('3. Add to your MCP client configuration', 'info');
      this.log('4. Check the README.md for usage examples', 'info');

    } catch (error) {
      this.log(`❌ Installation failed: ${error.message}`, 'error');
      
      if (this.errors.length > 0) {
        this.log('Errors encountered:', 'error');
        this.errors.forEach(err => this.log(`   - ${err}`, 'error'));
      }
      
      process.exit(1);
    }
  }
}

// Run installer if this script is executed directly
const installer = new Installer();
installer.run().catch(console.error);
