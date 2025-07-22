# MCP Chrome Connector API Documentation

This document provides comprehensive documentation for all tools and capabilities provided by the MCP Chrome Connector.

## Tool Overview

The MCP Chrome Connector provides five core tools for browser automation:

1. **navigate** - Navigate to URLs with security validation
2. **screenshot** - Capture visual state of pages or elements
3. **extract_content** - Extract page content in multiple formats
4. **interact_element** - Interact with page elements
5. **execute_script** - Execute JavaScript in browser context

## Tool Reference

### 🧭 navigate

Navigate to a specific URL in the browser with optional wait conditions and session management.

**Schema:**
```json
{
  "name": "navigate",
  "description": "Navigate to a specific URL in the browser",
  "inputSchema": {
    "type": "object",
    "properties": {
      "url": {
        "type": "string",
        "description": "The URL to navigate to"
      },
      "sessionId": {
        "type": "string",
        "description": "Optional browser session ID. If not provided, a new session will be created"
      },
      "waitCondition": {
        "type": "string",
        "enum": ["load", "domcontentloaded", "networkidle"],
        "description": "Wait condition for page load completion",
        "default": "domcontentloaded"
      },
      "timeout": {
        "type": "number",
        "description": "Navigation timeout in milliseconds",
        "default": 30000
      }
    },
    "required": ["url"]
  }
}
```

**Example Usage:**
```json
{
  "url": "https://example.com",
  "waitCondition": "networkidle",
  "timeout": 45000
}
```

**Response Format:**
```json
{
  "success": true,
  "url": "https://example.com",
  "title": "Example Domain",
  "statusCode": 200
}
```

**Error Response:**
```json
{
  "success": false,
  "url": "https://invalid-url.com",
  "error": "Navigation timeout exceeded"
}
```

### 📸 screenshot

Capture screenshots of the current page or specific elements with various formatting options.

**Schema:**
```json
{
  "name": "screenshot",
  "description": "Capture a screenshot of the current page or specific element",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sessionId": {
        "type": "string",
        "description": "Browser session ID. If not provided, will use default session"
      },
      "selector": {
        "type": "string",
        "description": "CSS selector for specific element to screenshot. If not provided, captures full page"
      },
      "fullPage": {
        "type": "boolean",
        "description": "Whether to capture the full scrollable page",
        "default": false
      },
      "format": {
        "type": "string",
        "enum": ["png", "jpeg"],
        "description": "Image format for the screenshot",
        "default": "png"
      },
      "quality": {
        "type": "number",
        "minimum": 0,
        "maximum": 100,
        "description": "JPEG quality (0-100). Only applies to JPEG format",
        "default": 80
      },
      "clip": {
        "type": "object",
        "description": "Clip area for screenshot",
        "properties": {
          "x": {"type": "number"},
          "y": {"type": "number"},
          "width": {"type": "number"},
          "height": {"type": "number"}
        },
        "required": ["x", "y", "width", "height"]
      }
    },
    "required": []
  }
}
```

**Example Usage:**
```json
{
  "selector": ".main-content",
  "format": "jpeg",
  "quality": 90,
  "fullPage": false
}
```

**Response Format:**
```json
{
  "success": true,
  "data": "iVBORw0KGgoAAAANSUhEUgAAA...",
  "metadata": {
    "width": 1280,
    "height": 720,
    "format": "jpeg"
  }
}
```

### 📄 extract_content

Extract content from the current page in various formats with optional element targeting.

**Schema:**
```json
{
  "name": "extract_content",
  "description": "Extract content from the current page in various formats",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sessionId": {
        "type": "string",
        "description": "Browser session ID. If not provided, will use default session"
      },
      "format": {
        "type": "string",
        "enum": ["text", "html", "markdown"],
        "description": "Format for content extraction",
        "default": "text"
      },
      "selector": {
        "type": "string",
        "description": "CSS selector for specific element to extract. If not provided, extracts from entire page"
      },
      "removeScripts": {
        "type": "boolean",
        "description": "Remove script tags from HTML extraction",
        "default": true
      },
      "removeStyles": {
        "type": "boolean",
        "description": "Remove style tags from HTML extraction",
        "default": false
      }
    },
    "required": ["format"]
  }
}
```

**Example Usage:**
```json
{
  "format": "markdown",
  "selector": "article",
  "removeScripts": true
}
```

**Response Format:**
```json
{
  "success": true,
  "content": "# Page Title\n\nThis is the extracted content...",
  "metadata": {
    "length": 1024,
    "encoding": "utf-8"
  }
}
```

### 🖱️ interact_element

Interact with page elements through various actions like clicking, typing, and selecting.

**Schema:**
```json
{
  "name": "interact_element",
  "description": "Interact with page elements (click, type, select, etc.)",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sessionId": {
        "type": "string",
        "description": "Browser session ID. If not provided, will use default session"
      },
      "selector": {
        "type": "string",
        "description": "CSS selector for the element to interact with"
      },
      "action": {
        "type": "string",
        "enum": ["click", "type", "select", "hover", "focus", "clear"],
        "description": "Action to perform on the element"
      },
      "value": {
        "type": "string",
        "description": "Value for type or select actions"
      },
      "options": {
        "type": "object",
        "description": "Additional options for the interaction",
        "properties": {
          "delay": {
            "type": "number",
            "description": "Delay between keystrokes for typing (ms)",
            "default": 0
          },
          "force": {
            "type": "boolean",
            "description": "Force the action even if element is not visible",
            "default": false
          },
          "timeout": {
            "type": "number",
            "description": "Timeout for waiting for element (ms)",
            "default": 5000
          }
        }
      }
    },
    "required": ["selector", "action"]
  }
}
```

**Example Usage:**
```json
{
  "selector": "#search-input",
  "action": "type",
  "value": "Hello World",
  "options": {
    "delay": 100,
    "timeout": 10000
  }
}
```

**Response Format:**
```json
{
  "success": true,
  "element": {
    "tagName": "INPUT",
    "text": "",
    "value": "Hello World"
  }
}
```

### ⚡ execute_script

Execute JavaScript code in the browser page context with security restrictions.

**Schema:**
```json
{
  "name": "execute_script",
  "description": "Execute JavaScript code in the browser page context",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sessionId": {
        "type": "string",
        "description": "Browser session ID. If not provided, will use default session"
      },
      "script": {
        "type": "string",
        "description": "JavaScript code to execute"
      },
      "args": {
        "type": "array",
        "description": "Arguments to pass to the script",
        "items": {
          "type": "string"
        }
      },
      "awaitPromise": {
        "type": "boolean",
        "description": "Whether to await the result if it returns a Promise",
        "default": false
      }
    },
    "required": ["script"]
  }
}
```

**Example Usage:**
```json
{
  "script": "return { title: document.title, url: window.location.href, links: Array.from(document.querySelectorAll('a')).length };",
  "awaitPromise": false
}
```

**Response Format:**
```json
{
  "success": true,
  "result": {
    "title": "Example Domain",
    "url": "https://example.com",
    "links": 1
  }
}
```

## Session Management

### Session Lifecycle

1. **Session Creation**: Sessions are created automatically when not specified
2. **Session Reuse**: Use the same `sessionId` across multiple tool calls
3. **Session Persistence**: Sessions maintain browser state, cookies, and authentication
4. **Session Cleanup**: Sessions are automatically cleaned up on server shutdown

### Session Best Practices

```javascript
// Example workflow with persistent session
const sessionId = "user-workflow-123";

// Step 1: Navigate with session
await navigate({
  url: "https://example.com/login",
  sessionId: sessionId
});

// Step 2: Login using same session
await interact_element({
  sessionId: sessionId,
  selector: "#username",
  action: "type",
  value: "user@example.com"
});

// Step 3: Continue workflow in same session
await screenshot({
  sessionId: sessionId,
  fullPage: true
});
```

## Security Features

### URL Validation

All URLs are validated against:
- Protocol restrictions (only HTTP/HTTPS allowed)
- Domain allowlisting/blocklisting
- Malformed URL detection

### Input Sanitization

All inputs are sanitized to prevent:
- XSS attacks through selectors
- Script injection through text inputs
- Command injection through parameters

### Script Execution Security

JavaScript execution includes:
- Dangerous function blocking (eval, Function, setTimeout)
- DOM manipulation restrictions
- Storage access prevention (localStorage, sessionStorage)
- Window object access limitations

### Resource Limits

Configurable limits for:
- Maximum execution time per operation
- Memory usage monitoring
- Session timeout handling
- Concurrent session limits

## Error Handling

### Common Error Types

1. **Navigation Errors**
   ```json
   {
     "success": false,
     "error": "Navigation timeout exceeded",
     "url": "https://slow-site.com"
   }
   ```

2. **Element Not Found**
   ```json
   {
     "success": false,
     "error": "Element not found: #non-existent-element"
   }
   ```

3. **Security Violations**
   ```json
   {
     "success": false,
     "error": "Domain example.com is not in allowed list"
   }
   ```

4. **Script Execution Errors**
   ```json
   {
     "success": false,
     "error": "Script contains potentially dangerous operations"
   }
   ```

### Error Recovery

- Failed operations don't affect session state
- Timeouts are handled gracefully
- Browser crashes trigger automatic recovery
- Detailed error logging for debugging

## Performance Optimization

### Best Practices

1. **Reuse Sessions**: Keep the same session for related operations
2. **Optimize Screenshots**: Use specific selectors instead of full page when possible
3. **Batch Operations**: Group related browser actions together
4. **Monitor Resources**: Check memory and CPU usage regularly

### Performance Metrics

The connector tracks:
- Operation execution time
- Memory usage per session
- Browser resource consumption
- Network request timing

## Troubleshooting

### Debug Mode

Enable debug logging:
```json
{
  "env": {
    "LOG_LEVEL": "debug"
  }
}
```

### Common Issues

1. **Timeout Errors**: Increase timeout values or check network connectivity
2. **Element Interaction Failures**: Verify selectors and wait for element visibility
3. **Script Execution Blocked**: Review security restrictions and script content
4. **Memory Issues**: Monitor session cleanup and resource limits

### Logging

Comprehensive logging includes:
- All tool executions with parameters
- Security validation results
- Browser lifecycle events
- Performance metrics
- Error stack traces

This API documentation provides the complete reference for integrating and using the MCP Chrome Connector in your AI automation workflows.
