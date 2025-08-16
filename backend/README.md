# Profilytics Backend

Express.js-based API server for the Profilytics job application platform.

## 🛠️ Tech Stack

- **Framework:** Express.js with TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT with bcrypt
- **Real-time:** Socket.IO
- **File Upload:** AWS S3 (configurable)
- **Email:** SendGrid
- **AI Integration:** OpenAI GPT-4
- **Security:** Helmet, CORS, Rate limiting
- **Logging:** Winston
- **Testing:** Jest with Supertest

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```

3. **Set up database:**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   Server runs on [http://localhost:5000](http://localhost:5000)

## 📁 Project Structure

```
backend/
├── dist/                  # Compiled JavaScript (generated)
├── middleware/            # Express middleware
│   ├── auth.ts           # JWT authentication
│   └── errorHandler.ts   # Global error handling
├── routes/               # API route handlers
│   ├── auth.ts           # Authentication endpoints
│   ├── users.ts          # User management
│   ├── jobs.ts           # Job listings
│   ├── applications.ts   # Job applications
│   ├── chat.ts           # AI chat endpoints
│   ├── analytics.ts      # Analytics endpoints
│   └── upload.ts         # File upload endpoints
├── utils/                # Utility functions
│   └── logger.ts         # Winston logger configuration
├── prisma/               # Database schema and migrations
│   └── schema.prisma     # Prisma schema
├── server.ts             # Main server file
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## 🔧 Configuration

### Environment Variables

Create `.env` with:

```env
# Server
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/profilytics

# Authentication
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/profilytics

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@yourdomain.com

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-bucket-name

# Frontend URLs for CORS
FRONTEND_URL=http://localhost:3000
```

### Database Setup

The backend uses Prisma ORM with PostgreSQL:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Run migrations (production)
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

## 🔐 API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /me` - Get current user
- `PATCH /profile` - Update user profile
- `POST /student-profile` - Create student profile
- `POST /employer-profile` - Create employer profile

### Users (`/api/users`) *[Protected]*
- `GET /profile` - Get user profile
- `PATCH /profile` - Update profile
- `POST /skills` - Add skill
- `PATCH /skills/:id` - Update skill
- `DELETE /skills/:id` - Delete skill
- `POST /experiences` - Add experience
- `PATCH /experiences/:id` - Update experience
- `DELETE /experiences/:id` - Delete experience
- `POST /projects` - Add project
- `PATCH /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Jobs (`/api/jobs`)
- `GET /` - List jobs (with filters)
- `GET /:id` - Get job details
- `POST /` - Create job *[Employer only]*
- `PATCH /:id` - Update job *[Employer only]*
- `DELETE /:id` - Delete job *[Employer only]*
- `GET /recommendations` - Get AI recommendations *[Student only]*

### Applications (`/api/applications`) *[Protected]*
- `GET /` - List applications
- `GET /:id` - Get application details
- `POST /` - Submit application *[Student only]*
- `PATCH /:id/status` - Update status *[Employer only]*
- `PATCH /:id/withdraw` - Withdraw application *[Student only]*

### Chat (`/api/chat`) *[Protected]*
- `POST /message` - Send message to AI
- `GET /history` - Get chat history
- `DELETE /history` - Clear chat history
- `GET /insights` - Get career insights

### Analytics (`/api/analytics`) *[Protected]*
- `GET /student/dashboard` - Student analytics
- `GET /employer/dashboard` - Employer analytics
- `POST /track` - Track event

### Upload (`/api/upload`) *[Protected]*
- `POST /avatar` - Upload profile picture
- `POST /resume` - Upload resume
- `POST /logo` - Upload company logo
- `POST /project-image` - Upload project image
- `POST /verification` - Upload verification document

### Utility
- `GET /api/health` - Health check endpoint

## 🔒 Security Features

- **JWT Authentication:** Secure token-based auth
- **CORS:** Configurable cross-origin requests
- **Rate Limiting:** Prevent API abuse
- **Helmet:** Security headers
- **Input Validation:** Express-validator
- **Password Hashing:** bcrypt
- **SQL Injection Prevention:** Prisma ORM

## 🚀 Building & Deployment

### Development
```bash
npm run dev          # Start with nodemon
```

### Production Build
```bash
npm run build        # Compile TypeScript
npm run start        # Start production server
```

### Docker Build
```bash
docker build -t profilytics-backend .
docker run -p 5000:5000 profilytics-backend
```

### Deployment Options

**Railway (Recommended):**
1. Connect GitHub repository
2. Select backend folder as root
3. Add environment variables
4. Deploy automatically

**Heroku:**
```bash
# Add buildpack for Node.js
heroku buildpacks:set heroku/nodejs

# Set start command
heroku config:set NPM_CONFIG_PRODUCTION=false
```

**Digital Ocean/AWS:**
1. Set up a Ubuntu server
2. Install Node.js and PM2
3. Clone repository and build
4. Use PM2 for process management

## 🧪 Testing

```bash
npm test              # Run Jest tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Test Structure
- Unit tests for utility functions
- Integration tests for API endpoints
- Database tests with test database
- Authentication flow tests

## 📊 Monitoring & Logging

- **Winston Logger:** Structured logging to files and console
- **Morgan:** HTTP request logging
- **Health Check:** `/api/health` endpoint for monitoring
- **Error Handling:** Centralized error middleware

## 🤖 AI Features

- **OpenAI Integration:** GPT-4 for career advice
- **Job Matching:** AI-powered job recommendations
- **Profile Analysis:** Smart skill gap analysis
- **Chat Assistant:** Interactive career guidance

## 📈 Performance

- **Connection Pooling:** Optimized database connections
- **Caching:** Redis integration ready
- **Compression:** Gzip compression enabled
- **Rate Limiting:** Prevents API abuse

## 🔄 Real-time Features

Socket.IO implementation for:
- Live chat notifications
- Application status updates
- Real-time job alerts
- System notifications

## 📝 Database Schema

Key entities:
- **Users:** Authentication and basic info
- **StudentProfile:** Student-specific data
- **EmployerProfile:** Company information
- **Jobs:** Job postings
- **Applications:** Job applications
- **Skills/Experiences/Projects:** Profile components
- **ChatMessages:** AI chat history

## 🤝 Contributing

1. Follow TypeScript best practices
2. Add tests for new endpoints
3. Update API documentation
4. Ensure proper error handling
5. Test with both user roles

## 🔧 Troubleshooting

**Common Issues:**
- Database connection: Check DATABASE_URL
- CORS errors: Verify FRONTEND_URL setting
- JWT errors: Ensure JWT_SECRET is set
- File uploads: Configure AWS credentials

**Debug Mode:**
```bash
DEBUG=* npm run dev
```

## 📝 Notes

- All endpoints return consistent JSON responses
- File uploads default to local storage if AWS S3 not configured
- Rate limiting is configurable per endpoint
- WebSocket connections require authentication
- Database migrations should be run in production
