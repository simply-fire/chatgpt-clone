# PowerShell deployment preparation script for Render.com

Write-Host "🚀 Preparing ChatGPT Clone for Render.com Deployment" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Check if Node.js and npm are installed
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js" -ForegroundColor Red
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please install npm" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green

# Run build test
Write-Host "🔨 Testing production build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed. Please check the errors above." -ForegroundColor Red
    exit 1
}

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "✅ Environment file found" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: .env.local not found. Make sure to set environment variables in Render dashboard." -ForegroundColor Yellow
}

# Git status check
Write-Host "📝 Checking Git status..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "✅ Git repository detected" -ForegroundColor Green
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "📌 You have uncommitted changes. Remember to commit and push before deploying." -ForegroundColor Yellow
        git status --short
    } else {
        Write-Host "✅ All changes committed" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  No Git repository found. You'll need to initialize Git and push to GitHub first." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Deployment preparation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Push your code to GitHub" -ForegroundColor White
Write-Host "2. Create a new Web Service on Render.com" -ForegroundColor White
Write-Host "3. Connect your GitHub repository" -ForegroundColor White
Write-Host "4. Set environment variables in Render dashboard" -ForegroundColor White
Write-Host "5. Deploy!" -ForegroundColor White
Write-Host ""
Write-Host "📖 See DEPLOYMENT.md for detailed instructions" -ForegroundColor Cyan
