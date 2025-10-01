
// components/VideoInsight/ChatSection.tsx
import React from 'react';
import { MessageCircle, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { ChatMessage } from '@/utilities/transcript';
import { ChatMessageComponent } from './ChatMessage';

interface ChatSectionProps {
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  chatHistory: ChatMessage[];
  userQuery: string;
  setUserQuery: (query: string) => void;
  chatLoading: boolean;
  chatError: string;
  transcript: string;
  onSendQuery: (e: React.FormEvent<HTMLFormElement>) => void;
  onSuggestionClick: (suggestion: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  chatEndRef: React.RefObject<HTMLDivElement>;
}

export const ChatSection: React.FC<ChatSectionProps> = ({
  chatOpen,
  setChatOpen,
  chatHistory,
  userQuery,
  setUserQuery,
  chatLoading,
  chatError,
  transcript,
  onSendQuery,
  onSuggestionClick,
  inputRef,
  chatEndRef
}) => {
  const suggestions = [
    "What are the main topics covered?",
    "Explain the key concept at 2:30",
    "What evidence supports the main claim?",
    "Summarize the presenter's perspective"
  ];

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div 
        onClick={() => setChatOpen(!chatOpen)}
        className="p-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white cursor-pointer flex justify-between items-center"
      >
        <h2 className="text-lg font-semibold flex items-center">
          <MessageCircle className="h-5 w-5 mr-2" />
          Ask Gemini About This Video
        </h2>
        {chatOpen ? 
          <ChevronUp className="h-5 w-5" /> : 
          <ChevronDown className="h-5 w-5" />
        }
      </div>
      
      {chatOpen && (
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Ask questions about the video content and get AI-powered answers. Gemini will analyze the transcript and respond based on what's in the video.
          </p>
          
          {/* Chat History */}
          <div className="border border-gray-200 rounded-lg mb-4 h-72 overflow-y-auto p-4 bg-gray-50">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageCircle className="h-10 w-10 mb-3 text-gray-300" />
                <p>Start a conversation about the video content</p>
              </div>
            ) : (
              <div className="space-y-4">
                {chatHistory.map((message, index) => (
                  <ChatMessageComponent key={index} message={message} />
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {chatError && (
            <div className="p-3 mb-4 bg-red-50 text-red-700 rounded-md text-sm">
              <p>{chatError}</p>
            </div>
          )}
          
          {/* Chat Input */}
          <form onSubmit={onSendQuery} className="flex gap-2">
            <div className="relative flex-grow">
              <input
                ref={inputRef}
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Ask a question about the video content..."
                className="w-full p-3 pl-4 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={chatLoading || !transcript}
              />
            </div>
            <button
              type="submit"
              disabled={chatLoading || !userQuery.trim() || !transcript}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
            >
              {chatLoading ? 
                <div className="animate-pulse">Thinking...</div> : 
                <Send className="h-5 w-5" />
              }
            </button>
          </form>
          
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick(suggestion)}
                  disabled={chatLoading || !transcript}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200 disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};