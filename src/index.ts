#!/usr/bin/env node

/**
 * Entry point for MCP Chrome Connector
 */

import { MCPChromeConnector } from './server.js';

async function main() {
  const connector = new MCPChromeConnector();
  await connector.start();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

main().catch((error) => {
  console.error('Failed to start MCP Chrome Connector:', error);
  process.exit(1);
});
