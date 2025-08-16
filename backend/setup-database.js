const fs = require('fs');
const path = require('path');

// Create .env file with the provided database URL
const envContent = `# Backend Environment Variables

# Server Configuration
NODE_ENV=development
PORT=5000
HOST=0.0.0.0

# Database Configuration - Your Render PostgreSQL Database
DATABASE_URL=postgresql://profilyticsdb_user:Cc2veEKlJ3wVJxMuRbMLe1nVowHMyEvp@dpg-d2g0cj75r7bs73efmku0-a.oregon-postgres.render.com/profilyticsdb

# JWT Configuration
JWT_SECRET=profilytics-super-secret-jwt-key-2024
JWT_EXPIRES_IN=7d

# Frontend URL(s) for CORS
FRONTEND_URL=http://localhost:3000
FRONTEND_URLS=http://localhost:3000

# Email Configuration (Optional - add when you get SendGrid API key)
# SENDGRID_API_KEY=your-sendgrid-api-key-here
# FROM_EMAIL=noreply@profilytics.com

# OpenAI Configuration (Optional - add when you get OpenAI API key)
# OPENAI_API_KEY=your-openai-api-key-here
# OPENAI_MODEL=gpt-4

# AWS S3 Configuration (Optional - for file uploads)
# AWS_ACCESS_KEY_ID=your-aws-access-key-here
# AWS_SECRET_ACCESS_KEY=your-aws-secret-key-here
# AWS_REGION=us-east-1
# AWS_S3_BUCKET=profilytics-uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12
COOKIE_SECRET=profilytics-cookie-secret-2024

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# File Upload (defaults to local storage if AWS not configured)
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png,gif
`;

const envPath = path.join(__dirname, '.env');

try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
    console.log('📁 Location:', envPath);
    console.log('🔗 Database URL configured for your Render PostgreSQL database');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Run: npx prisma db push');
    console.log('2. Run: npm run dev');
    console.log('3. Test: http://localhost:5000/api/health');
} catch (error) {
    console.error('❌ Error creating .env file:', error.message);
}
