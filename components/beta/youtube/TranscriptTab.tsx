// components/VideoInsight/TranscriptTab.tsx
import React, { useMemo } from 'react';
import { Copy, BookOpen, FileText, Languages } from 'lucide-react';
import { TranslationControls } from './TranslationControls';
import { Language } from '@/utilities/transcript';

interface TranscriptTabProps {
  transcript: string;
  formattedTranscript: string;
  translatedTranscript: string;
  selectedLanguage: string;
  targetLanguage: string;
  setTargetLanguage: (language: string) => void;
  translationLoading: boolean;
  translationError: string;
  summaryLoading: boolean;
  onTranslate: () => void;
  onCopyToClipboard: () => void;
  onGenerateSummary: () => void;
  getLanguageName: (code: string) => string;
  languages: Language[];
}

// Component to render formatted transcript text
const FormattedTranscriptText: React.FC<{ content: string }> = ({ content }) => {
  const formattedContent = useMemo(() => {
    if (!content) return '';
    
    // Convert markdown-like formatting to HTML
    let formatted = content
      // Handle bold text **text** -> <strong>text</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Handle timestamps [00:00] with special styling
      .replace(/\[(\d{2}:\d{2}(?::\d{2})?)\]/g, '<span class="timestamp">[$1]</span>')
      // Handle bullet points at start of lines
      .replace(/^\* {2,}/gm, '<span class="bullet">•</span> ')
      // Handle section headers (lines ending with **)
      .replace(/^(\*\*.*?\*\*)\s*$/gm, '<h4 class="section-header">$1</h4>')
      // Convert line breaks to proper HTML
      .replace(/\n/g, '<br>');
    
    return formatted;
  }, [content]);

  return (
    <div 
      className="formatted-transcript"
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  );
};

export const TranscriptTab: React.FC<TranscriptTabProps> = ({
  transcript,
  formattedTranscript,
  translatedTranscript,
  selectedLanguage,
  targetLanguage,
  setTargetLanguage,
  translationLoading,
  translationError,
  summaryLoading,
  onTranslate,
  onCopyToClipboard,
  onGenerateSummary,
  getLanguageName,
  languages
}) => {
  const currentTranscript = translatedTranscript || formattedTranscript || transcript;
  const hasTranscript = Boolean(currentTranscript?.trim());

  return (
    <div className="h-full flex flex-col">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Video Transcript</h2>
        </div>
        
        {/* Language Indicators */}
        <div className="flex items-center space-x-3">
          {selectedLanguage && (
            <div className="flex items-center text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              <Languages className="w-3 h-3 mr-1" />
              {getLanguageName(selectedLanguage)}
            </div>
          )}
          {translatedTranscript && targetLanguage && (
            <div className="flex items-center text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              <Languages className="w-3 h-3 mr-1" />
              Translated to {getLanguageName(targetLanguage)}
            </div>
          )}
        </div>
      </div>

      {/* Translation Controls */}
      <div className="mb-6">
        <TranslationControls
          selectedLanguage={selectedLanguage}
          transcript={transcript}
          targetLanguage={targetLanguage}
          setTargetLanguage={setTargetLanguage}
          translationLoading={translationLoading}
          translationError={translationError}
          onTranslate={onTranslate}
          languages={languages}
        />
      </div>

      {/* Transcript Content */}
      <div className="flex-1 flex flex-col">
        {hasTranscript ? (
          <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Content Area */}
            <div className="flex-1 h-full overflow-hidden">
              <div className="h-full overflow-y-auto p-6 text-sm text-gray-700 leading-relaxed bg-gray-50">
                <style jsx>{`
                  .formatted-transcript {
                    line-height: 1.7;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  }
                  
                  .formatted-transcript strong {
                    font-weight: 600;
                    color: #1f2937;
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    padding: 1px 4px;
                    border-radius: 3px;
                    font-size: 0.95em;
                  }
                  
                  .formatted-transcript .timestamp {
                    display: inline-block;
                    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                    color: #1e40af;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
                    font-size: 0.85em;
                    font-weight: 500;
                    margin: 0 4px;
                    border: 1px solid #93c5fd;
                  }
                  
                  .formatted-transcript .bullet {
                    color: #3b82f6;
                    font-weight: 600;
                    margin-right: 8px;
                  }
                  
                  .formatted-transcript .section-header {
                    font-size: 1.1em;
                    font-weight: 700;
                    color: #1f2937;
                    margin: 20px 0 12px 0;
                    padding: 8px 12px;
                    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
                    border-left: 4px solid #3b82f6;
                    border-radius: 0 6px 6px 0;
                  }
                  
                  .formatted-transcript .section-header:first-child {
                    margin-top: 0;
                  }
                  
                  .formatted-transcript br + .bullet {
                    margin-top: 8px;
                    display: inline-block;
                  }
                `}</style>
                
                <FormattedTranscriptText content={currentTranscript} />
              </div>
            </div>
            
            {/* Footer with Actions */}
            <div className="border-t border-gray-100 bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {translatedTranscript ? 
                    `Translated transcript • ${currentTranscript.length} characters` :
                    `Original transcript • ${currentTranscript.length} characters`
                  }
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={onCopyToClipboard}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </button>
                  
                  <button
                    onClick={onGenerateSummary}
                    disabled={summaryLoading || !hasTranscript}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    {summaryLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      'Generate Summary'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-dashed border-gray-200 rounded-xl">
            <div className="text-center p-8 max-w-md">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">No Transcript Available</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Upload a video file to automatically generate a transcript, or the transcript will appear here once processing is complete.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};