@echo off
REM School Management System - Quick Start Script (Windows)
REM Run this from the project root directory

echo 🎓 School Management System - Starting
echo ========================================

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

for /f "tokens=*" %%A in ('node --version') do set NODE_VERSION=%%A
for /f "tokens=*" %%A in ('npm --version') do set NPM_VERSION=%%A

echo ✅ Node.js version: %NODE_VERSION%
echo ✅ npm version: %NPM_VERSION%

REM Check if backend node_modules exist
if not exist "backend\node_modules" (
    echo.
    echo 📦 Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

REM Check if frontend node_modules exist
if not exist "frontend\node_modules" (
    echo.
    echo 📦 Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo ========================================
echo ✅ Setup Complete!
echo ========================================
echo.
echo Start the services:
echo   Terminal 1: cd backend ^&^& npm run dev
echo   Terminal 2: cd frontend ^&^& npm run dev
echo.
echo Then open:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo   API Docs: http://localhost:5000/api/health
echo.
echo Test credentials:
echo   Username: admin / faculty
echo   Password: admin123 / faculty123
echo.
echo 📚 Documentation:
echo   - SETUP_GUIDE.md - Complete setup guide
echo   - API_TESTING.md - API testing commands
echo   - backend/README.md - API reference
echo.
pause
