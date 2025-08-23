# ScubaCoder Build Guide

This guide explains how to build the ScubaCoder VS Code extension with the integrated Vue.js chat panel.

## Prerequisites

- Node.js 16+ and npm
- TypeScript 5.0+
- VS Code Extension Development Host

## Project Structure

```
scubacoder/
├── src/                          # Extension source code
│   ├── views/
│   │   ├── chatPanel.ts         # Main chat panel logic
│   │   └── chat-panel-vue/      # Vue.js app files (built)
├── chat-panel-vue/              # Vue.js chat panel source
│   ├── src/                     # Vue components and logic
│   ├── dist/                    # Built Vue app (generated)
│   └── package.json            # Vue project dependencies
├── build.ps1                    # Windows build script
├── build.sh                     # Unix/Linux/macOS build script
└── package.json                 # Extension package.json
```

## Build Process

The build process involves two main steps:
1. Building the Vue.js chat panel
2. Building the VS Code extension

### Option 1: Using NPM Scripts (Recommended)

```bash
# Build everything in one command
npm run build:full

# Or step by step:
npm run build:vue      # Build Vue.js app
npm run copy-vue       # Copy Vue files to extension
npm run build          # Build the extension
```

### Option 2: Using Build Scripts

#### Windows (PowerShell)
```powershell
# Run the PowerShell build script
.\build.ps1
```

#### Unix/Linux/macOS
```bash
# Make script executable (first time only)
chmod +x build.sh

# Run the bash build script
./build.sh
```

### Option 3: Manual Build

```bash
# 1. Build Vue.js app
cd chat-panel-vue
npm install
npm run build:prod
cd ..

# 2. Copy Vue files to extension
mkdir -p src/views/chat-panel-vue
cp -r chat-panel-vue/dist/* src/views/chat-panel-vue/

# 3. Build extension
npm run build
```

## Available NPM Scripts

| Script | Description |
|--------|-------------|
| `build:vue` | Builds the Vue.js chat panel |
| `copy-vue` | Copies built Vue files to extension |
| `build:full` | Complete build (Vue + Extension) |
| `build` | Builds the VS Code extension |
| `watch` | Watches for changes and rebuilds |
| `dev` | Development mode with auto-rebuild |

## Development Workflow

### 1. Initial Setup
```bash
# Install extension dependencies
npm install

# Install Vue project dependencies
cd chat-panel-vue
npm install
cd ..
```

### 2. Development Mode
```bash
# Start development mode (auto-rebuilds on changes)
npm run dev
```

### 3. Production Build
```bash
# Build for production
npm run build:full
```

## Troubleshooting

### Vue Build Issues
- Ensure you're in the `chat-panel-vue` directory when running Vue commands
- Check that all Vue dependencies are installed (`npm install`)
- Verify Node.js version compatibility

### File Copy Issues
- Ensure the `src/views/chat-panel-vue` directory exists
- Check file permissions on Unix systems
- Verify that Vue build completed successfully

### Extension Build Issues
- Ensure TypeScript is installed globally or locally
- Check that all extension dependencies are installed
- Verify the Vue files were copied correctly

## File Dependencies

The extension requires these Vue.js files to be present in `src/views/chat-panel-vue/`:
- `index.umd.js` - Main Vue application
- `style.css` - Compiled styles
- `index.mjs` - ES module version (optional)

## Integration Points

The Vue.js app integrates with the extension through:
1. **Static File Loading**: CSS and JS files loaded via WebView URIs
2. **Message Protocol**: Bidirectional communication using `postMessage`
3. **State Management**: Initial data passed through HTML template
4. **Asset Serving**: Files served from extension's local resources

## Building for Distribution

When packaging the extension for distribution:
```bash
# Build everything
npm run build:full

# Package the extension
npm run package
```

This ensures the Vue.js chat panel is properly built and included in the extension package.

## Continuous Integration

For CI/CD pipelines, use the `build:full` script:
```yaml
# Example GitHub Actions step
- name: Build Extension
  run: npm run build:full
```

This will build both the Vue.js app and the extension in the correct order.
