import React, { useState } from 'react';
import { RefreshCw, TrendingUp, History, Trash2, ExternalLink, Clock } from 'lucide-react';
import { api } from '../services/api';

export default function TrackedProductCard({
  product,
  onScrapeComplete,
  onViewHistory,
  onViewLogs,
  onDelete
}) {
  const [isScraping, setIsScraping] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleManualScrape = async () => {
    setIsScraping(true);
    setErrorMsg(null);

    try {
      await api.triggerManualScrape(product.id, false);
      if (onScrapeComplete) onScrapeComplete();
    } catch (err) {
      setErrorMsg(err.message || 'Scrape failed');
    } finally {
      setIsScraping(false);
    }
  };

  const getOutcomeBadgeClass = (outcome) => {
    switch (outcome) {
      case 'success': return 'badge-success';
      case 'retried': return 'badge-retried';
      case 'failed': return 'badge-failed';
      default: return 'badge-secondary';
    }
  };

  return (
    <div className="card">
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
          <span className={`badge ${getOutcomeBadgeClass(product.last_outcome)}`}>
            {product.last_outcome || 'pending'}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <a href={product.product_url} target="_blank" rel="noreferrer" title="Open Store URL" style={{ color: 'var(--cream-muted)' }}>
              <ExternalLink size={16} />
            </a>
            <button
              onClick={() => onDelete(product.id)}
              style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}
              title="Stop tracking product"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <h3 style={{ fontSize: '1.2rem', color: 'var(--cream-100)', fontWeight: 700, marginBottom: '0.2rem' }}>
          {product.product_name}
        </h3>

        <p style={{ fontSize: '0.85rem', color: 'var(--gold-accent)', fontWeight: 600, marginBottom: '0.85rem' }}>
          ID #{product.store_product_id} · Option: {product.selected_option}
        </p>

        {/* Price & Stock Display */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border-light)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--cream-muted)', display: 'block', textTransform: 'uppercase' }}>
              Current Price
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: product.current_price ? 'var(--cream-100)' : 'var(--cream-muted)' }}>
              {product.current_price !== null && product.current_price !== undefined ? `₹${product.current_price.toLocaleString()}` : '—'}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--cream-muted)', display: 'block', textTransform: 'uppercase' }}>
              Stock Status
            </span>
            <span style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: product.current_stock ? 'var(--gold-accent)' : 'var(--cream-muted)'
            }}>
              {product.current_stock || '—'}
            </span>
          </div>
        </div>

        {/* Last scrape info */}
        <div style={{ fontSize: '0.8rem', color: 'var(--cream-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
          <Clock size={14} />
          <span>
            Last Scrape: {product.last_scraped_at ? new Date(product.last_scraped_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
          </span>
        </div>

        {errorMsg && (
          <p style={{ fontSize: '0.8rem', color: '#e74c3c', marginBottom: '0.5rem' }}>
            {errorMsg}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        <button
          className="btn btn-secondary btn-sm"
          style={{ flex: 1 }}
          onClick={handleManualScrape}
          disabled={isScraping}
        >
          <RefreshCw size={14} className={isScraping ? 'loading-spinner' : ''} />
          {isScraping ? 'Scraping...' : 'Scrape Now'}
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onViewHistory(product)}
          title="View Price & Stock History"
        >
          <TrendingUp size={14} />
          History
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onViewLogs(product)}
          title="View Per-Product Scrape Logs"
        >
          <History size={14} />
          Logs
        </button>
      </div>
    </div>
  );
}
