'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Language, TranscriptResponse, ChatMessage } from '@/utilities/transcript';
import { Header } from '@/components/beta/youtube/Header';
import { VideoUrlForm } from '@/components//beta/youtube/VideoUrlForm';
import { ErrorDisplay } from '@/components/beta/youtube/ErrorDisplay';
import { VideoPreview } from '@/components/beta/youtube/VideoPreview';
import { TabNavigation } from '@/components/beta/youtube/TabNavigation';
import { TranscriptTab } from '@/components/beta/youtube/TranscriptTab';
import { SummaryTab } from '@/components/beta/youtube/SummaryTab';
import { ChatSection } from '@/components/beta/youtube/ChatSection';

export default function TranscriptPage(): React.JSX.Element {
  // All state variables (same as original)
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [formattedTranscript, setFormattedTranscript] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [targetLanguage, setTargetLanguage] = useState<string>('en');
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [videoThumbnail, setVideoThumbnail] = useState<string>('');
  const [translatedTranscript, setTranslatedTranscript] = useState<string>('');
  const [translationLoading, setTranslationLoading] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary'>('transcript');
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [userQuery, setUserQuery] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
const [chatError, setChatError] = useState<string>('');

const inputRef = useRef<HTMLInputElement>(null);
const chatEndRef = useRef<HTMLDivElement>(null);

  const languages: Language[] = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ru', name: 'Russian' },
    { code: 'ar', name: 'Arabic' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'it', name: 'Italian' }
  ];

  // All useEffect hooks (same as original)
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  useEffect(() => {
    if (chatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [chatOpen]);

  // All handler functions (same as original)
  const fetchTranscript = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTranscript('');
    setFormattedTranscript('');
    setSummary('');
    setSummaryError('');
    setVideoTitle('');
    setVideoThumbnail('');
    setTranslatedTranscript('');
    setTranslationError('');
    setChatHistory([]);
    setChatError('');
    setActiveTab('transcript');

    try {
      const videoId = extractVideoId(videoUrl);
      if (videoId) {
        setVideoThumbnail(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
        setVideoTitle(`YouTube Video (${videoId})`);
      }

      const response = await fetch('/api/admin/beta-features/youtube/youtube-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl, language: selectedLanguage }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (errorData.suggestions) {
          throw new Error(`${errorData.error}\n\nSuggestions:\n${errorData.suggestions.map((s: string) => `• ${s}`).join('\n')}`);
        } else {
          throw new Error(errorData.error || `Error ${response.status}: Failed to fetch transcript`);
        }
      }

      const data: TranscriptResponse = await response.json();
      console.log('Transcript fetched using method:', data.method);
      console.log(data);
      
      setTranscript(data.transcript);
      
      if (data.fullTranscript && Array.isArray(data.fullTranscript)) {
        const formatted = data.fullTranscript.map(item => {
          const minutes = Math.floor(item.offset / 60);
          const seconds = Math.floor(item.offset % 60);
          const timestamp = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          return `[${timestamp}] ${item.text}`;
        }).join('\n');
        setFormattedTranscript(formatted);
      } else {
        setFormattedTranscript(data.transcript);
      }

      if (data.method) {
        console.log(`✅ Transcript successfully fetched using ${data.method} method`);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async (): Promise<void> => {
    if (!transcript) return;
    
    setSummaryLoading(true);
    setSummaryError('');
    setActiveTab('summary');
    
    try {
      const response = await fetch('/api/admin/beta-features/generate-ytsummary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: translatedTranscript || transcript }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: Failed to generate summary`);
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setSummaryLoading(false);
    }
  };

  const translateTranscript = async (): Promise<void> => {
    if (!transcript || targetLanguage === selectedLanguage) return;
    
    setTranslationLoading(true);
    setTranslationError('');
    
    try {
      const response = await fetch('/api/admin/beta-features/translate-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          transcript: transcript,
          targetLanguage: getLanguageName(targetLanguage)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: Failed to translate transcript`);
      }

      const data = await response.json();
      setTranslatedTranscript(data.translatedText);
    } catch (err) {
      setTranslationError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setTranslationLoading(false);
    }
  };

  const sendChatQuery = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!userQuery.trim() || !transcript) return;
    
    const currentQuery = userQuery;
    setUserQuery('');
    setChatLoading(true);
    setChatError('');
    
    setChatHistory(prev => [...prev, { 
      role: 'user', 
      content: currentQuery 
    }]);
    
    try {
      const response = await fetch('/api/admin/beta-features/gemini-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: translatedTranscript || transcript,
          userQuery: currentQuery
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: Failed to get response`);
      }

      const data = await response.json();
      
      setChatHistory(prev => [...prev, {
        role: 'ai',
        content: data.response
      }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setChatError(errorMessage);
      setChatHistory(prev => [...prev, {
        role: 'system',
        content: `Error: ${errorMessage}`
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  function getLanguageName(code: string): string {
    const language = languages.find(lang => lang.code === code);
    return language ? language.name : code;
  }

  function extractVideoId(url: string): string | null {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  }

  const copyToClipboard = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(translatedTranscript || formattedTranscript || transcript);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleSuggestionClick = (suggestion: string): void => {
    if (!chatLoading && transcript) {
      setUserQuery(suggestion);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 max-w-5xl pb-16">
        <VideoUrlForm
          videoUrl={videoUrl}
          setVideoUrl={setVideoUrl}
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          loading={loading}
          onSubmit={fetchTranscript}
          languages={languages}
        />

        <ErrorDisplay error={error} />

        {transcript && (
          <div className="space-y-8">
            <VideoPreview 
              videoThumbnail={videoThumbnail} 
              videoTitle={videoTitle} 
              videoUrl={videoUrl}
            />

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <TabNavigation 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
              />

              <div className="p-6">
                {activeTab === 'transcript' && (
                  <TranscriptTab
                    transcript={transcript}
                    formattedTranscript={formattedTranscript}
                    translatedTranscript={translatedTranscript}
                    selectedLanguage={selectedLanguage}
                    targetLanguage={targetLanguage}
                    setTargetLanguage={setTargetLanguage}
                    translationLoading={translationLoading}
                    translationError={translationError}
                    summaryLoading={summaryLoading}
                    onTranslate={translateTranscript}
                    onCopyToClipboard={copyToClipboard}
                    onGenerateSummary={generateSummary}
                    getLanguageName={getLanguageName}
                    languages={languages}
                  />
                )}

                {activeTab === 'summary' && (
                  <SummaryTab
                    summary={summary}
                    summaryLoading={summaryLoading}
                    summaryError={summaryError}
                    transcript={transcript}
                    onGenerateSummary={generateSummary}
                    onCopyToClipboard={copyToClipboard}
                  />
                )}
              </div>
            </div>

            <ChatSection
              chatOpen={chatOpen}
              setChatOpen={setChatOpen}
              chatHistory={chatHistory}
              userQuery={userQuery}
              setUserQuery={setUserQuery}
              chatLoading={chatLoading}
              chatError={chatError}
              transcript={transcript}
              onSendQuery={sendChatQuery}
              onSuggestionClick={handleSuggestionClick}
              //@ts-ignore
              inputRef={inputRef}
               //@ts-ignore
              chatEndRef={chatEndRef}
            />
          </div>
        )}
      </main>
    </div>
  );
}