# Screenshot Improvements

## What Changed

The screenshot tool now includes proper waiting mechanisms to ensure pages are fully loaded before capturing screenshots. This addresses the issue where screenshots were taken before content had fully rendered. **Special WordPress detection and handling has been added for WordPress sites.**

## New Parameters

The screenshot tool now supports these additional parameters:

- **waitCondition**: Specifies what to wait for before taking the screenshot
  - `'load'`: Wait for the load event (all resources loaded)
  - `'domcontentloaded'`: Wait for DOM to be ready (default for navigation)
  - `'networkidle'`: Wait for network activity to settle (default for screenshots)

- **waitTimeout**: Maximum time to wait for the condition (default: 5000ms)

- **additionalDelay**: Extra delay after wait condition is met (default: 1000ms)

## WordPress-Specific Improvements

### Automatic WordPress Detection
The system now automatically detects WordPress sites (specifically `/products/` pages) and applies special handling:

1. **Content Detection**: Waits for specific WordPress elements to be present:
   - `.product-card` (individual product cards)
   - `.no-products` (empty state message)
   - `.products-grid` (main product container)

2. **AJAX Completion**: Waits for WordPress/jQuery AJAX calls to complete
3. **Anti-Bot Detection Bypass**: Uses browser flags to appear more like a real user
4. **WordPress-Friendly Headers**: Sends appropriate HTTP headers

### Enhanced Browser Configuration
The browser now launches with WordPress-optimized settings:
- Disabled automation detection flags
- Real user agent strings
- Appropriate HTTP headers
- Simulated human-like browser properties

## Example Usage

```typescript
// Basic usage - automatically detects and handles WordPress
await screenshot({ 
  fullPage: true 
});

// Custom wait settings for slow-loading WordPress sites
await screenshot({
  fullPage: true,
  waitCondition: 'networkidle',
  waitTimeout: 10000,      // Wait up to 10 seconds
  additionalDelay: 3000    // Plus 3 extra seconds for WordPress
});

// For WordPress sites with heavy AJAX content
await screenshot({
  fullPage: true,
  waitCondition: 'load',   // Wait for all resources
  additionalDelay: 5000    // Give extra time for WordPress AJAX
});
```

## Benefits

1. **WordPress-Aware**: Automatically detects and properly handles WordPress sites
2. **More reliable screenshots**: Pages are fully loaded before capture
3. **AJAX-Ready**: Waits for dynamic content loaded via jQuery/AJAX
4. **Anti-Bot Resistant**: Less likely to be blocked by WordPress security plugins
5. **Configurable waiting**: Adjust timing based on site requirements  
6. **Better for dynamic content**: Allows time for JavaScript to render content
7. **Backward compatible**: Existing code works with sensible defaults

## Technical Details

- Uses Playwright's `waitForLoadState()` method
- WordPress detection via URL pattern matching
- jQuery.active monitoring for AJAX completion
- Anti-automation browser flags disabled
- Realistic user agent and HTTP headers
- Gracefully handles timeout scenarios 
- Includes detailed logging for debugging
- Non-blocking - continues with screenshot even if wait times out

## Default Behavior

If no wait parameters are specified, the tool will:
1. Wait for `networkidle` (no network requests for 500ms)
2. **Auto-detect WordPress** and wait for content elements
3. **Wait for AJAX completion** (if WordPress detected)
4. Add an additional 1-second delay
5. Then capture the screenshot

This should handle most WordPress sites including e-commerce, blogs, and custom post type archives.
