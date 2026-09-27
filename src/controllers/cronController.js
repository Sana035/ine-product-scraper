const { runScheduledScrape } = require('../services/scrapeService');

/**
 * POST /api/cron/scrape
 * External Cron service trigger endpoint for cron-job.org
 */
async function handleCronScrape(req, res) {
  try {
    const cronSecret = process.env.CRON_SECRET || 'ine_cron_secret_key_2026';
    const requestSecret = req.headers['x-cron-secret'];

    if (requestSecret !== cronSecret) {
      console.warn('[CronController] Unauthorized cron attempt. Invalid x-cron-secret header.');
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid cron secret' });
    }

    console.log('[CronController] Cron trigger received and authenticated. Responding 200 OK immediately...');

    // Return immediate minimal text response to prevent cron-job.org "Failed (output too large)" errors
    res.status(200).type('text').send('OK');

    // Run background scraping asynchronously without blocking response
    setImmediate(() => {
      runScheduledScrape().catch(err => {
        console.error('[CronController] Error executing background scheduled scrape:', err.message);
      });
    });

  } catch (err) {
    console.error('[CronController] Error in cron handler:', err.message);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: 'Internal cron error' });
    }
  }
}

module.exports = { handleCronScrape };
