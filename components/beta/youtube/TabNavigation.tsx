
// components/VideoInsight/TabNavigation.tsx
import React from 'react';
import { BookOpen, MessageCircle } from 'lucide-react';

interface TabNavigationProps {
  activeTab: 'transcript' | 'summary';
  setActiveTab: (tab: 'transcript' | 'summary') => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex -mb-px">
        <button
          onClick={() => setActiveTab('transcript')}
          className={`px-6 py-4 font-medium text-sm flex items-center space-x-2 ${
            activeTab === 'transcript' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Transcript</span>
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-6 py-4 font-medium text-sm flex items-center space-x-2 ${
            activeTab === 'summary' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          <span>AI Summary & Analysis</span>
        </button>
      </nav>
    </div>
  );
};
