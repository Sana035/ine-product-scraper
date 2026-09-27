import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ onSearch, isSearching }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="search-input-wrapper">
      <input
        type="text"
        className="search-input"
        placeholder="Search product name or ID (e.g., piano, router, 2638)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit" className="btn btn-primary" disabled={isSearching || !query.trim()}>
        <Search size={18} />
        {isSearching ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
}
