const MOCK_BASE_URL = 'https://demo.inelabteamdev.com';

/**
 * Searches the INE mock storefront catalog.
 * GET /api/catalog/search?q=<query>
 */
async function searchCatalog(req, res) {
  try {
    const query = req.query.q ? req.query.q.trim() : '';

    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query parameter "q" is required' });
    }

    const matchedProducts = [];

    // 1. Direct product ID search if query is numeric
    if (/^\d+$/.test(query)) {
      try {
        const itemRes = await fetch(`${MOCK_BASE_URL}/api/v2/items/${query}`);
        if (itemRes.ok) {
          const item = await itemRes.json();
          matchedProducts.push({
            id: item.id,
            store_product_id: String(item.id),
            product_name: item.name,
            brand: item.brand,
            category: item.category,
            product_url: `${MOCK_BASE_URL}/item/${item.id}`,
            optionAxis: item.optionAxis || 'Option',
            options: item.options || []
          });
        }
      } catch (e) {
        console.warn(`[CatalogController] Direct item fetch failed for ID ${query}: ${e.message}`);
      }
    }

    // 2. Listing search across catalog
    if (matchedProducts.length === 0) {
      const pageRequests = [1, 2, 3, 4, 5].map(p =>
        fetch(`${MOCK_BASE_URL}/api/v2/listings?page=${p}&limit=60`)
          .then(r => r.ok ? r.json() : { results: [] })
          .catch(() => ({ results: [] }))
      );

      const pages = await Promise.all(pageRequests);
      const allListings = pages.flatMap(p => p.results || []);

      const lowerQuery = query.toLowerCase();
      const filtered = allListings.filter(item =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.brand?.toLowerCase().includes(lowerQuery) ||
        item.category?.toLowerCase().includes(lowerQuery) ||
        String(item.id).includes(lowerQuery)
      ).slice(0, 15);

      // Fetch options for matched items
      const detailedItems = await Promise.all(
        filtered.map(async (item) => {
          try {
            const detailRes = await fetch(`${MOCK_BASE_URL}/api/v2/items/${item.id}`);
            if (detailRes.ok) {
              const fullItem = await detailRes.json();
              return {
                id: fullItem.id,
                store_product_id: String(fullItem.id),
                product_name: fullItem.name,
                brand: fullItem.brand,
                category: fullItem.category,
                product_url: `${MOCK_BASE_URL}/item/${fullItem.id}`,
                optionAxis: fullItem.optionAxis || 'Option',
                options: fullItem.options || []
              };
            }
          } catch (e) {}
          return {
            id: item.id,
            store_product_id: String(item.id),
            product_name: item.name,
            brand: item.brand,
            category: item.category,
            product_url: `${MOCK_BASE_URL}/item/${item.id}`,
            optionAxis: 'Option',
            options: [{ id: 'opt1', label: 'Default' }]
          };
        })
      );

      matchedProducts.push(...detailedItems);
    }

    return res.status(200).json({
      success: true,
      query,
      count: matchedProducts.length,
      results: matchedProducts
    });

  } catch (err) {
    console.error('[CatalogController] Error searching catalog:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to search catalog' });
  }
}

module.exports = { searchCatalog };
