export interface Language {
  code: string;
  name: string;
}

export interface TranscriptItem {
  text: string;
  offset: number;
  duration: number;
}

export interface TranscriptResponse {
  transcript: string;
  fullTranscript: TranscriptItem[];
  videoId: string;
  language: string;
  method: string;
  title?: string;
  description?: string;
  duration?: number;
  note?: string;
  chatResponse?: string;
  requestedLanguage: string;
  success: boolean;
}

export interface VideoMetadata {
  title: string;
  description: string;
  duration: number;
  thumbnail?: string;
}

export interface ChatMessage {
  role: 'user' | 'ai' | 'system';
  content: string;
}

export interface ApiError {
  error: string;
  details?: {
    videoId: string;
    requestedLanguage: string;
    possibleCauses: string[];
    suggestions: string[];
  };
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}