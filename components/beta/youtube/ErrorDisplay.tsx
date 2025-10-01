
// components/VideoInsight/ErrorDisplay.tsx
import React from 'react';

interface ErrorDisplayProps {
  error: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  if (!error) return null;

  return (
    <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-xl border border-red-200 shadow-sm">
      <p className="font-medium">Error:</p>
      <p>{error}</p>
    </div>
  );
};