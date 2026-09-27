const { db } = require('../config/supabase');

/**
 * GET /api/export/history.csv
 * Exports the complete scrape history as a downloadable CSV file.
 * Exact Header:
 * store product ID,product name,selected option,timestamp,price,stock,outcome
 */
async function exportCsvHistory(req, res) {
  try {
    const productsWithHistory = await db.getAllScrapeHistory();

    const csvRows = [];
    // Header line
    csvRows.push('store product ID,product name,selected option,timestamp,price,stock,outcome');

    function escapeCsvCell(val) {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    for (const product of productsWithHistory) {
      const historyList = product.scrape_history || [];

      for (const entry of historyList) {
        const storeProductId = escapeCsvCell(product.store_product_id);
        const productName = escapeCsvCell(product.product_name);
        const selectedOption = escapeCsvCell(product.selected_option);
        
        // Ensure ISO 8601 UTC timestamp format
        const timestamp = new Date(entry.scraped_at).toISOString();
        
        // Failed attempts must have empty price & stock
        const price = (entry.price !== null && entry.price !== undefined) ? entry.price : '';
        const stock = entry.stock ? escapeCsvCell(entry.stock) : '';
        const outcome = escapeCsvCell(entry.outcome);

        const row = `${storeProductId},${productName},${selectedOption},${timestamp},${price},${stock},${outcome}`;
        csvRows.push(row);
      }
    }

    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="scrape_history.csv"');
    return res.status(200).send(csvContent);

  } catch (err) {
    console.error('[ExportController] CSV export error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to export CSV history' });
  }
}

module.exports = { exportCsvHistory };
