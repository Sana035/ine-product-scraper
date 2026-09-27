const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Handles JSON API responses and throws descriptive errors on failure.
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch (e) {}
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Health check
  async getHealth() {
    const res = await fetch(`${API_BASE_URL}/health`);
    return handleResponse(res);
  },

  // Search INE storefront catalog
  async searchCatalog(query) {
    const res = await fetch(`${API_BASE_URL}/catalog/search?q=${encodeURIComponent(query)}`);
    return handleResponse(res);
  },

  // Get all tracked products
  async getTrackedProducts() {
    const res = await fetch(`${API_BASE_URL}/products`);
    return handleResponse(res);
  },

  // Track new product variant
  async trackProduct({ store_product_id, product_name, selected_option, product_url }) {
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_product_id, product_name, selected_option, product_url })
    });
    return handleResponse(res);
  },

  // Delete tracked product
  async deleteProduct(id) {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  // Get price and stock history
  async getProductHistory(id) {
    const res = await fetch(`${API_BASE_URL}/products/${id}/history`);
    return handleResponse(res);
  },

  // Get per-product scrape logs
  async getProductLogs(id) {
    const res = await fetch(`${API_BASE_URL}/products/${id}/logs`);
    return handleResponse(res);
  },

  // Trigger manual scrape
  async triggerManualScrape(id, headed = false) {
    const res = await fetch(`${API_BASE_URL}/products/${id}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headed })
    });
    return handleResponse(res);
  },

  // Get CSV Export Download URL
  getCsvExportUrl() {
    return `${API_BASE_URL}/export/history.csv`;
  }
};
