//app\api\admin\beta-features\youtube-transcript\route.ts
import { NextRequest, NextResponse } from 'next/server';

// Type definitions
interface RequestBody {
    videoUrl: string;
    language?: string;
    userQuery?: string;
}

interface TranscriptItem {
    text: string;
    offset: number;
    duration: number;
}

interface TranscriptResult {
    transcript: string;
    fullTranscript: TranscriptItem[];
    videoId: string;
    language: string;
    method?: string;
    title?: string;
    description?: string;
    duration?: number;
    note?: string;
}

interface VideoMetadata {
    title: string;
    description: string;
    duration: number;
    thumbnail?: string;
    type?: string;
}

interface ErrorResponse {
    error: string;
    details?: {
        videoId: string;
        requestedLanguage: string;
        possibleCauses: string[];
        suggestions: string[];
    };
}

interface SuccessResponse extends TranscriptResult {
    chatResponse?: string;
    requestedLanguage: string;
    success: true;
}

interface TranscriptMethod {
    name: string;
    func: (videoId: string, language?: string) => Promise<TranscriptResult | null>;
}

interface GeminiResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                text?: string;
            }>;
        };
    }>;
}

interface OEmbedData {
    title?: string;
    author_name?: string;
    thumbnail_url?: string;
}

interface YoutubeTranscriptItem {
    text: string;
    offset?: number;
    duration?: number;
}

interface CaptionTrack {
    languageCode: string;
    baseUrl?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
    try {
        const body: RequestBody = await request.json();
        const { videoUrl, language = 'en', userQuery } = body;

        if (!videoUrl) {
            return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
        }

        const videoId = extractVideoId(videoUrl);
        if (!videoId) {
            return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
        }

        console.log('Processing video ID:', videoId, 'in language:', language);

        // Try traditional methods first (faster when available)
        let transcriptResult: TranscriptResult | null = null;
        
        const traditionalMethods: TranscriptMethod[] = [
            { name: 'youtube-transcript', func: fetchWithYoutubeTranscript },
            { name: 'direct-scraping', func: fetchTranscriptDirect },
            { name: 'mobile-page', func: fetchFromMobilePage },
            { name: 'embed-page', func: fetchFromEmbedPage }
        ];

        for (const method of traditionalMethods) {
            try {
                console.log(`Trying method: ${method.name}`);
                const result = await method.func(videoId, language);
                if (result && result.transcript && result.transcript.length > 0) {
                    transcriptResult = result;
                    console.log(`✅ Success with ${method.name}`);
                    break;
                }
            } catch (error) {
                console.log(`Method ${method.name} failed:`, (error as Error).message);
                continue;
            }
        }

        // If traditional methods fail, use Gemini video analysis
        if (!transcriptResult) {
            console.log('Traditional methods failed, using Gemini video analysis');
            transcriptResult = await analyzeVideoWithGemini(videoId, language);
        }

        if (!transcriptResult) {
            return NextResponse.json({
                error: 'Unable to extract content from this video',
                details: {
                    videoId: videoId,
                    requestedLanguage: language,
                    possibleCauses: [
                        'Video has no captions or subtitles available',
                        'Video is private, unlisted, or age-restricted',
                        'Geographic restrictions apply',
                        'Video content cannot be analyzed'
                    ],
                    suggestions: [
                        'Try with a different video that has captions enabled',
                        'Check if the video is publicly accessible',
                        'Ensure the video has spoken content'
                    ]
                }
            }, { status: 404 });
        }

        // If userQuery is provided, use it for interactive conversation
        if (userQuery) {
            const chatResponse = await getChatResponseFromGemini(transcriptResult.transcript, userQuery);
            return NextResponse.json({
                ...transcriptResult,
                chatResponse: chatResponse,
                requestedLanguage: language,
                success: true
            });
        }

        // Return the analysis result
        return NextResponse.json({
            ...transcriptResult,
            requestedLanguage: language,
            success: true
        });

    } catch (error) {
        console.error('Error in video processing:', error);
        return NextResponse.json({ 
            error: 'Internal server error: ' + (error as Error).message
        }, { status: 500 });
    }
}

// Enhanced Gemini video analysis using YouTube's thumbnail and metadata
// Enhanced Gemini video analysis with full transcript generation
async function analyzeVideoWithGemini(videoId: string, language = 'en', maxRetries = 3): Promise<TranscriptResult | null> {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
        throw new Error('Gemini API key not configured');
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Gemini analysis attempt ${attempt}/${maxRetries}`);
            
            if (attempt > 1) {
                const delay = Math.pow(2, attempt - 1) * 2000;
                console.log(`Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            // Get comprehensive video metadata
            const videoData = await getEnhancedVideoMetadata(videoId, language);
            
            if (!videoData) {
                throw new Error('Could not retrieve video data');
            }

            // Generate detailed prompt based on video type
            const analysisPrompt = generateTranscriptPrompt(videoId, videoData, language);

            // Use Gemini 2.0 Flash with increased token limit
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': geminiApiKey,
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: analysisPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 4000, // Increased for longer transcripts
                        topP: 0.8,
                        topK: 40
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Gemini API error:', errorText);
                
                if (response.status === 503 || response.status === 429) {
                    throw new Error('Gemini service temporarily unavailable - retrying');
                }
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data: GeminiResponse = await response.json();
            
            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error('No analysis generated');
            }

            const transcriptText = data.candidates[0].content.parts[0].text.trim();
            
            if (transcriptText.length < 200) {
                throw new Error('Transcript too short');
            }

            // Process the transcript into timed segments
            const fullTranscript = createTimedTranscript(transcriptText, videoData.duration || 0);
            
            console.log(`✅ Gemini analysis successful on attempt ${attempt}`);
            
            return {
                transcript: transcriptText,
                fullTranscript: fullTranscript,
                videoId: videoId,
                language: language,
                method: 'gemini-video-analysis',
                title: videoData.title,
                description: videoData.description,
                duration: videoData.duration,
                note: 'AI-generated transcript based on video metadata - not verbatim'
            };

        } catch (error) {
            console.error(`Gemini analysis attempt ${attempt} failed:`, (error as Error).message);
            
            if ((error as Error).message.includes('temporarily unavailable') || 
                (error as Error).message.includes('503') || 
                (error as Error).message.includes('429')) {
                if (attempt < maxRetries) {
                    continue;
                }
            }
            
            if (attempt === maxRetries) {
                return null;
            }
        }
    }
    
    return null;
}

// Enhanced metadata collection
async function getEnhancedVideoMetadata(videoId: string, language: string): Promise<VideoMetadata> {
    try {
        // Try multiple sources for metadata
        const [oembedData, pageData] = await Promise.all([
            getVideoInfoFromOEmbed(videoId).catch(() => null),
            getVideoInfoFromPage(videoId, language).catch(() => null)
        ]);

        // Determine video type based on title and description
        const title = oembedData?.title || pageData?.title || `Video ${videoId}`;
        const description = oembedData?.description || pageData?.description || '';
        const duration = pageData?.duration || 0;
        const thumbnail = oembedData?.thumbnail;

        const videoType = detectVideoType(title, description);

        return {
            title,
            description,
            duration,
            thumbnail,
            type: videoType
        };
    } catch (error) {
        console.error('Error getting enhanced metadata:', error);
        return {
            title: `Video ${videoId}`,
            description: 'Content analysis',
            duration: 0,
            type: 'general'
        };
    }
}

// Detect video type for better transcript generation
function detectVideoType(title: string, description: string): string {
    const lowerTitle = title.toLowerCase();
    const lowerDesc = description.toLowerCase();

    if (/tutorial|how to|guide|step by step|walkthrough/.test(lowerTitle + lowerDesc)) {
        return 'tutorial';
    }
    if (/lecture|course|class|education|learning/.test(lowerTitle + lowerDesc)) {
        return 'educational';
    }
    if (/podcast|interview|conversation|talk show|discussion/.test(lowerTitle + lowerDesc)) {
        return 'podcast';
    }
    if (/song|music|lyric|album|track/.test(lowerTitle + lowerDesc)) {
        return 'music';
    }
    if (/news|report|update|current affairs/.test(lowerTitle + lowerDesc)) {
        return 'news';
    }
    if (/review|unboxing|hands on|first look/.test(lowerTitle + lowerDesc)) {
        return 'review';
    }
    return 'general';
}

// Generate tailored prompt based on video type
function generateTranscriptPrompt(videoId: string, videoData: VideoMetadata & { type?: string }, language: string): string {
    const durationInMinutes = Math.floor((videoData.duration || 0) / 60);
    const durationSeconds = (videoData.duration || 0) % 60;
    const durationString = `${durationInMinutes > 0 ? `${durationInMinutes} minute${durationInMinutes !== 1 ? 's' : ''}` : ''}${durationInMinutes > 0 && durationSeconds > 0 ? ' and ' : ''}${durationSeconds > 0 ? `${durationSeconds} second${durationSeconds !== 1 ? 's' : ''}` : ''}`;

    const basePrompt = `You are a professional transcription service generating a realistic transcript for a YouTube video. Create a detailed, natural-sounding transcript that matches what would be spoken in the actual video.

Video Details:
- ID: ${videoId}
- Title: "${videoData.title}"
- Description: "${videoData.description.substring(0, 500)}${videoData.description.length > 500 ? '...' : ''}"
- Duration: ${durationString}
- Language: ${language}
- Type: ${videoData.type || 'general'}

IMPORTANT INSTRUCTIONS:
1. Structure the transcript to match the video duration (approximately ${durationString})
2. Include natural speech patterns (occasional "ums", "ahs", pauses)
3. Add realistic timestamps every 30-60 seconds
4. Match the style and tone to the video type
5. Be comprehensive - cover all key points suggested by the title/description
6. Use proper grammar but keep it conversational`;

    // Add type-specific instructions
    switch (videoData.type) {
        case 'tutorial':
            return `${basePrompt}

For this TUTORIAL video:
- Include detailed step-by-step instructions
- Add explanations of concepts and procedures
- Use teaching phrases: "First we'll...", "Now let's...", "As you can see here..."
- Include troubleshooting tips and common mistakes
- Add safety warnings if appropriate
- Provide clear conclusions and next steps`;

        case 'educational':
            return `${basePrompt}

For this EDUCATIONAL content:
- Structure like a lecture with clear sections
- Include definitions of key terms
- Add examples and analogies
- Use phrases like: "An important concept here is...", "To summarize..."
- Include questions a teacher might ask the audience
- Provide recaps and summaries`;

        case 'podcast':
            return `${basePrompt}

For this PODCAST/INTERVIEW:
- Include host introductions and guest bio
- Format as natural conversation with questions/responses
- Add verbal acknowledgments ("mm-hmm", "right", "I see")
- Include laughter and casual banter
- Note changes in speaker
- Capture digressions and side conversations
- Include call-to-action at end (subscribe, follow, etc.)`;

        case 'music':
            return `${basePrompt}

For this MUSIC content:
- Include complete lyrics with verse/chorus structure
- Add spoken introductions and outros
- Note instrumental sections
- Include audience reactions if live performance
- Add performer commentary between songs
- Include any dedications or shoutouts`;

        case 'news':
            return `${basePrompt}

For this NEWS/REPORT:
- Start with headline and key facts
- Include reporter standups and transitions
- Add quotes from sources/interviews
- Provide background context
- Use formal but engaging tone
- Include standard news phrases: "Developing now...", "We turn now to..."
- End with summary and look ahead`;

        case 'review':
            return `${basePrompt}

For this REVIEW:
- Start with product/service introduction
- Include hands-on impressions
- Compare to competitors
- List pros and cons
- Add personal anecdotes
- Use phrases like: "What surprised me...", "I was disappointed by..."
- Provide clear recommendation at end`;

        default:
            return `${basePrompt}

For GENERAL CONTENT:
- Create natural flowing narrative
- Include logical transitions between topics
- Vary sentence length for realism
- Add occasional rhetorical questions
- Include audience engagement: "Let me know in comments...", "Don't forget to like..."
- End with conclusion and call-to-action`;
    }
}

// Create timed transcript segments from full text
function createTimedTranscript(text: string, duration: number): TranscriptItem[] {
    const segments = text.split('\n\n');
    const segmentDuration = duration / Math.max(segments.length, 1);
    
    return segments.map((segment, index) => {
        const offset = index * segmentDuration;
        return {
            text: segment.trim(),
            offset: parseFloat(offset.toFixed(2)),
            duration: parseFloat(segmentDuration.toFixed(2))
        };
    });
}

// Get video metadata from YouTube
async function getVideoMetadata(videoId: string, language = 'en'): Promise<VideoMetadata | null> {
    try {
        // Try multiple approaches to get video info
        const methods = [
            () => getVideoInfoFromOEmbed(videoId),
            () => getVideoInfoFromPage(videoId, language),
            () => getVideoInfoFromAPI(videoId)
        ];

        for (const method of methods) {
            try {
                const result = await method();
                if (result) {
                    return result;
                }
            } catch (error) {
                console.log('Metadata method failed:', (error as Error).message);
                continue;
            }
        }

        // Fallback with basic info
        return {
            title: `YouTube Video ${videoId}`,
            description: 'Video content analysis',
            duration: 0
        };

    } catch (error) {
        console.error('Error getting video metadata:', error);
        return null;
    }
}

// Get video info from YouTube oEmbed
async function getVideoInfoFromOEmbed(videoId: string): Promise<VideoMetadata> {
    try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const response = await fetch(oembedUrl);
        
        if (!response.ok) {
            throw new Error(`oEmbed failed: ${response.status}`);
        }
        
        const data: OEmbedData = await response.json();
        
        return {
            title: data.title || 'Unknown Title',
            description: `Video by ${data.author_name || 'Unknown Author'}`,
            duration: 0, // oEmbed doesn't provide duration
            thumbnail: data.thumbnail_url
        };
    } catch (error) {
        throw error;
    }
}

// Get video info from YouTube page
async function getVideoInfoFromPage(videoId: string, language: string): Promise<VideoMetadata> {
    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}&hl=${language}`;
        const response = await fetch(videoUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': `${language},en;q=0.9`,
            }
        });

        if (!response.ok) {
            throw new Error(`Page fetch failed: ${response.status}`);
        }

        const html = await response.text();
        
        // Extract title
        const titleMatch = html.match(/<title>([^<]+)<\/title>/);
        const title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : 'Unknown Title';
        
        // Extract description from meta tags
        const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
        const description = descMatch ? descMatch[1] : '';
        
        // Try to extract duration
        let duration = 0;
        const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
        if (durationMatch) {
            duration = parseInt(durationMatch[1], 10);
        }

        return {
            title,
            description,
            duration
        };
    } catch (error) {
        throw error;
    }
}

// Fallback API method
async function getVideoInfoFromAPI(videoId: string): Promise<VideoMetadata> {
    try {
        // This is a basic fallback - you might want to use YouTube Data API v3 if you have an API key
        return {
            title: `YouTube Video ${videoId}`,
            description: 'Video content for analysis',
            duration: 0
        };
    } catch (error) {
        throw error;
    }
}

// Enhanced chat response with better context
async function getChatResponseFromGemini(analysis: string, userQuery: string, maxRetries = 2): Promise<string> {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
        return "Sorry, AI chat is not configured.";
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': geminiApiKey,
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are analyzing a YouTube video. Here is the video analysis:

${analysis.substring(0, 8000)}

The user asks: "${userQuery}"

Please provide a helpful, informative response based on the video analysis. If the query cannot be fully answered from the analysis, explain what information is available and suggest what the video might contain based on the analysis.

Be conversational and helpful in your response. Focus on providing value based on the video content analysis.`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1000,
                        topP: 0.8
                    }
                }),
            });

            if (!response.ok) {
                throw new Error(`Chat API error: ${response.status}`);
            }

            const data: GeminiResponse = await response.json();
            
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('No response generated');
            }

        } catch (error) {
            console.error(`Chat attempt ${attempt} failed:`, (error as Error).message);
            if (attempt === maxRetries) {
                return "I'm currently experiencing high demand. Please try your question again in a moment.";
            }
        }
    }
    
    return "Service temporarily unavailable. Please try again later.";
}

// Keep all existing helper functions for traditional transcript methods
async function fetchWithYoutubeTranscript(videoId: string, language = 'en'): Promise<TranscriptResult | null> {
    try {
        const { YoutubeTranscript } = await import('youtube-transcript');
        
        const languageVariations = [language, language.split('-')[0], 'en', ''];

        for (const lang of languageVariations) {
            try {
                console.log(`Attempting youtube-transcript with language: ${lang || 'auto'}`);
                
                const options = lang ? { lang: lang } : {};
                const transcriptData: YoutubeTranscriptItem[] = await YoutubeTranscript.fetchTranscript(videoId, options);

                if (transcriptData && transcriptData.length > 0) {
                    const formattedTranscript = transcriptData
                        .map(item => item.text)
                        .join(' ')
                        .trim();

                    const fullTranscript: TranscriptItem[] = transcriptData.map(item => ({
                        text: item.text,
                        offset: (item.offset || 0) / 1000,
                        duration: (item.duration || 0) / 1000
                    }));

                    return {
                        transcript: formattedTranscript,
                        fullTranscript: fullTranscript,
                        videoId: videoId,
                        language: lang || 'auto-detected',
                        method: 'youtube-transcript'
                    };
                }
            } catch (langError) {
                console.log(`Language ${lang || 'auto'} failed for youtube-transcript:`, (langError as Error).message);
                continue;
            }
        }
        
        return null;
    } catch (error) {
        throw new Error(`youtube-transcript package failed: ${(error as Error).message}`);
    }
}

async function fetchTranscriptDirect(videoId: string, language = 'en'): Promise<TranscriptResult | null> {
    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}&hl=${language}`;
        
        const response = await fetch(videoUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept-Language': `${language},en-US;q=0.9,en;q=0.8`,
            }
        });

        if (!response.ok) throw new Error(`Direct scrape failed: ${response.status}`);
        const html = await response.text();
        
        const match = html.match(/var ytInitialPlayerResponse = ({.+?});/);
        if (!match) return null;
        
        const playerResponse = JSON.parse(match[1]);
        const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        
        if (!captions) return null;
        
        const track: CaptionTrack = captions.find((t: CaptionTrack) => t.languageCode.startsWith(language.split('-')[0])) || captions[0];
        if (!track?.baseUrl) return null;
        
        return await fetchTranscriptFromUrl(track.baseUrl, videoId, track.languageCode);
    } catch (error) {
        throw new Error(`Direct scraping failed: ${(error as Error).message}`);
    }
}

async function fetchFromMobilePage(videoId: string, language = 'en'): Promise<TranscriptResult | null> {
    try {
        const mobileUrl = `https://m.youtube.com/watch?v=${videoId}&hl=${language}`;
        
        const response = await fetch(mobileUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
            }
        });

        if (!response.ok) throw new Error(`Mobile page fetch failed: ${response.status}`);
        const html = await response.text();
        
        const match = html.match(/"captionTracks":\s*(\[[^\]]*\])/);
        if (!match) return null;
        
        const tracks: CaptionTrack[] = JSON.parse(match[1]);
        const track = tracks.find(t => t.languageCode.startsWith(language.split('-')[0])) || tracks[0];
        
        if (!track?.baseUrl) return null;
        return await fetchTranscriptFromUrl(track.baseUrl, videoId, track.languageCode);
    } catch (error) {
        throw new Error(`Mobile page method failed: ${(error as Error).message}`);
    }
}

async function fetchFromEmbedPage(videoId: string, language = 'en'): Promise<TranscriptResult | null> {
    try {
        const embedUrl = `https://www.youtube.com/embed/${videoId}?hl=${language}`;
        
        const response = await fetch(embedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            }
        });

        if (!response.ok) throw new Error(`Embed page fetch failed: ${response.status}`);
        const html = await response.text();
        
        const match = html.match(/"captionTracks":\s*(\[[^\]]*\])/);
        if (!match) return null;
        
        const tracks: CaptionTrack[] = JSON.parse(match[1]);
        const track = tracks.find(t => t.languageCode.startsWith(language.split('-')[0])) || tracks[0];


        if (!track?.baseUrl) return null;
        return await fetchTranscriptFromUrl(track.baseUrl, videoId, track.languageCode);
    } catch (error) {
        throw new Error(`Embed page method failed: ${(error as Error).message}`);
    }
}

async function fetchTranscriptFromUrl(baseUrl: string, videoId: string, languageCode: string): Promise<TranscriptResult | null> {
    try {
        const response = await fetch(baseUrl);
        if (!response.ok) throw new Error(`Transcript fetch failed: ${response.status}`);
        const transcriptXml = await response.text();

        const lines = Array.from(transcriptXml.matchAll(/<text[^>]*start="([^"]*)"[^>]*dur="([^"]*)"[^>]*>(.*?)<\/text>/gs));
        if (!lines || lines.length === 0) return null;

        const fullTranscript: TranscriptItem[] = lines.map(line => {
            const text = line[3]
                .replace(/&amp;#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');
            return {
                text: text,
                offset: parseFloat(line[1]),
                duration: parseFloat(line[2])
            };
        });

        const transcript = fullTranscript.map(item => item.text).join(' ').trim();

        return {
            transcript,
            fullTranscript,
            videoId,
            language: languageCode,
        };
    } catch (error) {
        console.log('Transcript URL fetch error:', (error as Error).message);
        return null;
    }
}

function extractVideoId(url: string): string | null {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/ ]{11})/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
    }
    return null;
}