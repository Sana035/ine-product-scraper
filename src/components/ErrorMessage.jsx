import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="error-banner">
      <AlertTriangle size={20} />
      <span>{message}</span>
    </div>
  );
}
