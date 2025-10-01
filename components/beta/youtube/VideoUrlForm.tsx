
// components/VideoInsight/VideoUrlForm.tsx
import React from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { Language } from '@/utilities/transcript';

interface VideoUrlFormProps {
  videoUrl: string;
  setVideoUrl: (url: string) => void;
  selectedLanguage: string;
  setSelectedLanguage: (language: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  languages: Language[];
}

export const VideoUrlForm: React.FC<VideoUrlFormProps> = ({
  videoUrl,
  setVideoUrl,
  selectedLanguage,
  setSelectedLanguage,
  loading,
  onSubmit,
  languages
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8 transition-all duration-300 hover:shadow-lg">
      <div className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <label htmlFor="videoUrl" className="block mb-2 font-medium text-gray-700">
                YouTube Video URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <Play className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              </div>
            </div>
            
            <div className="md:w-1/4">
              <label htmlFor="language" className="block mb-2 font-medium text-gray-700">
                Source Language
              </label>
              <select
                id="language"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !videoUrl}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 transition duration-300 font-medium flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <span className="animate-pulse">Processing</span>
                <span className="ml-2 flex">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce delay-100">.</span>
                  <span className="animate-bounce delay-200">.</span>
                </span>
              </>
            ) : (
              <>
                <span>Extract Content</span>
                <ExternalLink className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};