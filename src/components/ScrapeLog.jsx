import React, { useEffect, useState } from 'react';
import { History, X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import Loading from './Loading';
import ErrorMessage from './ErrorMessage';

export default function ScrapeLog({ product, onClose }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await api.getProductLogs(product.id);
        setLogs(res.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load scrape logs');
      } finally {
        setIsLoading(false);
      }
    }
    loadLogs();
  }, [product.id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <History size={22} style={{ color: 'var(--gold-accent)' }} />
            <div>
              <h3 className="modal-title">Per-Product Scrape Log</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--cream-muted)' }}>
                {product.product_name} ({product.selected_option})
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {isLoading && <Loading message="Loading scrape logs..." />}
          <ErrorMessage message={error} />

          {!isLoading && !error && (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp (UTC / Local)</th>
                    <th>Attempt</th>
                    <th>Outcome</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Error / Diagnostic Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {new Date(log.scraped_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          <br />
                          <span style={{ fontSize: '0.75rem', color: 'var(--cream-muted)' }}>
                            {new Date(log.scraped_at).toISOString().split('T')[0]}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>Attempt {log.attempt_number}</td>
                        <td>
                          <span className={`badge badge-${log.outcome}`}>
                            {log.outcome}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: log.price ? 'var(--cream-100)' : 'var(--cream-muted)' }}>
                          {log.price !== null && log.price !== undefined ? `₹${Number(log.price).toLocaleString()}` : '—'}
                        </td>
                        <td style={{ color: log.stock ? 'var(--gold-accent)' : 'var(--cream-muted)' }}>
                          {log.stock || '—'}
                        </td>
                        <td style={{ maxWidth: '300px', fontSize: '0.85rem' }}>
                          {log.error_message ? (
                            <div style={{ color: '#e74c3c', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <AlertCircle size={14} style={{ flexShrink: 0 }} />
                              <span>{log.error_message}</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--cream-muted)' }}>None (Clean execution)</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--cream-muted)', padding: '1.5rem' }}>
                        No scrape logs recorded yet for this product.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
