#!/bin/sh
set -e

echo "🚀 Starting Profilytics..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
until npx prisma db push --accept-data-loss 2>/dev/null; do
  echo "Database not ready, waiting..."
  sleep 2
done

echo "✅ Database connected successfully!"

# Generate Prisma client (in case it's not already generated)
echo "🔧 Generating Prisma client..."
npx prisma generate

# Start backend in background
echo "🔧 Starting backend server..."
cd /app && node backend/server.js &
BACKEND_PID=$!

# Start frontend
echo "🌐 Starting frontend server..."
exec node server.js 