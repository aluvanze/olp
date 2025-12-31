# Database Setup Check Script
# Run this to verify your database setup

Write-Host "=== Grade 10 LMS Database Setup Check ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
Write-Host "1. Checking .env file..." -ForegroundColor Yellow
if (Test-Path .env) {
    Write-Host "   .env file exists" -ForegroundColor Green
    $envContent = Get-Content .env
    if ($envContent -match "DB_PASSWORD=your_postgres_password_here") {
        Write-Host "   WARNING: Please update DB_PASSWORD in .env file!" -ForegroundColor Red
    } else {
        Write-Host "   .env file appears configured" -ForegroundColor Green
    }
} else {
    Write-Host "   .env file NOT found!" -ForegroundColor Red
    Write-Host "   Please create .env file with database credentials" -ForegroundColor Yellow
}

Write-Host ""

# Check if PostgreSQL is installed
Write-Host "2. Checking PostgreSQL installation..." -ForegroundColor Yellow
try {
    $psqlVersion = psql --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   PostgreSQL is installed: $psqlVersion" -ForegroundColor Green
    } else {
        Write-Host "   PostgreSQL not found in PATH" -ForegroundColor Red
        Write-Host "   Try: 'C:\Program Files\PostgreSQL\16\bin\psql.exe --version'" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   PostgreSQL not found" -ForegroundColor Red
    Write-Host "   Please install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
}

Write-Host ""

# Check if PostgreSQL service is running
Write-Host "3. Checking PostgreSQL service..." -ForegroundColor Yellow
$pgService = Get-Service -Name postgresql* -ErrorAction SilentlyContinue
if ($pgService) {
    if ($pgService.Status -eq 'Running') {
        Write-Host "   PostgreSQL service is running" -ForegroundColor Green
    } else {
        Write-Host "   PostgreSQL service is NOT running" -ForegroundColor Red
        Write-Host "   Start it with: Start-Service postgresql-x64-*" -ForegroundColor Yellow
    }
} else {
    Write-Host "   Could not find PostgreSQL service" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Setup Instructions ===" -ForegroundColor Cyan
Write-Host "1. Install PostgreSQL (if not installed)"
Write-Host "2. Edit .env file with your database credentials"
Write-Host "3. Create database: psql -U postgres -c 'CREATE DATABASE grade10_lms;'"
Write-Host "4. Run migrations: npm run migrate"
Write-Host "5. Seed data (optional): npm run seed"
Write-Host ""
Write-Host "For detailed instructions, see: DATABASE_SETUP.md" -ForegroundColor Cyan
