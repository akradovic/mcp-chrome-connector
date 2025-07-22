# MCP Chrome Connector

A comprehensive Model Context Protocol (MCP) server that enables AI systems to interact with Chrome browser automation. Built with TypeScript, Playwright, and the official MCP SDK for secure, high-performance browser automation.

## Features

🌐 **Browser Automation**
- Navigate to websites with security validation
- Capture screenshots of pages or specific elements
- Extract content in multiple formats (text, HTML, markdown)
- Interact with page elements (click, type, select, hover)
- Execute JavaScript code in controlled environments

🔒 **Security-First Design**
- Domain allowlisting and blocklisting
- Input validation and sanitization
- Script execution sandboxing
- Resource consumption limits
- Comprehensive audit logging

🚀 **High Performance**
- Session management for persistent browser contexts
- Connection pooling and reuse
- Optimized screenshot capture
- Memory and CPU monitoring

## Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- Chrome or Chromium browser
- TypeScript (for development)

### Installation

1. **Clone and setup the project:**
```bash
cd C:\Users\adamr\mcp-chrome-connector
npm install
```

2. **Build the project:**
```bash
npm run build
```

3. **Configure environment (optional):**
```bash
cp .env.example .env
# Edit .env file with your preferred settings
```

4. **Test the server:**
```bash
npm start
```

### MCP Client Integration

Add the Chrome Connector to your MCP client configuration:

**Claude Desktop (claude_desktop_config.json):**
```json
{
  "mcpServers": {
    "chrome-connector": {
      "command": "node",
      "args": ["C:/Users/adamr/mcp-chrome-connector/dist/index.js"],
      "env": {
        "BROWSER_HEADLESS": "true",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Cline/Cursor (settings.json):**
```json
{
  "mcp.servers": {
    "chrome-connector": {
      "command": "node",
      "args": ["C:/Users/adamr/mcp-chrome-connector/dist/index.js"]
    }
  }
}
```

## Available Tools

### 🧭 Navigation
**Tool:** `navigate`
```json
{
  "url": "https://example.com",
  "sessionId": "optional-session-id",
  "waitCondition": "domcontentloaded",
  "timeout": 30000
}
```

### 📸 Screenshot Capture
**Tool:** `screenshot`
```json
{
  "sessionId": "optional-session-id",
  "selector": ".specific-element",
  "fullPage": false,
  "format": "png",
  "quality": 80
}
```

### 📄 Content Extraction
**Tool:** `extract_content`
```json
{
  "sessionId": "optional-session-id",
  "format": "markdown",
  "selector": "article",
  "removeScripts": true
}
```

### 🖱️ Element Interaction
**Tool:** `interact_element`
```json
{
  "sessionId": "optional-session-id",
  "selector": "#search-input",
  "action": "type",
  "value": "Hello World",
  "options": {
    "delay": 100,
    "timeout": 5000
  }
}
```

### ⚡ Script Execution
**Tool:** `execute_script`
```json
{
  "sessionId": "optional-session-id",
  "script": "return document.title;",
  "args": [],
  "awaitPromise": false
}
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BROWSER_HEADLESS` | `true` | Run browser in headless mode |
| `BROWSER_WIDTH` | `1280` | Browser viewport width |
| `BROWSER_HEIGHT` | `720` | Browser viewport height |
| `BROWSER_TIMEOUT` | `30000` | Default navigation timeout (ms) |
| `ALLOWED_DOMAINS` | `""` | Comma-separated allowed domains |
| `BLOCKED_DOMAINS` | `localhost,127.0.0.1` | Comma-separated blocked domains |
| `MAX_EXECUTION_TIME` | `30000` | Maximum script execution time (ms) |
| `MAX_MEMORY_USAGE` | `512` | Maximum memory usage (MB) |
| `ENABLE_SANDBOX` | `true` | Enable browser sandbox mode |
| `LOG_LEVEL` | `info` | Logging level (debug/info/warn/error) |
| `LOG_FILE` | `""` | Optional log file path |

### Security Configuration

The connector implements multiple security layers:

1. **Domain Filtering:** Control which websites can be accessed
2. **Input Validation:** Sanitize all user inputs to prevent injection
3. **Script Sandboxing:** Restrict dangerous JavaScript operations
4. **Resource Limits:** Prevent resource exhaustion attacks
5. **Session Isolation:** Separate browser contexts for security

## Usage Examples

### Example 1: Web Scraping Workflow
```typescript
// 1. Navigate to a website
await navigate({
  url: "https://news.ycombinator.com",
  waitCondition: "networkidle"
});

// 2. Take a screenshot for visual verification
await screenshot({
  fullPage: true,
  format: "png"
});

// 3. Extract article titles
await extract_content({
  format: "text",
  selector: ".storylink"
});
```

### Example 2: Form Automation
```typescript
// 1. Navigate to a form
await navigate({
  url: "https://example.com/contact",
  sessionId: "form-session"
});

// 2. Fill out form fields
await interact_element({
  sessionId: "form-session",
  selector: "#name",
  action: "type",
  value: "John Doe"
});

await interact_element({
  sessionId: "form-session",
  selector: "#email",
  action: "type",
  value: "john@example.com"
});

// 3. Submit the form
await interact_element({
  sessionId: "form-session",
  selector: "#submit-button",
  action: "click"
});
```

### Example 3: Dynamic Content Analysis
```typescript
// 1. Navigate to a dynamic website
await navigate({
  url: "https://example.com/dynamic-content",
  sessionId: "analysis"
});

// 2. Execute JavaScript to trigger content loading
await execute_script({
  sessionId: "analysis",
  script: "document.querySelector('#load-more').click();"
});

// 3. Wait and extract the loaded content
await extract_content({
  sessionId: "analysis",
  format: "markdown",
  selector: ".content-area"
});
```

## Development

### Project Structure

```
C:\Users\adamr\mcp-chrome-connector\
├── src/
│   ├── browser/          # Browser management and Playwright integration
│   ├── security/         # Security validation and protection
│   ├── tools/           # Individual MCP tool implementations
│   ├── types/           # TypeScript type definitions
│   ├── server.ts        # Main MCP server implementation
│   └── index.ts         # Application entry point
├── config/              # Configuration files
├── tests/               # Test suite
├── docs/                # Additional documentation
└── dist/                # Compiled JavaScript output
```

### Development Commands

```bash
# Install dependencies
npm install

# Development with auto-rebuild
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Adding New Tools

1. Create a new tool class in `src/tools/`
2. Implement the required interface methods
3. Register the tool in `src/tools/registry.ts`
4. Add comprehensive error handling and logging
5. Update documentation and tests

## Security Considerations

### Safe Usage Guidelines

1. **Domain Restrictions:** Always configure allowed domains for production use
2. **Input Validation:** Never trust user-provided selectors or scripts
3. **Resource Monitoring:** Monitor execution time and memory usage
4. **Session Management:** Clean up browser sessions promptly
5. **Audit Logging:** Enable comprehensive logging for security monitoring

### Known Limitations

- JavaScript execution is sandboxed but not completely isolated
- File system access is limited to browser's allowed directories
- Network requests follow same-origin policy unless configured otherwise
- Browser extensions and plugins are disabled for security

## Troubleshooting

### Common Issues

**Browser fails to start:**
- Check Chrome/Chromium installation
- Verify user permissions for browser executable
- Try disabling sandbox mode temporarily

**Navigation timeouts:**
- Increase timeout values in configuration
- Check network connectivity
- Verify URL accessibility

**Script execution errors:**
- Review security restrictions on JavaScript execution
- Check for blocked DOM operations
- Validate script syntax

**Permission errors:**
- Ensure proper file system permissions
- Check browser user data directory access
- Verify network access permissions

### Debug Mode

Enable debug logging for detailed troubleshooting:

```bash
LOG_LEVEL=debug npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section
- Review configuration documentation
- Enable debug logging for diagnostics
- Consult MCP protocol documentation

---

Built with ❤️ using TypeScript, Playwright, and the Model Context Protocol.
