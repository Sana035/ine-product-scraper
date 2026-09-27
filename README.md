# INE Product Price Tracker - Backend API & Playwright Scraper

Production-ready Node.js & Express backend for the INE Product Price Tracker assignment. Features robust web scraping using Playwright, automated retries, honest history logging, Supabase PostgreSQL persistence, CSV export, and external cron integration.

## Features

- **Playwright Scraping Engine**: Automated browser interaction handling dynamic rendering, cookie popups, option chip selection, and gesture-based offer unlocking.
- **Retry Mechanism**: Up to 3 attempts with 3-second delays on failures or quote API HTTP 500 errors.
- **Honest History Logging**: Failed attempts record `price = NULL` and `stock = NULL` without fabricating data.
- **Supabase PostgreSQL**: Persistent storage with RLS policies and connection fallbacks for local dev.
- **Cron Service Integration**: Endpoint `POST /api/cron/scrape` protected with `x-cron-secret` returning an immediate `200 OK` to prevent cron-job.org payload size timeouts.
- **CSV Export**: `GET /api/export/history.csv` providing ISO 8601 UTC timestamps and complete scrape logs.

## Setup & Running Locally

1. Install dependencies:
   ```bash
   npm install
   npx playwright install chromium
   ```

2. Configure environment variables (`.env`):
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SECRET_KEY=your_supabase_secret_key
   CRON_SECRET=ine_cron_secret_key_2026
   PORT=5000
   HEADLESS=true
   ```

3. Run verification test suite:
   ```bash
   npm run test
   ```

4. Start development server:
   ```bash
   npm run dev
   # or
   npm start
   ```

## API Endpoints

- `GET /api/health`: Health check
- `GET /api/catalog/search?q=<query>`: Search INE storefront catalog
- `GET /api/products`: Get all tracked products
- `POST /api/products`: Track a new product variant
- `GET /api/products/:id`: Get product details
- `DELETE /api/products/:id`: Stop tracking product
- `GET /api/products/:id/history`: Get price history
- `GET /api/products/:id/logs`: Get detailed scrape logs
- `POST /api/products/:id/scrape`: Trigger manual scrape
- `GET /api/export/history.csv`: Export full CSV history
- `POST /api/cron/scrape`: Trigger background cron scrape
