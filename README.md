# INE Product Price Tracker - React Frontend

High-performance, ultra-polished React dashboard styled with rich dark red (`#580c1f`) and cream white (`#fcfbf7`) aesthetics.

## Features

- **Product Search**: Search INE's storefront catalog by full or partial product name or ID.
- **Variant Tracking**: Select product options (e.g. 2-pack, Starter bundle) and track live price/stock changes.
- **Tracked Product Cards**: Display real-time price, stock badges, timestamp, and scrape outcome status.
- **Interactive Price History**: Visual Recharts area charts & tabular records displaying valid price trends over time.
- **Scrape Logs Modal**: Detailed execution logs showing `success`, `retried`, and `failed` attempts with error tracebacks.
- **CSV Export**: One-click download of complete scrape history formatted for evaluation.
- **Manual Scrape**: Trigger instant Playwright scrape runs on demand.

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables (`.env`):
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. Start Vite dev server:
   ```bash
   npm run dev
   ```
