// components/VideoInsight/Header.tsx
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 py-6 mb-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl font-bold text-white text-center">VideoInsight</h1>
        <p className="text-center text-blue-100 mt-2">Extract, translate, analyze and chat with YouTube content</p>
      </div>
    </header>
  );
};
