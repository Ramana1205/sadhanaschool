#!/bin/bash

# School Management System - Quick Start Script
# Run this from the project root directory

echo "🎓 School Management System - Starting"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Check if backend node_modules exist
if [ ! -d "backend/node_modules" ]; then
    echo ""
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Check if frontend node_modules exist
if [ ! -d "frontend/node_modules" ]; then
    echo ""
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo ""
echo "========================================"
echo "✅ Setup Complete!"
echo "========================================"
echo ""
echo "Start the services:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Then open:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:5000"
echo "  API Docs: http://localhost:5000/api/health"
echo ""
echo "Test credentials:"
echo "  Username: admin / faculty"
echo "  Password: admin123 / faculty123"
echo ""
echo "📚 Documentation:"
echo "  - SETUP_GUIDE.md - Complete setup guide"
echo "  - API_TESTING.md - API testing commands"
echo "  - backend/README.md - API reference"
echo ""
