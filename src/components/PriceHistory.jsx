import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, X } from 'lucide-react';
import { api } from '../services/api';
import Loading from './Loading';
import ErrorMessage from './ErrorMessage';

export default function PriceHistory({ product, onClose }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await api.getProductHistory(product.id);
        setHistory(res.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load price history');
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, [product.id]);

  // Filter valid price data points for line chart
  const chartData = history
    .filter(item => item.price !== null && item.price !== undefined)
    .map(item => ({
      timestamp: new Date(item.scraped_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: Number(item.price),
      stock: item.stock
    }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <TrendingUp size={22} style={{ color: 'var(--gold-accent)' }} />
            <div>
              <h3 className="modal-title">{product.product_name}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--cream-muted)' }}>
                Option: {product.selected_option} · Product ID: {product.store_product_id}
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {isLoading && <Loading message="Loading price history..." />}
          <ErrorMessage message={error} />

          {!isLoading && !error && (
            <>
              {/* Visual Area Chart */}
              {chartData.length > 0 ? (
                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--gold-accent)', marginBottom: '1rem', fontWeight: 600 }}>
                    Price Trend (₹)
                  </h4>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#d4af37" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="timestamp" stroke="var(--cream-muted)" fontSize={12} />
                        <YAxis stroke="var(--cream-muted)" fontSize={12} domain={['dataMin - 1000', 'dataMax + 1000']} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-gold)', color: 'var(--cream-100)' }}
                          formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Price']}
                        />
                        <Area type="monotone" dataKey="price" stroke="#d4af37" strokeWidth={3} fillOpacity={1} fill="url(#priceGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--cream-muted)', marginBottom: '1.5rem', textAlign: 'center' }}>
                  No historical price points recorded yet. Run a scrape to populate history.
                </p>
              )}

              {/* Data Table */}
              <h4 style={{ fontSize: '1rem', color: 'var(--cream-100)', marginBottom: '0.75rem', fontWeight: 700 }}>
                Historical Records
              </h4>

              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Outcome</th>
                      <th>Attempt #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length > 0 ? (
                      history.map((row) => (
                        <tr key={row.id}>
                          <td>{new Date(row.scraped_at).toLocaleString()}</td>
                          <td style={{ fontWeight: 600, color: row.price ? 'var(--cream-100)' : 'var(--cream-muted)' }}>
                            {row.price !== null && row.price !== undefined ? `₹${Number(row.price).toLocaleString()}` : '—'}
                          </td>
                          <td style={{ color: row.stock ? 'var(--gold-accent)' : 'var(--cream-muted)' }}>
                            {row.stock || '—'}
                          </td>
                          <td>
                            <span className={`badge badge-${row.outcome}`}>
                              {row.outcome}
                            </span>
                          </td>
                          <td>Attempt {row.attempt_number}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--cream-muted)', padding: '1.5rem' }}>
                          No history available for this product option.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
