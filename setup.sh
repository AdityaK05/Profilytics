#!/bin/bash

echo "🚀 Setting up Profilytics (Separated Frontend & Backend)"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend && npm install
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install
cd ..

# Copy environment files
echo "🔧 Setting up environment files..."

if [ ! -f "frontend/.env.local" ]; then
    cp frontend/env.example frontend/.env.local
    echo "✅ Created frontend/.env.local"
else
    echo "⚠️  frontend/.env.local already exists"
fi

if [ ! -f "backend/.env" ]; then
    cp backend/env.example backend/.env
    echo "✅ Created backend/.env"
else
    echo "⚠️  backend/.env already exists"
fi

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "✅ Docker is available"
    
    # Ask if user wants to start with Docker
    echo ""
    read -p "🐳 Do you want to start the application with Docker? (y/n): " use_docker
    
    if [ "$use_docker" = "y" ] || [ "$use_docker" = "Y" ]; then
        echo "🐳 Starting application with Docker..."
        docker-compose up -d
        echo ""
        echo "🎉 Application started successfully!"
        echo "Frontend: http://localhost:3000"
        echo "Backend API: http://localhost:5000"
        echo "Health Check: http://localhost:5000/api/health"
        echo ""
        echo "To stop: npm run docker:down"
        exit 0
    fi
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. 🔧 Configure your environment variables:"
echo "   - Edit frontend/.env.local (API URLs)"
echo "   - Edit backend/.env (Database, JWT secret, etc.)"
echo ""
echo "2. 🗄️  Set up your database:"
echo "   - Install PostgreSQL"
echo "   - Update DATABASE_URL in backend/.env"
echo "   - Run: npm run db:generate && npm run db:push"
echo ""
echo "3. 🚀 Start the application:"
echo "   - Development: npm run dev"
echo "   - Production: npm run build && npm run start"
echo "   - Docker: npm run docker:up"
echo ""
echo "4. 🌐 Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:5000"
echo "   - API Health: http://localhost:5000/api/health"
echo ""
echo "📚 For more information, check the README.md files in each directory."
echo ""
echo "🎉 Setup completed successfully!"
