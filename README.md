# CSV Parser — Streaming backend + Next.js frontend

A high-performance Node.js service that ingests large CSV files via streaming, aggregates sales per department, and returns a processed CSV to download. It ships with:

- Express 5 (TypeScript, ESM) backend with streaming CSV processing
- Secure API routes using x-api-key
- Background processing with worker threads (safe inline fallback)
- Consistent JSON error responses with optional stack traces
- Jest tests (ESM-compatible) for service and HTTP endpoints
- Next.js 14 frontend with drag-and-drop upload, progress, preview, and download

This README covers how to run it, how the endpoints work, how tests are structured, and how to use the frontend.

## Project structure

```
.
├── backend/                 # Node.js + Express (TypeScript, ESM)
│   ├── src/
│   │   ├── app.ts           # Express app factory and error middleware
│   │   ├── index.ts         # Entrypoint (reads env, starts server)
│   │   ├── routes/csvRoutes.ts
│   │   ├── controllers/     # uploadCsv, downloadCsv
│   │   ├── services/        # csvProcessor (worker + inline fallback)
│   │   ├── middleware/      # apiKeyAuth, multer upload
│   │   └── __tests__/       # Jest API + service tests
│   ├── processed/           # Processed CSV outputs (gitignored)
│   ├── uploads/             # Temp upload storage (gitignored)
│   ├── .env.example         # Backend env template
│   └── jest.config.mjs      # Jest ESM config
├── frontend/                # Next.js 14 app (App Router)
│   ├── app/                 # UI pages and API proxy routes
│   ├── components/          # UI components (shadcn-style), toasts, theme toggle
│   ├── .env.local.example   # Frontend env template
│   └── package.json
└── README.md                # You are here
```

## What it does

Given an input CSV with headers:

- Department Name
- Date
- Number of Sales

The backend streams the CSV and computes per-department totals of “Number of Sales”. It then writes a new CSV in `processed/` with the shape:

```
Department Name,Total Number of Sales
Electronics,250
Clothing,200
```

The API responds with a link to download the processed CSV and metrics like processing time and unique department count.

## Backend

### Requirements

- Node.js 18+ recommended

### Setup

1. Copy environment template and set your API key(s):

```
cp backend/.env.example backend/.env
# Edit backend/.env and set API_KEY or API_KEYS (comma-separated)
```

2. Install dependencies:

```
cd backend
npm install
```

3. Run the server (pick one):

- Production-like:

```
npm run build
node dist/index.js
```

- Dev (ts-node-dev):

```
npx ts-node-dev --respawn --transpile-only src/index.ts
```

By default the server listens on PORT 3001.

### Environment variables (backend)

- PORT: Port to listen on (default 3001)
- API_KEY: Single API key allowed to call the API
- API_KEYS: Comma-separated list of keys allowed to call the API
- DISABLE_WORKER: Set to “true” to force inline processing (workers are auto-disabled in tests)

### API Authentication

All routes are protected with an x-api-key header. Provide one of the configured API keys for every request.

Header:

```
x-api-key: <your_key_here>
```

If keys aren’t configured, the server returns 401 with a JSON error.

### Endpoints

- POST /api/upload

  - Description: Upload a CSV to process. Accepts multipart/form-data with a single field “file”.
  - Auth: Required via x-api-key.
  - Request: multipart/form-data; name=file; value is your .csv file.
  - Response (200):
    - message: string
    - downloadLink: string (absolute URL to GET /api/download/:filename)
    - processingTimeMs: number
    - departmentCount: number
  - Errors: 400 (no file), 401 (unauthorized), 500 (processing error). All errors are JSON with an “error” field and, in non-production, a “stack”.

  Example (curl):

  ```bash
  curl -X POST \
  	-H "x-api-key: $API_KEY" \
  	-F file=@sample.csv \
  	http://localhost:3001/api/upload
  ```

- GET /api/download/:filename

  - Description: Download a previously processed CSV by filename.
  - Auth: Required via x-api-key.
  - Response (200): text/csv with Content-Disposition: attachment.
  - Errors: 400 (invalid filename), 401 (unauthorized), 404 (not found), 500 (read error). All errors are JSON and never sent as attachments.

  Example (curl):

  ```bash
  curl -L \
  	-H "x-api-key: $API_KEY" \
  	-o processed.csv \
  	http://localhost:3001/api/download/<filename>.csv
  ```

### Error behavior

Errors are always JSON of the form:

```json
{ "error": "<message>", "stack": "<stack-if-not-production>" }
```

If an error occurs during download, the server removes any attachment headers to avoid browsers treating an error as a file.

### Background processing

The CSV processing runs in a worker thread by default for responsiveness. If workers aren’t available or fail, it automatically falls back to an inline streaming implementation. To force inline mode (e.g., for debugging):

```
DISABLE_WORKER=true
```

Workers are disabled automatically during tests.

### Tests (backend)

Tests are written with Jest (ESM-compatible) and cover:

- Service-level aggregation logic (`csvProcessor`) using a mocked stream
- API endpoints for upload and download (happy path and errors)

Run tests:

```
cd backend
npm test
```

What they verify:

- POST /api/upload with a valid CSV returns 200 plus metrics and a valid `downloadLink`, and that the processed file is created with correct content.
- POST /api/upload without a file returns 400 JSON error.
- POST /api/upload without x-api-key returns 401 JSON error.
- GET /api/download/:filename for missing files returns 404 JSON error.
- GET /api/download/:filename after a valid upload returns 200 and the correct CSV body.

## Frontend (Next.js 14)

The frontend provides a clean, Vercel-like UI with:

- Drag-and-drop file zone with validation and file name display
- Upload progress with percentage
- Toast notifications
- Preview of the processed CSV (first rows) before download
- Download button and light/dark theme toggle

### Setup

1. Copy env template and point it to your backend:

```
cp frontend/.env.local.example frontend/.env.local
# FRONTEND .env.local
# BACKEND_URL=http://localhost:3001
# BACKEND_API_KEY=<your_backend_key>
```

2. Install and run:

```
cd frontend
npm install
npm run dev
```

Navigate to http://localhost:3000 and upload a CSV. The app will:

1. POST to frontend /api/upload, which proxies to the backend and attaches the server-side x-api-key from .env.local.
2. On success, automatically fetch the processed file via frontend /api/download?filename=..., preview the first rows, and enable Download.

Note: The proxy routes keep your API key on the server; it is never exposed to the browser.

## Sample CSV

```
Department Name,Date,Number of Sales
Electronics,2023-08-01,100
Clothing,2023-08-01,200
Electronics,2023-08-02,150
```

Processed output:

```
Department Name,Total Number of Sales
Electronics,250
Clothing,200
```

## Security notes

- Always set strong, unique API keys via backend .env. Rotate as needed.
- The backend rejects requests without a valid x-api-key.
- Filenames are sanitized to prevent path traversal.
- Errors are delivered as JSON; files are only sent on successful downloads.

## Troubleshooting

- 401 Unauthorized: Ensure x-api-key matches API_KEY or one of API_KEYS on the backend.
- 404 on download: The processed filename may be wrong or expired; ensure you use the `downloadLink` returned by upload.
- “Only .csv files are allowed!”: Ensure the file has a .csv extension and a header row including required columns.
- Worker-related issues: Set `DISABLE_WORKER=true` in backend .env to force inline processing.
- Dev script missing “tsx”: Prefer `npm run build && node dist/index.js` or use `npx ts-node-dev` as shown above.

## Git hygiene

The `processed/` and `uploads/` folders are gitignored to avoid committing actual data. Keep `.env` files out of source control.

## License

MIT (see license headers or add a LICENSE file as appropriate).
