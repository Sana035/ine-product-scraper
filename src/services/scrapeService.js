const { scrapeProduct } = require('../scraper/scraper');
const { db } = require('../config/supabase');

/**
 * Scrapes a tracked product with up to 3 attempts, logging each attempt honestly in Supabase PostgreSQL.
 * @param {Object} product - Tracked product record
 * @param {boolean} [headed=false] - Whether to run Chromium in headed mode
 * @returns {Promise<{ success: boolean, attempts: number, price?: number, stock?: string, error?: string }>}
 */
async function scrapeAndSave(product, headed = false) {
  const MAX_ATTEMPTS = 3;
  let previousAttemptsFailed = false;
  let finalResult = null;

  console.log(`[ScrapeService] Starting scrape process for product "${product.product_name}" (ID: ${product.id}, Option: "${product.selected_option}")`);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[ScrapeService] Attempt ${attempt}/${MAX_ATTEMPTS} for product ID ${product.id}...`);

    const result = await scrapeProduct({
      url: product.product_url,
      selectedOption: product.selected_option,
      headed
    });

    if (result.success) {
      // Successful scrape on this attempt
      const outcome = previousAttemptsFailed ? 'retried' : 'success';
      
      console.log(`[ScrapeService] Attempt ${attempt} SUCCEEDED. Price: ₹${result.price}, Stock: "${result.stock}". Outcome logged as "${outcome}".`);

      await db.recordScrapeAttempt({
        tracked_product_id: product.id,
        attempt_number: attempt,
        price: result.price,
        stock: result.stock,
        outcome,
        error_message: null
      });

      return {
        success: true,
        attempts: attempt,
        price: result.price,
        stock: result.stock,
        outcome
      };

    } else {
      // Scrape attempt failed
      previousAttemptsFailed = true;
      const isFinalAttempt = (attempt === MAX_ATTEMPTS);
      const outcome = isFinalAttempt ? 'failed' : 'retried';

      console.warn(`[ScrapeService] Attempt ${attempt} FAILED: ${result.error}. Outcome logged as "${outcome}".`);

      await db.recordScrapeAttempt({
        tracked_product_id: product.id,
        attempt_number: attempt,
        price: null,
        stock: null,
        outcome,
        error_message: result.error || 'Scrape attempt failed'
      });

      finalResult = {
        success: false,
        attempts: attempt,
        error: result.error || 'Failed after max retries',
        outcome
      };

      if (!isFinalAttempt) {
        console.log('[ScrapeService] Waiting 3 seconds before next retry attempt...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  return finalResult;
}

/**
 * Executes scheduled background scraping across all tracked products sequentially.
 */
async function runScheduledScrape() {
  console.log('[ScheduledScrape] Initiating background scheduled scrape job...');
  try {
    const products = await db.getTrackedProducts();
    console.log(`[ScheduledScrape] Found ${products.length} products to scrape.`);

    for (const product of products) {
      try {
        console.log(`[ScheduledScrape] Processing product ID ${product.id}: ${product.product_name}...`);
        await scrapeAndSave(product, false);
      } catch (err) {
        console.error(`[ScheduledScrape] Exception while scraping product ID ${product.id}:`, err.message);
      }
    }

    console.log('[ScheduledScrape] BACKGROUND SCHEDULED SCRAPE COMPLETED SUCCESSFULLY.');
  } catch (err) {
    console.error('[ScheduledScrape] Error fetching tracked products:', err.message);
  }
}

module.exports = { scrapeAndSave, runScheduledScrape };
