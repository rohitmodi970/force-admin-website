// components/VideoInsight/ChatMessage.tsx
import React from 'react';
import { ChatMessage as IChatMessage } from '@/utilities/transcript';

interface ChatMessageProps {
  message: IChatMessage;
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3/4 p-3 rounded-lg ${
        message.role === 'user' 
          ? 'bg-blue-600 text-white rounded-br-none' 
          : message.role === 'system'
            ? 'bg-red-100 text-red-900'
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
      }`}>
        <p className="whitespace-pre-line text-sm">{message.content}</p>
      </div>
    </div>
  );
};
