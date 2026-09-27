import React, { useState } from 'react';
import SearchBar from './SearchBar';
import ProductCard from './ProductCard';
import Loading from './Loading';
import ErrorMessage from './ErrorMessage';
import { api } from '../services/api';
import { Search } from 'lucide-react';

export default function ProductSearch({ onTrackSuccess }) {
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (query) => {
    setIsSearching(true);
    setError(null);
    setSearched(true);

    try {
      const data = await api.searchCatalog(query);
      setResults(data.results || []);
    } catch (err) {
      setError(err.message || 'Failed to search product catalog');
    } finally {
      setIsSearching(false);
    }
  };

  const handleTrack = async (productData) => {
    setIsTracking(true);
    setError(null);

    try {
      await api.trackProduct(productData);
      if (onTrackSuccess) onTrackSuccess();
    } catch (err) {
      setError(err.message || 'Failed to track product');
    } finally {
      setIsTracking(false);
    }
  };

  return (
    <div className="search-card">
      <div className="section-header">
        <h2 className="section-title">
          <Search size={22} className="section-title-icon" /> Search Catalog
        </h2>
      </div>

      <SearchBar onSearch={handleSearch} isSearching={isSearching} />

      <ErrorMessage message={error} />

      {isSearching && <Loading message="Searching INE mock storefront..." />}

      {!isSearching && searched && results.length === 0 && (
        <p style={{ color: 'var(--cream-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
          No matching products found in INE catalog. Try searching "piano", "router", or product ID "2638".
        </p>
      )}

      {!isSearching && results.length > 0 && (
        <div className="search-results-grid">
          {results.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onTrack={handleTrack}
              isTracking={isTracking}
            />
          ))}
        </div>
      )}
    </div>
  );
}
