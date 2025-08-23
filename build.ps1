# ScubaCoder Build Script for Windows
# This script builds the Vue.js chat panel and copies it to the extension

Write-Host "🚀 Building ScubaCoder Extension..." -ForegroundColor Green

# Check if chat-panel-vue directory exists
if (-not (Test-Path "chat-panel-vue")) {
    Write-Host "❌ chat-panel-vue directory not found!" -ForegroundColor Red
    Write-Host "Please run 'git clone' or ensure the Vue project is in the chat-panel-vue directory" -ForegroundColor Yellow
    exit 1
}

# Navigate to Vue project and install dependencies if needed
Write-Host "📦 Checking Vue project dependencies..." -ForegroundColor Blue
Set-Location "chat-panel-vue"

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing Vue project dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Vue dependencies" -ForegroundColor Red
        exit 1
    }
}

# Build Vue project
Write-Host "🔨 Building Vue.js chat panel..." -ForegroundColor Blue
npm run build:prod
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build Vue project" -ForegroundColor Red
    exit 1
}

# Return to root directory
Set-Location ".."

# Create target directory if it doesn't exist
$targetDir = "src/views/chat-panel-vue"
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Write-Host "📁 Created target directory: $targetDir" -ForegroundColor Green
}

# Copy built Vue files to extension
Write-Host "📋 Copying Vue build files to extension..." -ForegroundColor Blue
Copy-Item -Path "chat-panel-vue/dist/*" -Destination $targetDir -Recurse -Force

# Verify files were copied
$cssFile = Join-Path $targetDir "style.css"
$jsFile = Join-Path $targetDir "index.umd.js"

if ((Test-Path $cssFile) -and (Test-Path $jsFile)) {
    Write-Host "✅ Vue files copied successfully!" -ForegroundColor Green
    Write-Host "   - CSS: $cssFile" -ForegroundColor Gray
    Write-Host "   - JS: $jsFile" -ForegroundColor Gray
} else {
    Write-Host "❌ Failed to copy Vue files" -ForegroundColor Red
    exit 1
}

# Build the extension
Write-Host "🔨 Building VS Code extension..." -ForegroundColor Blue
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build extension" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Build completed successfully!" -ForegroundColor Green
Write-Host "You can now run the extension in VS Code" -ForegroundColor Blue
