#!/bin/bash

# AI Dashboard Setup Script
# This script helps set up the development environment

set -e

echo "🚀 AI Dashboard Setup"
echo "===================="

# Check for Node.js
if command -v node &> /dev/null; then
    echo "✓ Node.js found: $(node --version)"
else
    echo "✗ Node.js not found. Please install Node.js 20 or later."
    echo "  Visit: https://nodejs.org/ or use: brew install node"
    exit 1
fi

# Check for npm
if command -v npm &> /dev/null; then
    echo "✓ npm found: $(npm --version)"
else
    echo "✗ npm not found. It should come with Node.js."
    exit 1
fi

# Check for Docker
if command -v docker &> /dev/null; then
    echo "✓ Docker found: $(docker --version)"
else
    echo "⚠ Docker not found. You'll need it for PostgreSQL."
    echo "  Visit: https://www.docker.com/ or use: brew install docker"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
npm run db:generate

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start PostgreSQL:"
echo "   docker compose up -d postgres"
echo ""
echo "2. Push the database schema:"
echo "   npm run db:push"
echo ""
echo "3. Start the development server:"
echo "   npm run dev"
echo ""
echo "4. Open http://localhost:4444"
echo ""
