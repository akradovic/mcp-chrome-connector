# Getting Started with MCP Chrome Connector

Welcome to the MCP Chrome Connector! This guide will help you get up and running with browser automation through the Model Context Protocol.

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies and Build

```bash
cd C:\Users\adamr\mcp-chrome-connector

# Install all dependencies
npm install

# Build the TypeScript project
npm run build

# Install browser binaries
npx playwright install chromium

# Verify everything works
node verify-setup.js
```

### Step 2: Configure Claude Desktop

1. Open your Claude Desktop configuration file:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the Chrome Connector:
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

3. Restart Claude Desktop

### Step 3: Test It Out!

Try this prompt in Claude:
> "Navigate to https://example.com, take a screenshot, and extract the page content as markdown"

## 📋 Detailed Setup Instructions

### Prerequisites

- **Node.js 18.0.0+** - [Download here](https://nodejs.org/)
- **Chrome or Chromium browser** - Usually installed automatically
- **Claude Desktop** or other MCP-compatible client

### Installation Options

#### Option A: Automated Installation
```bash
cd C:\Users\adamr\mcp-chrome-connector
node install.js
```

#### Option B: Manual Installation
```bash
# 1. Install dependencies
npm install

# 2. Copy environment configuration
copy .env.example .env

# 3. Build the project
npm run build

# 4. Install browsers
npx playwright install chromium

# 5. Run tests
npm test

# 6. Verify setup
node verify-setup.js
```

### Configuration Options

#### Basic Configuration (.env file)
```env
# Browser Settings
BROWSER_HEADLESS=true
BROWSER_WIDTH=1280
BROWSER_HEIGHT=720
BROWSER_TIMEOUT=30000

# Security Settings
MAX_EXECUTION_TIME=30000
MAX_MEMORY_USAGE=512
ENABLE_SANDBOX=true

# Logging
LOG_LEVEL=info
```

#### Advanced Security Configuration
```env
# Domain Restrictions
ALLOWED_DOMAINS=github.com,stackoverflow.com,google.com
BLOCKED_DOMAINS=localhost,127.0.0.1,malicious-site.com

# Performance Limits
MAX_EXECUTION_TIME=60000
MAX_MEMORY_USAGE=1024

# Debug Logging
LOG_LEVEL=debug
LOG_FILE=./logs/connector.log
```

## 🎯 First Examples

### Example 1: Simple Web Scraping
```
Prompt: "Go to https://news.ycombinator.com and get me the titles of the top 5 stories"

What happens:
1. Browser navigates to Hacker News
2. Content is extracted from the page
3. Top stories are identified and returned
```

### Example 2: Form Automation
```
Prompt: "Navigate to https://httpbin.org/forms/post, fill out the form with test data, and submit it"

What happens:
1. Browser opens the test form
2. Form fields are filled with appropriate test data
3. Form is submitted
4. Results are captured
```

### Example 3: Visual Analysis
```
Prompt: "Take a screenshot of https://github.com and describe what you see"

What happens:
1. Browser navigates to GitHub
2. Screenshot is captured
3. Visual content is analyzed and described
```

## 🔧 Available Tools

### Navigation
- **navigate**: Go to any URL with wait conditions
- Parameters: `url`, `sessionId`, `waitCondition`, `timeout`

### Visual Capture
- **screenshot**: Capture full pages or specific elements
- Parameters: `selector`, `fullPage`, `format`, `quality`

### Content Extraction
- **extract_content**: Get page content as text, HTML, or markdown
- Parameters: `format`, `selector`, `removeScripts`

### Element Interaction
- **interact_element**: Click, type, select, hover on elements
- Parameters: `selector`, `action`, `value`, `options`

### Script Execution
- **execute_script**: Run JavaScript in the browser
- Parameters: `script`, `args`, `awaitPromise`

## 🛡️ Security Features

### Built-in Protection
- **Domain filtering**: Control which sites can be accessed
- **Input sanitization**: Prevent injection attacks
- **Script sandboxing**: Block dangerous JavaScript operations
- **Resource limits**: Prevent resource exhaustion

### Security Best Practices
1. Configure allowed domains for production use
2. Enable audit logging
3. Use headless mode for security
4. Monitor resource usage
5. Regularly update dependencies

## 🔍 Troubleshooting

### Common Issues

**"Command not found" error:**
```bash
# Check Node.js installation
node --version

# Rebuild the project
npm run build

# Verify file permissions
ls -la dist/index.js
```

**Browser fails to start:**
```bash
# Try disabling sandbox
ENABLE_SANDBOX=false npm start

# Install browsers manually
npx playwright install chromium

# Check Chrome installation
google-chrome --version  # Linux
chrome --version          # Windows
```

**Permission errors:**
```bash
# Fix file permissions
chmod +x dist/index.js

# Run as administrator (Windows)
# Or check Claude Desktop permissions
```

**Connection timeout:**
```bash
# Increase timeout values
BROWSER_TIMEOUT=60000 npm start

# Check network connectivity
ping example.com

# Verify firewall settings
```

### Debug Mode

Enable detailed logging:
```bash
LOG_LEVEL=debug node dist/index.js
```

Or in Claude Desktop config:
```json
{
  "env": {
    "LOG_LEVEL": "debug",
    "LOG_FILE": "C:/Users/adamr/mcp-chrome-connector/debug.log"
  }
}
```

### Verification Steps

1. **Test server startup:**
   ```bash
   node dist/index.js
   ```
   Should show: "Chrome browser initialized successfully"

2. **Test with verification script:**
   ```bash
   node verify-setup.js
   ```
   Should pass all tests

3. **Test Claude integration:**
   - Ask Claude: "What browser tools do you have?"
   - Should list the 5 available tools

## 📚 Learning Resources

### Essential Documentation
- [API Documentation](./docs/api-documentation.md) - Complete tool reference
- [Claude Desktop Configuration](./docs/claude-desktop-config.md) - Setup guides
- [Example Usage](./docs/example-usage.ts) - Code examples

### Example Prompts to Try

**Basic Navigation:**
- "Navigate to [website] and take a screenshot"
- "Go to [website] and extract all the text content"

**Content Analysis:**
- "Visit [news site] and summarize the top headlines"
- "Go to [product page] and extract the price and description"

**Interactive Tasks:**
- "Search for [term] on [search engine] and get the first 5 results"
- "Fill out the contact form on [website] with test data"

**Advanced Automation:**
- "Monitor [website] for changes every few minutes"
- "Compare prices between [site1] and [site2] for [product]"

## 🤝 Getting Help

### Support Channels
1. **Check the logs** - Enable debug mode for detailed information
2. **Run verification** - Use `node verify-setup.js` to diagnose issues
3. **Review documentation** - Check the docs folder for detailed guides
4. **Test manually** - Try running the server directly to isolate issues

### Common Questions

**Q: Can I use this with other browsers?**
A: Currently supports Chromium/Chrome. Firefox and Safari support could be added.

**Q: Is this secure for production use?**
A: Yes, with proper configuration. Use domain allowlisting and enable all security features.

**Q: Can I run multiple browser sessions?**
A: Yes, use different sessionId values to maintain separate browser contexts.

**Q: How do I update the connector?**
A: Run `git pull` and `npm run build` to get the latest version.

## 🎉 You're Ready!

Congratulations! You now have a powerful browser automation tool integrated with your AI assistant. The MCP Chrome Connector enables:

- **Automated web browsing** for research and data collection
- **Form filling and submission** for workflow automation  
- **Visual analysis** through screenshots and content extraction
- **Interactive testing** of web applications
- **Content monitoring** and change detection

Start with simple navigation and screenshots, then explore more advanced automation as you get comfortable with the tools.

Happy automating! 🚀
