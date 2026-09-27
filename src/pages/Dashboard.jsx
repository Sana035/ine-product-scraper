import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ProductSearch from '../components/ProductSearch';
import TrackedProductCard from '../components/TrackedProductCard';
import PriceHistory from '../components/PriceHistory';
import ScrapeLog from '../components/ScrapeLog';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { api } from '../services/api';
import { Package, Activity, Layers, Download, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modal states
  const [historyProduct, setHistoryProduct] = useState(null);
  const [logProduct, setLogProduct] = useState(null);

  const fetchTrackedProducts = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const res = await api.getTrackedProducts();
      setProducts(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load tracked products');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrackedProducts(true);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTrackedProducts(false);
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Stop tracking this product option?')) {
      try {
        await api.deleteProduct(id);
        fetchTrackedProducts(false);
      } catch (err) {
        alert(`Failed to delete: ${err.message}`);
      }
    }
  };

  // Metrics calculations
  const totalTracked = products.length;
  const successfulScrapes = products.filter(p => p.last_outcome === 'success' || p.last_outcome === 'retried').length;
  const reliabilityRate = totalTracked > 0 ? Math.round((successfulScrapes / totalTracked) * 100) : 100;

  return (
    <div className="app-container">
      <Navbar onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      <main className="dashboard-main">
        {/* Hero Summary Banner */}
        <section className="hero-banner">
          <div className="hero-content">
            <h1>INE Product Price Tracker</h1>
            <p>
              Automated observability, price history, and stock monitoring for INE's mock storefront using Playwright and Supabase PostgreSQL.
            </p>
          </div>

          <div className="hero-stats">
            <div className="stat-box">
              <div className="stat-value">{totalTracked}</div>
              <div className="stat-label">Tracked Items</div>
            </div>

            <div className="stat-box">
              <div className="stat-value" style={{ color: 'var(--status-success-text)' }}>
                {reliabilityRate}%
              </div>
              <div className="stat-label">Scrape Health</div>
            </div>
          </div>
        </section>

        {/* Catalog Search & Variant Selection */}
        <section>
          <ProductSearch onTrackSuccess={() => fetchTrackedProducts(false)} />
        </section>

        {/* Tracked Products Grid */}
        <section>
          <div className="section-header">
            <h2 className="section-title">
              <Package size={22} className="section-title-icon" /> Tracked Products & Live Prices
            </h2>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--cream-muted)' }}>
                Automated 2-Hour Cron Enabled
              </span>
            </div>
          </div>

          <ErrorMessage message={error} />

          {isLoading ? (
            <Loading message="Fetching tracked products from Supabase..." />
          ) : products.length > 0 ? (
            <div className="tracked-grid">
              {products.map((product) => (
                <TrackedProductCard
                  key={product.id}
                  product={product}
                  onScrapeComplete={() => fetchTrackedProducts(false)}
                  onViewHistory={(p) => setHistoryProduct(p)}
                  onViewLogs={(p) => setLogProduct(p)}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <p style={{ color: 'var(--cream-muted)', fontSize: '1.05rem', marginBottom: '1rem' }}>
                No products are currently being tracked.
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--cream-300)' }}>
                Use the search box above to search for items like "piano" or "router" and select a variant to start tracking.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* History Modal */}
      {historyProduct && (
        <PriceHistory
          product={historyProduct}
          onClose={() => setHistoryProduct(null)}
        />
      )}

      {/* Scrape Log Modal */}
      {logProduct && (
        <ScrapeLog
          product={logProduct}
          onClose={() => setLogProduct(null)}
        />
      )}
    </div>
  );
}
