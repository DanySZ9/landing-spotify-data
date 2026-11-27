# Spotlytics: frontend

The web app for [Spotlytics](../README.md). It handles file uploads, charts,
tables and filters, and builds the share cards, all in the browser.

## Stack

- React + Vite
- Plain CSS
- Plotly (react-plotly.js) for charts
- html-to-image for the share cards

## Getting started

Requires Node.js 20 or newer.

```bash
npm install
npm run dev      # http://localhost:5173
```

The app expects the backend at `http://localhost:8000` (see [`../backend`](../backend)).
To point it at another server, set `VITE_API_URL` in a `.env.local` file.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build in `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Runs ESLint |

## Structure

```
src/
├── App.jsx          Page layout, tabs and upload flow
├── api.js           Calls to the backend
├── components/
│   ├── charts/      One component per chart
│   ├── tables/      Rankings and history
│   └── compartir/   Share cards and their dialog
└── ...              Formatting helpers, filters, FAQ content
```

## Deployment

Deployed on Vercel.
