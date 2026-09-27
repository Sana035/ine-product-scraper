import React from 'react';

export default function Loading({ message = 'Loading...' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem' }}>
      <div className="loading-spinner"></div>
      <span style={{ color: 'var(--cream-300)', fontWeight: 500 }}>{message}</span>
    </div>
  );
}
