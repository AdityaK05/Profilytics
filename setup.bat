@echo off
echo 🚀 Setting up Profilytics (Separated Frontend ^& Backend)
echo ==================================================

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install root dependencies
echo 📦 Installing root dependencies...
call npm install

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend
call npm install
cd ..

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install
cd ..

REM Copy environment files
echo 🔧 Setting up environment files...

if not exist "frontend\.env.local" (
    copy "frontend\env.example" "frontend\.env.local"
    echo ✅ Created frontend\.env.local
) else (
    echo ⚠️  frontend\.env.local already exists
)

if not exist "backend\.env" (
    copy "backend\env.example" "backend\.env"
    echo ✅ Created backend\.env
) else (
    echo ⚠️  backend\.env already exists
)

REM Check if Docker is available
where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Docker is available
    echo.
    set /p use_docker="🐳 Do you want to start the application with Docker? (y/n): "
    
    if /i "%use_docker%"=="y" (
        echo 🐳 Starting application with Docker...
        docker-compose up -d
        echo.
        echo 🎉 Application started successfully!
        echo Frontend: http://localhost:3000
        echo Backend API: http://localhost:5000
        echo Health Check: http://localhost:5000/api/health
        echo.
        echo To stop: npm run docker:down
        pause
        exit /b 0
    )
)

echo.
echo 📋 Next Steps:
echo ==============
echo 1. 🔧 Configure your environment variables:
echo    - Edit frontend\.env.local (API URLs)
echo    - Edit backend\.env (Database, JWT secret, etc.)
echo.
echo 2. 🗄️  Set up your database:
echo    - Install PostgreSQL
echo    - Update DATABASE_URL in backend\.env
echo    - Run: npm run db:generate ^&^& npm run db:push
echo.
echo 3. 🚀 Start the application:
echo    - Development: npm run dev
echo    - Production: npm run build ^&^& npm run start
echo    - Docker: npm run docker:up
echo.
echo 4. 🌐 Access the application:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:5000
echo    - API Health: http://localhost:5000/api/health
echo.
echo 📚 For more information, check the README.md files in each directory.
echo.
echo 🎉 Setup completed successfully!
pause
