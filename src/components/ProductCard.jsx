import React, { useState } from 'react';
import { PlusCircle, ExternalLink, Tag } from 'lucide-react';

export default function ProductCard({ product, onTrack, isTracking }) {
  const options = product.options && product.options.length > 0 ? product.options : [{ id: 'opt1', label: 'Standard' }];
  const [selectedOpt, setSelectedOpt] = useState(options[0].label);

  const handleTrack = () => {
    onTrack({
      store_product_id: String(product.id),
      product_name: product.product_name,
      selected_option: selectedOpt,
      product_url: product.product_url
    });
  };

  return (
    <div className="card">
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-accent)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            ID #{product.store_product_id} · {product.category || 'Store Item'}
          </span>
          <a href={product.product_url} target="_blank" rel="noreferrer" title="Open in INE Store" style={{ color: 'var(--cream-muted)' }}>
            <ExternalLink size={16} />
          </a>
        </div>

        <h3 style={{ fontSize: '1.15rem', color: 'var(--cream-100)', marginBottom: '0.4rem', fontWeight: 700 }}>
          {product.product_name}
        </h3>
        
        {product.brand && (
          <p style={{ fontSize: '0.85rem', color: 'var(--cream-muted)', marginBottom: '0.75rem' }}>
            Brand: {product.brand}
          </p>
        )}

        <div style={{ marginTop: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--cream-300)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
            <Tag size={14} /> Available {product.optionAxis || 'Option'} Variants:
          </span>

          <div className="option-chips">
            {options.map((opt) => (
              <button
                key={opt.id || opt.label}
                type="button"
                className={`chip ${selectedOpt === opt.label ? 'chip-active' : ''}`}
                onClick={() => setSelectedOpt(opt.label)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
        <button
          className="btn btn-gold btn-sm"
          style={{ width: '100%' }}
          onClick={handleTrack}
          disabled={isTracking}
        >
          <PlusCircle size={16} />
          Track Product ({selectedOpt})
        </button>
      </div>
    </div>
  );
}
