// components/VideoInsight/VideoPreview.tsx
import React, { useState } from 'react';

interface VideoPreviewProps {
    videoThumbnail: string;
    videoTitle: string;
    videoUrl?: string; // Add video URL prop
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ 
    videoThumbnail, 
    videoTitle, 
    videoUrl 
}) => {
    const [isPlaying, setIsPlaying] = useState(false);

    if (!videoThumbnail) return null;

    const handlePlayClick = (): void => {
        if (videoUrl) {
            // Open YouTube video in new tab instead of trying to embed
            window.open(videoUrl, '_blank');
        }
    };

    return (
            <div className="relative h-56 md:h-64 bg-gray-800">
                <img 
                    src={videoThumbnail} 
                    alt={videoTitle}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-center px-6">
                        <div className="bg-black bg-opacity-70 p-4 rounded-lg">
                            <h2 className="font-bold text-xl md:text-2xl mb-2">{videoTitle}</h2>
                            <p className="text-gray-300 mb-4">Content extracted and ready for analysis</p>
                            {videoUrl && (
                                <button
                                    onClick={handlePlayClick}
                                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M8 5v10l7-5-7-5z"/>
                                    </svg>
                                    Watch on YouTube
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
    );
};
