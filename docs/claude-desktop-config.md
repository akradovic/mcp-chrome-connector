# Claude Desktop Configuration

This document provides configuration examples for integrating the MCP Chrome Connector with Claude Desktop and other MCP clients.

## Claude Desktop Configuration

### Basic Configuration

Add this to your `claude_desktop_config.json` file (usually located in `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

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

### Advanced Configuration with Custom Settings

```json
{
  "mcpServers": {
    "chrome-connector": {
      "command": "node",
      "args": ["C:/Users/adamr/mcp-chrome-connector/dist/index.js"],
      "env": {
        "BROWSER_HEADLESS": "false",
        "BROWSER_WIDTH": "1920",
        "BROWSER_HEIGHT": "1080",
        "BROWSER_TIMEOUT": "45000",
        "ALLOWED_DOMAINS": "github.com,stackoverflow.com,google.com,youtube.com",
        "BLOCKED_DOMAINS": "localhost,127.0.0.1,malicious-site.com",
        "MAX_EXECUTION_TIME": "60000",
        "MAX_MEMORY_USAGE": "1024",
        "LOG_LEVEL": "debug",
        "LOG_FILE": "C:/Users/adamr/mcp-chrome-connector/logs/connector.log"
      }
    }
  }
}
```

### Development Configuration (Non-headless for Debugging)

```json
{
  "mcpServers": {
    "chrome-connector-dev": {
      "command": "node",
      "args": ["C:/Users/adamr/mcp-chrome-connector/dist/index.js"],
      "env": {
        "BROWSER_HEADLESS": "false",
        "LOG_LEVEL": "debug",
        "ENABLE_SANDBOX": "false",
        "BROWSER_ARGS": "--disable-web-security,--disable-features=VizDisplayCompositor"
      }
    }
  }
}
```

## Other MCP Clients

### Cline/Cursor Configuration

Add to your VS Code `settings.json`:

```json
{
  "mcp.servers": {
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

### Zed Editor Configuration

Add to your Zed configuration:

```json
{
  "mcp_servers": {
    "chrome-connector": {
      "command": "node",
      "args": ["C:/Users/adamr/mcp-chrome-connector/dist/index.js"]
    }
  }
}
```

## Environment Variable Reference

| Variable | Values | Description |
|----------|--------|-------------|
| `BROWSER_HEADLESS` | `true/false` | Run browser without GUI |
| `BROWSER_WIDTH` | Number | Viewport width in pixels |
| `BROWSER_HEIGHT` | Number | Viewport height in pixels |
| `BROWSER_TIMEOUT` | Number | Navigation timeout in milliseconds |
| `ALLOWED_DOMAINS` | Comma-separated | Domains allowed for navigation |
| `BLOCKED_DOMAINS` | Comma-separated | Domains blocked from navigation |
| `MAX_EXECUTION_TIME` | Number | Maximum script execution time (ms) |
| `MAX_MEMORY_USAGE` | Number | Maximum memory usage (MB) |
| `ENABLE_SANDBOX` | `true/false` | Enable browser sandbox mode |
| `LOG_LEVEL` | `debug/info/warn/error` | Logging verbosity |
| `LOG_FILE` | File path | Optional log file location |

## Security Recommendations

### Production Configuration
```json
{
  "env": {
    "BROWSER_HEADLESS": "true",
    "ALLOWED_DOMAINS": "trusted-site1.com,trusted-site2.com",
    "BLOCKED_DOMAINS": "localhost,127.0.0.1,0.0.0.0,malicious-sites.com",
    "MAX_EXECUTION_TIME": "30000",
    "MAX_MEMORY_USAGE": "512",
    "ENABLE_SANDBOX": "true",
    "LOG_LEVEL": "warn"
  }
}
```

### Development Configuration
```json
{
  "env": {
    "BROWSER_HEADLESS": "false",
    "LOG_LEVEL": "debug",
    "ENABLE_SANDBOX": "false"
  }
}
```

## Troubleshooting

### Common Issues

1. **"Command not found" error:**
   - Ensure Node.js is installed and in PATH
   - Verify the path to the connector is correct
   - Check that the project is built (`npm run build`)

2. **Browser fails to start:**
   - Try setting `ENABLE_SANDBOX=false`
   - Check Chrome/Chromium installation
   - Ensure proper permissions

3. **Permission denied errors:**
   - Check file permissions on the connector directory
   - Ensure Claude Desktop has necessary permissions
   - Try running as administrator (Windows)

4. **Connection timeout:**
   - Increase timeout values
   - Check network connectivity
   - Verify firewall settings

### Debug Mode

Enable verbose logging by setting:
```json
{
  "env": {
    "LOG_LEVEL": "debug",
    "LOG_FILE": "C:/Users/adamr/mcp-chrome-connector/debug.log"
  }
}
```

Then check the log file for detailed execution information.

## Testing the Configuration

1. **Build the project:**
   ```bash
   cd C:\Users\adamr\mcp-chrome-connector
   npm run build
   ```

2. **Test manually:**
   ```bash
   node dist/index.js
   ```
   The server should start and wait for MCP messages.

3. **Test with Claude Desktop:**
   - Add configuration to `claude_desktop_config.json`
   - Restart Claude Desktop
   - Try a browser automation prompt

4. **Verify tools are available:**
   In Claude, try asking: "What browser automation tools do you have available?"

## Example Prompts for Testing

Once configured, try these prompts with Claude:

1. **Basic navigation:**
   "Navigate to https://example.com and take a screenshot"

2. **Content extraction:**
   "Go to https://news.ycombinator.com and extract the top 5 story titles"

3. **Form interaction:**
   "Visit https://httpbin.org/forms/post and fill out a simple form"

4. **JavaScript execution:**
   "Navigate to any webpage and get the page title using JavaScript"

These examples will help verify that the MCP Chrome Connector is working correctly with your client.
