# Study Helper - Frontend

SvelteKit frontend application for the Study Helper app with TailwindCSS styling.

## Tech Stack

- **SvelteKit**: Full-stack framework for building web applications
- **TailwindCSS**: Utility-first CSS framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or pnpm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `VITE_API_BASE_URL`: Backend API URL (default: http://localhost:5000)

## Project Structure

```
frontend/
├── src/
│   ├── routes/              # SvelteKit routes
│   │   ├── /                # Landing page
│   │   ├── login/           # Login page
│   │   ├── register/        # Registration page
│   │   ├── dashboard/       # Main dashboard (protected)
│   │   ├── guide/[id]/      # View study guide (protected)
│   │   ├── practice/[sessionId]/ # Practice session (protected)
│   │   └── progress/        # Progress overview (protected)
│   ├── stores/              # Svelte stores
│   │   └── auth.js          # Authentication store
│   ├── lib/                 # Shared utilities
│   │   └── api.js           # API client with JWT handling
│   ├── app.css              # Global styles + Tailwind imports
│   ├── app.html             # HTML template
│   └── app.d.ts             # TypeScript declarations
├── static/                  # Static assets
├── package.json
├── svelte.config.js         # SvelteKit configuration
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
└── tsconfig.json            # TypeScript configuration
```

## Features

### Authentication

- JWT-based authentication with automatic token management
- Protected routes that redirect to login
- Automatic 401 handling with logout

### Routes

- `/` - Landing page with feature overview
- `/login` - User login
- `/register` - New user registration
- `/dashboard` - Study guides overview
- `/guide/[id]` - View guide details and start practice
- `/practice/[sessionId]` - Active practice session with Q&A
- `/progress` - Progress tracking and statistics

### API Integration

- Centralized API client (`lib/api.js`)
- Automatic JWT attachment to requests
- Configurable base URL via environment variables
- Error handling and retry logic

## Deployment

This app can be deployed to Vercel, Netlify, or any static hosting platform that supports SvelteKit.
