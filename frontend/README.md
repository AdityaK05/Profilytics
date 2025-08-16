# Profilytics Frontend

Next.js-based frontend for the Profilytics job application platform.

## 🛠️ Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **State Management:** React Context API
- **HTTP Client:** Custom API client with fetch
- **Real-time:** Socket.IO client
- **Forms:** React Hook Form with Zod validation
- **Charts:** Recharts
- **Icons:** Lucide React

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── jobs/              # Job listing pages
│   ├── chat/              # AI chat interface
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (Radix)
│   └── theme-provider.tsx
├── contexts/             # React contexts
│   └── AuthContext.tsx
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── api-client.ts     # API client
│   └── utils.ts          # Utility functions
├── public/               # Static assets
└── styles/               # Global styles
```

## 🔧 Configuration

### Environment Variables

Create `.env.local` with:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Optional: Analytics
NEXT_PUBLIC_GA_TRACKING_ID=
NEXT_PUBLIC_MIXPANEL_TOKEN=
```

### API Client

The frontend uses a custom API client (`lib/api-client.ts`) that:
- Handles authentication with JWT tokens
- Provides type-safe API methods
- Manages localStorage for token persistence
- Includes error handling and request interceptors

## 🎨 UI Components

Built with Radix UI primitives and Tailwind CSS:
- Responsive design
- Dark/light theme support
- Accessible components
- Consistent design system

Key components:
- Authentication forms
- Job search and filtering
- Application management
- Real-time chat interface
- Analytics dashboards

## 🔐 Authentication

The frontend handles authentication through:
- JWT token storage in localStorage
- Protected routes with auth context
- Automatic token refresh
- Role-based access control (Student/Employer)

## 📊 Features

### For Students:
- Profile management
- Job search and filtering
- AI-powered job recommendations
- Application tracking
- Skills and experience management
- AI career chat assistant

### For Employers:
- Company profile setup
- Job posting and management
- Application review
- Candidate search
- Analytics dashboard

## 🚀 Building & Deployment

### Development Build
```bash
npm run build
npm run start
```

### Docker Build
```bash
docker build -t profilytics-frontend .
docker run -p 3000:3000 profilytics-frontend
```

### Deployment Options

**Vercel (Recommended):**
1. Connect GitHub repository
2. Set framework preset to "Next.js"
3. Configure environment variables
4. Deploy automatically on push

**Netlify:**
1. Build command: `npm run build`
2. Publish directory: `.next`
3. Set environment variables

**Custom Server:**
1. Build the application: `npm run build`
2. Start with: `npm run start`
3. Serve on port 3000

## 🧪 Development

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Code Quality
- ESLint for code linting
- TypeScript for type safety
- Prettier for code formatting (recommended)

## 🔗 API Integration

The frontend communicates with the backend API for:
- User authentication and management
- Job listings and search
- Application submissions
- File uploads
- Real-time chat with Socket.IO
- Analytics data

All API interactions are typed and handled through the centralized API client.

## 🎯 Performance

- Server-side rendering with Next.js
- Automatic code splitting
- Image optimization
- Static asset caching
- Bundle size optimization

## 🤝 Contributing

1. Follow the existing code style
2. Use TypeScript for all new code
3. Ensure components are accessible
4. Test on both desktop and mobile
5. Update types when adding new API endpoints

## 📝 Notes

- The frontend is designed to work with the separate backend API
- All API endpoints expect the backend to be running on port 5000
- Socket.IO is used for real-time features like chat and notifications
- The application supports both student and employer user types
