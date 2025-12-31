# Simple Database Setup Script
# This helps you set up the database step by step

Write-Host "=== Grade 10 LMS Database Setup ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if .env exists
Write-Host "Step 1: Checking .env file..." -ForegroundColor Yellow
if (Test-Path .env) {
    Write-Host "  .env file exists" -ForegroundColor Green
} else {
    Write-Host "  .env file not found!" -ForegroundColor Red
    Write-Host "  Please create .env file first (template was created)" -ForegroundColor Yellow
    exit
}

# Step 2: Instructions for creating database
Write-Host ""
Write-Host "Step 2: Create the database" -ForegroundColor Yellow
Write-Host "  Run this command in a new PowerShell window:" -ForegroundColor White
Write-Host ""
Write-Host "  psql -U postgres" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Then in psql, run:" -ForegroundColor White
Write-Host "  CREATE DATABASE grade10_lms;" -ForegroundColor Cyan
Write-Host "  \q" -ForegroundColor Cyan
Write-Host ""

# Step 3: Run migrations
Write-Host "Step 3: Run database migrations" -ForegroundColor Yellow
Write-Host "  After creating the database, run:" -ForegroundColor White
Write-Host "  npm run migrate" -ForegroundColor Cyan
Write-Host ""

# Step 4: Seed data
Write-Host "Step 4: Seed initial data (optional)" -ForegroundColor Yellow
Write-Host "  To create sample users and data:" -ForegroundColor White
Write-Host "  npm run seed" -ForegroundColor Cyan
Write-Host ""

Write-Host "For detailed instructions, see: DATABASE_SETUP.md" -ForegroundColor Cyan

