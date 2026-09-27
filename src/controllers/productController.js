const { db } = require('../config/supabase');
const { scrapeAndSave } = require('../services/scrapeService');

/**
 * GET /api/products
 * Returns all tracked products with their latest price, stock, last scraped time, and outcome.
 */
async function getProducts(req, res) {
  try {
    const products = await db.getTrackedProducts();
    
    // Attach latest scrape status for each product
    const productsWithLatest = await Promise.all(
      products.map(async (p) => {
        const history = await db.getScrapeHistory(p.id);
        const latestAttempt = history.length > 0 ? history[history.length - 1] : null;
        
        // Find latest successful attempt for current price display
        const latestSuccess = [...history].reverse().find(h => h.outcome === 'success' || (h.outcome === 'retried' && h.price !== null));

        return {
          ...p,
          current_price: latestSuccess ? latestSuccess.price : null,
          current_stock: latestSuccess ? latestSuccess.stock : null,
          last_scraped_at: latestAttempt ? latestAttempt.scraped_at : null,
          last_outcome: latestAttempt ? latestAttempt.outcome : 'none',
          last_error: latestAttempt ? latestAttempt.error_message : null
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: productsWithLatest.length,
      data: productsWithLatest
    });
  } catch (err) {
    console.error('[ProductController] Error fetching products:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/products
 * Tracks a new product and selected option.
 */
async function trackProduct(req, res) {
  try {
    const { store_product_id, product_name, selected_option, product_url } = req.body;

    if (!store_product_id || !product_name || !selected_option || !product_url) {
      return res.status(400).json({
        success: false,
        error: 'Required fields missing: store_product_id, product_name, selected_option, product_url'
      });
    }

    const newProduct = await db.addTrackedProduct({
      store_product_id,
      product_name,
      selected_option,
      product_url
    });

    // Optionally trigger initial scrape in background for immediate feedback
    scrapeAndSave(newProduct, false).catch(err => {
      console.warn(`[ProductController] Initial background scrape warning: ${err.message}`);
    });

    return res.status(201).json({
      success: true,
      message: 'Product option added to price tracker',
      data: newProduct
    });
  } catch (err) {
    console.error('[ProductController] Error tracking product:', err.message);
    return res.status(400).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/products/:id
 */
async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const product = await db.getTrackedProductById(id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Tracked product not found' });
    }

    const history = await db.getScrapeHistory(product.id);
    const latestAttempt = history.length > 0 ? history[history.length - 1] : null;
    const latestSuccess = [...history].reverse().find(h => h.outcome === 'success' || (h.outcome === 'retried' && h.price !== null));

    return res.status(200).json({
      success: true,
      data: {
        ...product,
        current_price: latestSuccess ? latestSuccess.price : null,
        current_stock: latestSuccess ? latestSuccess.stock : null,
        last_scraped_at: latestAttempt ? latestAttempt.scraped_at : null,
        last_outcome: latestAttempt ? latestAttempt.outcome : 'none'
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * DELETE /api/products/:id
 */
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    await db.deleteTrackedProduct(id);
    return res.status(200).json({ success: true, message: 'Tracked product removed successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/products/:id/history
 * Returns historical price and stock data (only valid price entries for history view).
 */
async function getProductHistory(req, res) {
  try {
    const { id } = req.params;
    const history = await db.getScrapeHistory(id);

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/products/:id/logs
 * Returns full scrape execution logs (including retries, failures, errors).
 */
async function getProductLogs(req, res) {
  try {
    const { id } = req.params;
    const history = await db.getScrapeHistory(id);

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/products/:id/scrape
 * Triggers manual scrape for a specific product.
 */
async function manualScrape(req, res) {
  try {
    const { id } = req.params;
    const product = await db.getTrackedProductById(id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const headed = req.body?.headed === true || req.query?.headed === 'true';

    console.log(`[ProductController] Manual scrape requested for product ID ${id} (headed: ${headed})`);

    const result = await scrapeAndSave(product, headed);

    return res.status(200).json({
      success: result.success,
      data: result
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getProducts,
  trackProduct,
  getProductById,
  deleteProduct,
  getProductHistory,
  getProductLogs,
  manualScrape
};
