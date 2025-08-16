const http = require('http');

console.log('🔍 Testing backend connection...');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log('✅ Backend is running!');
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    console.log('');
    console.log('🎉 Database integration successful!');
    console.log('🔗 Backend: http://localhost:5000');
    console.log('🔗 Frontend: http://localhost:3000 (or 3001)');
    console.log('🔗 Health Check: http://localhost:5000/api/health');
  });
});

req.on('error', (error) => {
  console.log('❌ Backend connection failed:', error.message);
  console.log('');
  console.log('💡 Troubleshooting:');
  console.log('1. Make sure the backend server is running: npm run dev');
  console.log('2. Check if the .env file exists in backend/ directory');
  console.log('3. Verify the DATABASE_URL is correct');
  console.log('4. Try running: cd backend && npm run dev');
});

req.end();
