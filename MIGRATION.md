# Migration Guide: Monolith to Separated Frontend & Backend

This document outlines the migration from the original monolithic Next.js application to separated frontend and backend services.

## 🏗️ What Changed

### Directory Structure
```diff
profilytics/
- ├── app/                    # Next.js pages (moved to frontend/)
- ├── components/             # React components (moved to frontend/)
- ├── contexts/               # React contexts (moved to frontend/)
- ├── hooks/                  # React hooks (moved to frontend/)
- ├── lib/                    # Utilities (moved to frontend/)
- ├── public/                 # Static assets (moved to frontend/)
- ├── styles/                 # Global styles (moved to frontend/)
+ ├── frontend/               # Next.js application
+ │   ├── app/               # Next.js App Router
+ │   ├── components/        # UI components
+ │   ├── lib/               # API client & utils
+ │   └── package.json       # Frontend dependencies
+ ├── backend/                # Express.js API server
+ │   ├── routes/            # API endpoints
+ │   ├── middleware/        # Express middleware
+ │   ├── utils/             # Server utilities
+ │   ├── prisma/            # Database schema
+ │   └── package.json       # Backend dependencies
├── backend/                  # Express server (reorganized)
├── prisma/                   # Database (moved to backend/)
├── docker-compose.yml        # Updated for services
+ ├── docker-compose.prod.yml # Production configuration
+ ├── nginx.conf             # Reverse proxy config
├── package.json             # Root workspace config
+ ├── setup.sh               # Setup script
+ └── setup.bat              # Windows setup script
```

### Configuration Changes

#### Frontend (`frontend/`)
- **New `package.json`** with only frontend dependencies
- **Updated `tsconfig.json`** for Next.js
- **Standalone output** enabled for Docker deployment
- **Environment variables** prefixed with `NEXT_PUBLIC_`

#### Backend (`backend/`)
- **New `package.json`** with only backend dependencies
- **Own `tsconfig.json`** for Node.js/Express
- **Prisma schema** moved here
- **Environment variables** for server configuration

#### Root Level
- **Workspace configuration** in `package.json`
- **Concurrently** for running both services
- **Docker compositions** for containerized deployment

## 🔄 API Communication

### Before (Monolith)
- API routes in `pages/api/` or `app/api/`
- Direct database access from React components
- Server-side rendering with database queries

### After (Separated)
- **Express.js API** server on port 5000
- **REST API** communication from frontend
- **API client** (`frontend/lib/api-client.ts`) handles all requests
- **CORS configuration** for cross-origin requests

## 🚀 Deployment Changes

### Development
```bash
# Before
npm run dev  # Started Next.js dev server

# After
npm run dev  # Starts both frontend (3000) and backend (5000)
```

### Production

#### Option 1: Containerized (Recommended)
```bash
# Single command deploys both services
docker-compose -f docker-compose.prod.yml up -d
```

#### Option 2: Separate Deployments
```bash
# Frontend (Vercel/Netlify)
cd frontend && npm run build

# Backend (Railway/Heroku)
cd backend && npm run build && npm start
```

## 🔧 Environment Variables

### Frontend (`.env.local`)
```env
# API endpoint pointing to backend
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### Backend (`.env`)
```env
# Database and server config
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
FRONTEND_URL=http://localhost:3000  # For CORS
```

## 📊 Benefits of Separation

### ✅ Advantages
1. **Independent Scaling**: Scale frontend and backend separately
2. **Technology Flexibility**: Use different tech stacks for each service
3. **Deployment Options**: Deploy to different platforms
4. **Team Collaboration**: Frontend and backend teams can work independently
5. **Microservices Ready**: Easier to split into more services later
6. **Better Caching**: API responses can be cached independently
7. **Mobile App Ready**: Backend API can serve mobile apps

### ⚠️ Considerations
1. **Network Latency**: API calls over network vs. direct function calls
2. **CORS Configuration**: Must configure cross-origin requests
3. **Authentication**: Token-based auth instead of server sessions
4. **Complexity**: More moving parts to manage
5. **Development Setup**: Need to run two services

## 🛠️ Migration Steps Completed

### ✅ 1. Frontend Separation
- [x] Moved all React/Next.js code to `frontend/`
- [x] Created separate `package.json` with frontend dependencies
- [x] Updated `tsconfig.json` for frontend-specific needs
- [x] Configured API client for external backend communication
- [x] Updated imports and paths

### ✅ 2. Backend Reorganization
- [x] Created standalone Express.js server structure
- [x] Moved Prisma schema to backend
- [x] Created separate `package.json` with backend dependencies
- [x] Updated TypeScript configuration for Node.js
- [x] Configured CORS for frontend communication

### ✅ 3. Docker Configuration
- [x] Created separate Dockerfiles for each service
- [x] Updated docker-compose.yml for multi-service setup
- [x] Added production docker-compose configuration
- [x] Created Nginx reverse proxy configuration

### ✅ 4. Deployment Configuration
- [x] Updated Vercel configuration for frontend-only
- [x] Created Railway configuration for backend
- [x] Added environment variable examples
- [x] Created setup scripts for easy initialization

### ✅ 5. Documentation
- [x] Updated main README with new structure
- [x] Created frontend-specific README
- [x] Created backend-specific README
- [x] Documented API endpoints and authentication

## 🚀 Getting Started (Post-Migration)

### Quick Setup
```bash
# Clone and setup
git clone <repository>
cd profilytics
./setup.sh  # Linux/Mac
# or
setup.bat   # Windows
```

### Manual Setup
```bash
# Install all dependencies
npm run install:all

# Setup environment files
cp frontend/env.example frontend/.env.local
cp backend/env.example backend/.env

# Start development
npm run dev
```

### Docker Setup
```bash
# Development
npm run docker:up

# Production
npm run docker:prod
```

## 📝 What Developers Need to Know

### For Frontend Developers
- All API calls now go through the API client
- Environment variables must be prefixed with `NEXT_PUBLIC_`
- No direct database access from components
- Socket.IO client connects to backend server

### For Backend Developers
- All database operations through Prisma
- API endpoints follow RESTful conventions
- JWT authentication with Express middleware
- CORS configured for frontend origins

### For DevOps/Deployment
- Two separate services to deploy
- Frontend can be deployed to static hosting (Vercel, Netlify)
- Backend needs Node.js runtime (Railway, Heroku, AWS)
- Database migrations handled by backend service

## 🔍 Testing the Migration

### Verify Frontend
```bash
cd frontend
npm run dev
# Check http://localhost:3000
```

### Verify Backend
```bash
cd backend
npm run dev
# Check http://localhost:5000/api/health
```

### Verify Full Stack
```bash
npm run dev
# Both services should be running
# Frontend should successfully call backend APIs
```

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `FRONTEND_URL` in backend `.env`
   - Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`

2. **API Not Found**
   - Ensure backend is running on port 5000
   - Check API client base URL configuration

3. **Database Connection**
   - Verify `DATABASE_URL` in backend `.env`
   - Run `npm run db:generate` in backend

4. **Authentication Issues**
   - Ensure `JWT_SECRET` is set in backend
   - Check token storage in frontend API client

5. **Socket.IO Connection**
   - Verify `NEXT_PUBLIC_SOCKET_URL` points to backend
   - Check CORS configuration for WebSocket

## 📞 Support

If you encounter issues during or after migration:
1. Check this migration guide
2. Review the setup scripts and README files
3. Verify environment variable configuration
4. Test each service independently
5. Check the logs for specific error messages

The migration maintains all existing functionality while providing a more scalable and maintainable architecture.
