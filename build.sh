#!/bin/bash

# ScubaCoder Build Script for Unix/Linux/macOS
# This script builds the Vue.js chat panel and copies it to the extension

set -e  # Exit on any error

echo "🚀 Building ScubaCoder Extension..."

# Check if chat-panel-vue directory exists
if [ ! -d "chat-panel-vue" ]; then
    echo "❌ chat-panel-vue directory not found!"
    echo "Please run 'git clone' or ensure the Vue project is in the chat-panel-vue directory"
    exit 1
fi

# Navigate to Vue project and install dependencies if needed
echo "📦 Checking Vue project dependencies..."
cd chat-panel-vue

if [ ! -d "node_modules" ]; then
    echo "Installing Vue project dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Vue dependencies"
        exit 1
    fi
fi

# Build Vue project
echo "🔨 Building Vue.js chat panel..."
npm run build:prod
if [ $? -ne 0 ]; then
    echo "❌ Failed to build Vue project"
    exit 1
fi

# Return to root directory
cd ..

# Create target directory if it doesn't exist
target_dir="src/views/chat-panel-vue"
mkdir -p "$target_dir"
echo "📁 Created target directory: $target_dir"

# Copy built Vue files to extension
echo "📋 Copying Vue build files to extension..."
cp -r chat-panel-vue/dist/* "$target_dir/"

# Verify files were copied
css_file="$target_dir/style.css"
js_file="$target_dir/index.umd.js"

if [ -f "$css_file" ] && [ -f "$js_file" ]; then
    echo "✅ Vue files copied successfully!"
    echo "   - CSS: $css_file"
    echo "   - JS: $js_file"
else
    echo "❌ Failed to copy Vue files"
    exit 1
fi

# Build the extension
echo "🔨 Building VS Code extension..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build extension"
    exit 1
fi

echo "🎉 Build completed successfully!"
echo "You can now run the extension in VS Code"
