# MCP Server Test Guide

This guide explains how to test the MCP server locally before deploying to staging or production.

## Test Files

1. **test-mcp-local.js** - Basic HTTP-based tests using Node.js built-in modules
2. **test-mcp-advanced.ts** - Advanced tests using the official MCP SDK client

## Running Tests

### Local Testing (Development)

First, start the local development server:

```bash
# Start the local worker
pnpm dev
```

In another terminal, run the tests:

```bash
# Run basic tests
pnpm test:local

# Run advanced tests (requires MCP SDK)
pnpm test:advanced
```

### Testing Staging Environment

```bash
# Basic tests against staging
pnpm test:staging

# Advanced tests against staging
pnpm test:advanced:staging
```

### Testing Production Environment

```bash
# Basic tests against production
pnpm test:production

# Advanced tests against production
pnpm test:advanced:production
```

## What the Tests Validate

### Basic Tests (test-mcp-local.js)

- ✅ Server health endpoint (`/health`)
- ✅ Server info endpoint (`/`)
- ✅ MCP session initialization
- ✅ Tool discovery (list available tools)
- ✅ Tool execution (HeroUI-specific tools)
- ✅ Session cleanup

### Advanced Tests (test-mcp-advanced.ts)

- ✅ MCP SDK client connection
- ✅ Server capabilities detection
- ✅ Comprehensive tool testing
- ✅ Error handling validation
- ✅ Performance benchmarks
- ✅ Response content validation

## Test Output

The tests provide colored output:
- 🟢 **Green checkmark** - Test passed
- 🔴 **Red X** - Test failed
- 🟡 **Yellow circle** - Test skipped
- 🔵 **Blue text** - Test section headers

## Pre-deployment Checklist

Before deploying to staging or production:

1. **Run local tests**
   ```bash
   pnpm dev  # In terminal 1
   pnpm test:local  # In terminal 2
   ```

2. **Check test results**
   - All critical tests should pass
   - Success rate should be > 95%

3. **Deploy to staging first**
   ```bash
   pnpm deploy:staging
   ```

4. **Test staging environment**
   ```bash
   pnpm test:staging
   ```

5. **If staging tests pass, deploy to production**
   ```bash
   pnpm deploy:production
   ```

6. **Verify production**
   ```bash
   pnpm test:production
   ```

## Troubleshooting

### Common Issues

1. **Connection refused on local**
   - Make sure `pnpm dev` is running
   - Check that port 8787 is not in use

2. **Session ID errors**
   - The server might be restarting
   - Try running the test again

3. **Tool not found**
   - Check if R2 credentials are configured
   - Verify component data is extracted

4. **Timeout errors**
   - Network issues or server overload
   - Try running tests individually

### Debug Mode

For more detailed output, you can modify the test files to add more logging:

```javascript
// In test-mcp-local.js, add after line 15:
const DEBUG = true;

// Then throughout the file:
if (DEBUG) console.log('Debug info:', someData);
```

## CI/CD Integration

These tests can be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Start local server
  run: |
    pnpm dev &
    sleep 5  # Wait for server to start

- name: Run tests
  run: pnpm test:local

- name: Check test results
  if: failure()
  run: echo "Tests failed! Deployment cancelled."
```

## Contributing

When adding new tools or features to the MCP server:

1. Add corresponding test cases in both test files
2. Update this guide if new test categories are added
3. Ensure all tests pass before creating a PR