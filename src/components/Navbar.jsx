import React from 'react';
import { ShieldCheck, Download, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({ onRefresh, isRefreshing }) {
  const csvExportUrl = api.getCsvExportUrl();

  return (
    <header className="navbar">
      <div className="nav-brand">
        <ShieldCheck size={28} className="brand-icon" />
        <span>Price tracker</span>
      </div>

      <div className="nav-actions">
        <button className="btn btn-secondary btn-sm" onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw size={16} className={isRefreshing ? 'loading-spinner' : ''} />
          {isRefreshing ? 'Refreshing...' : 'Refresh All'}
        </button>

        <a href={csvExportUrl} download="scrape_history.csv" className="btn btn-gold btn-sm">
          <Download size={16} />
          Export CSV
        </a>
      </div>
    </header>
  );
}
