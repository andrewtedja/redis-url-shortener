# Frontend - URL Shortener

React + Vite + TypeScript + Tailwind CSS

## Development

```bash
npm run dev
```

Runs on `http://localhost:5173` with proxy to backend on port 3000.

## Build

```bash
npm run build
```

Output: `dist/` folder

## Features

- Clean UI with Tailwind CSS
- Real-time Redis performance metrics
- Click tracking stats
- Rate limit display
- Copy to clipboard
- Form validation

## API Endpoints Used

- `POST /shorten` - Create short URL
- `GET /stats/:code` - Get URL statistics
- `GET /:code` - Redirect (not called from frontend)

## Production

Update `API_BASE` in `src/App.tsx` to your production backend URL.
