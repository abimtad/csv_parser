# CSV Parser Frontend

A minimal, Vercel-inspired Next.js interface to upload and process CSV files against the backend service.

## Features

- Clean, dark UI with shadcn-style components
- Upload CSV and see processing metrics
- Secure download via server-side proxy that attaches the required API key

## Requirements

- Node 18+
- A running backend (default: http://localhost:3001)
- Backend API key

## Setup

Create `.env.local` inside `frontend/`:

```
BACKEND_URL=http://localhost:3001
BACKEND_API_KEY=dev-local-key
```

Install dependencies and run the dev server:

```
npm install
npm run dev
```

Then open http://localhost:3000.

## Notes

- The Next.js API routes (`/api/upload`, `/api/download`) proxy requests to the backend while injecting the API key server-side. This avoids exposing the key to the browser and sidesteps CORS.
- If you change the backend port or host, update `BACKEND_URL` accordingly.
