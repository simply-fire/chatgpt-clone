#!/bin/bash

# Deployment preparation script for Render.com

echo "🚀 Preparing ChatGPT Clone for Render.com Deployment"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Node.js and npm are installed
echo "📋 Checking prerequisites..."
node --version || { echo "❌ Node.js not found. Please install Node.js"; exit 1; }
npm --version || { echo "❌ npm not found. Please install npm"; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run build test
echo "🔨 Testing production build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ Environment file found"
else
    echo "⚠️  Warning: .env.local not found. Make sure to set environment variables in Render dashboard."
fi

# Git status check
echo "📝 Checking Git status..."
if [ -d ".git" ]; then
    echo "✅ Git repository detected"
    git status --porcelain
    if [ -n "$(git status --porcelain)" ]; then
        echo "📌 You have uncommitted changes. Remember to commit and push before deploying."
    else
        echo "✅ All changes committed"
    fi
else
    echo "⚠️  No Git repository found. You'll need to initialize Git and push to GitHub first."
fi

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Create a new Web Service on Render.com"
echo "3. Connect your GitHub repository"
echo "4. Set environment variables in Render dashboard"
echo "5. Deploy!"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
