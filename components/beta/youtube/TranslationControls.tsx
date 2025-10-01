
// components/VideoInsight/TranslationControls.tsx
import React from 'react';
import { Language } from '@/utilities/transcript';

interface TranslationControlsProps {
  targetLanguage: string;
  setTargetLanguage: (language: string) => void;
  selectedLanguage: string;
  transcript: string;
  translationLoading: boolean;
  translationError: string;
  onTranslate: () => void;
  languages: Language[];
}

export const TranslationControls: React.FC<TranslationControlsProps> = ({
  targetLanguage,
  setTargetLanguage,
  selectedLanguage,
  transcript,
  translationLoading,
  translationError,
  onTranslate,
  languages
}) => {
  return (
    <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-100">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Translation Options</h3>
      <div className="flex items-end gap-3">
        <div className="flex-grow">
          <label htmlFor="targetLanguage" className="block mb-1 text-xs text-gray-600">
            Translate to
          </label>
          <select
            id="targetLanguage"
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            disabled={!transcript || translationLoading}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={onTranslate}
          disabled={!transcript || translationLoading || targetLanguage === selectedLanguage}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 text-sm flex items-center space-x-2 transition-colors"
        >
          <span>{translationLoading ? 'Translating...' : 'Translate'}</span>
        </button>
      </div>
      
      {translationError && (
        <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          <p>{translationError}</p>
        </div>
      )}
    </div>
  );
};