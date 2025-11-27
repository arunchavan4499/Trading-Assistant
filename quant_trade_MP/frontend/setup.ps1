# Frontend Installation & Startup Script
# Run this from the frontend directory

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Quant Trading Frontend Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if package.json exists
if (!(Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Are you in the frontend directory?" -ForegroundColor Red
    exit 1
}

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm installation
try {
    $npmVersion = npm --version
    Write-Host "✓ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found. Please install Node.js with npm." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Write-Host "(This may take 2-3 minutes)" -ForegroundColor Gray
Write-Host ""

# Install dependencies
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "✗ Installation failed. Try running: npm cache clean --force" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
Write-Host ""

# Create .env file if it doesn't exist
if (!(Test-Path ".env")) {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✓ .env file created" -ForegroundColor Green
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Ensure backend is running on http://localhost:8000" -ForegroundColor White
Write-Host "2. Run: npm run dev" -ForegroundColor White
Write-Host "3. Open: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Yellow
Write-Host ""

# Start dev server
npm run dev
