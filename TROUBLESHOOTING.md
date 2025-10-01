# Troubleshooting Guide

This guide helps you resolve common issues when using the HeroUI React MCP server.

## Common Issues

### 🔴 MCP server not found

#### Symptoms
- Error: "MCP server 'heroui' not found"
- Command not recognized when running `npx @heroui/react-mcp`

#### Solutions

1. **Check Node.js version**
   ```bash
   node --version
   ```
   Ensure you have Node.js 18 or higher installed.

2. **Clear npm cache**
   ```bash
   npm cache clean --force
   npx clear-npx-cache
   ```

3. **Try installing globally**
   ```bash
   npm install -g @heroui/react-mcp
   ```
   Then use `heroui-mcp` instead of `npx @heroui/react-mcp`

4. **Verify package availability**
   ```bash
   npm view @heroui/react-mcp version
   ```

### 🔴 Connection timeout or network errors

#### Symptoms
- "Failed to connect to API"
- "Network timeout" errors
- Tools not responding

#### Solutions

1. **Test API connectivity**
   ```bash
   curl https://mcp-api.heroui.com/health
   ```
   Should return: `{"status":"healthy",...}`

2. **Behind a corporate firewall/proxy?**

   Configure npm proxy:
   ```bash
   npm config set proxy http://your-proxy:port
   npm config set https-proxy http://your-proxy:port
   ```

3. **Use a custom API URL** (for local development or proxy)
   ```json
   {
     "mcpServers": {
       "heroui": {
         "command": "npx",
         "args": ["-y", "@heroui/react-mcp"],
         "env": {
           "HEROUI_API_URL": "http://your-custom-url"
         }
       }
     }
   }
   ```

### 🔴 Components not found

#### Symptoms
- "Component not found" errors
- Empty component lists
- Case sensitivity issues (e.g., "button" vs "Button")

#### Solutions

1. **Check available components**
   Ask your AI: "List all HeroUI components"

2. **Use correct component names**
   - Components are case-insensitive now (v1.0.0-alpha.3+)
   - Both "Button" and "button" will work

3. **Verify library parameter**
   - Use `"heroui"` for React components

### 🔴 IDE/Editor specific issues

#### Claude Desktop / Claude Code

**Config location not found:**
- macOS: `~/Library/Application Support/Claude/`
- Windows: `%APPDATA%\Claude\`

Create the directory if it doesn't exist:
```bash
# macOS
mkdir -p ~/Library/Application\ Support/Claude/

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "$env:APPDATA\Claude"
```

#### Cursor

**MCP not showing in Cursor:**
1. Go to Settings → Features → MCP Servers
2. Add the configuration manually
3. Restart Cursor

#### VS Code

**Extension not working:**
1. Ensure you have the MCP extension installed
2. Check VS Code settings JSON (Cmd/Ctrl + Shift + P → "Open Settings JSON")
3. Restart VS Code

### 🔴 Version mismatch

#### Symptoms
- "Version not found" errors
- Old component data

#### Solutions

1. **Update to latest version**
   ```bash
   npm update -g @heroui/react-mcp
   ```

2. **Check current version**
   ```bash
   npx @heroui/react-mcp --version
   ```

3. **Force latest version with npx**
   ```json
   {
     "mcpServers": {
       "heroui": {
         "command": "npx",
         "args": ["-y", "@heroui/react-mcp@latest"]
       }
     }
   }
   ```

## Debug Mode

Enable detailed logging to diagnose issues:

### For Unix/Linux/macOS:
```bash
DEBUG=* npx @heroui/react-mcp
```

### For Windows:
```cmd
set DEBUG=* && npx @heroui/react-mcp
```

### In IDE configuration:
```json
{
  "mcpServers": {
    "heroui": {
      "command": "npx",
      "args": ["-y", "@heroui/react-mcp"],
      "env": {
        "DEBUG": "*"
      }
    }
  }
}
```

## Testing the Installation

### 1. Test via command line
```bash
# Should output version number
npx @heroui/react-mcp --version

# Test API connectivity
curl https://mcp-api.heroui.com/health

# List components via API
curl https://mcp-api.heroui.com/api/components
```

### 2. Test in your AI assistant
Ask these questions to verify it's working:
- "List all HeroUI components"
- "Show me the Button component props"
- "Give me an example of the Card component"

## Platform-Specific Issues

### macOS

**Permission denied errors:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### Windows

**Execution policy errors:**
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Path too long errors:**
Enable long path support in Windows:
```powershell
# Run as Administrator
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

### Linux

**EACCES errors:**
```bash
# Configure npm to use a different directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

## Still Having Issues?

If you're still experiencing problems:

1. **Check existing issues**: [GitHub Issues](https://github.com/heroui-inc/heroui-mcp/issues)
2. **Ask the community**: [Discord Server](https://discord.gg/heroui)
3. **Report a bug**: [Create an issue](https://github.com/heroui-inc/heroui-mcp/issues/new)

When reporting issues, please include:
- Your operating system and version
- Node.js version (`node --version`)
- npm version (`npm --version`)
- IDE/Editor you're using
- Full error message
- Your configuration file content (without sensitive data)

## FAQ

**Q: Can I use this offline?**
A: No, the MCP server requires internet access to fetch component data from the API.

**Q: How often is component data updated?**
A: Component data is updated daily. The MCP always fetches the latest available data.

**Q: Can I use a specific version of HeroUI docs?**
A: Yes, tools support a `version` parameter. Ask your AI to use a specific version like "v3.0.0-alpha.31".

**Q: Is this free to use?**
A: Yes, the HeroUI MCP server is free and open source under the MIT license.

**Q: Can I contribute or run my own instance?**
A: Yes! Check our [CONTRIBUTING.md](https://github.com/heroui-inc/heroui-mcp/blob/main/CONTRIBUTING.md) guide for development setup.
