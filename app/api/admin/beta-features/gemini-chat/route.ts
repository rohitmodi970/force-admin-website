import { NextRequest, NextResponse } from 'next/server';

interface RequestBody {
    transcript: string;
    userQuery: string;
}

interface GeminiResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                text: string;
            }>;
        };
    }>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body: RequestBody = await request.json();
        const { transcript, userQuery } = body;

        if (!transcript) {
            return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
        }

        if (!userQuery) {
            return NextResponse.json({ error: 'User query is required' }, { status: 400 });
        }

        // Call Gemini API for interactive conversation about the transcript
        const geminiApiKey = process.env.GEMINI_API_KEY;

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': geminiApiKey!,
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You're analyzing a transcript from a YouTube video. Here is the transcript:
                        
${transcript.substring(0, 6000)}

Based on this transcript, please respond to the following query from the user:
"${userQuery}"

Provide a helpful, informative response focusing only on information that can be found in or reasonably inferred from the transcript.`
                    }]
                }]
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API error:', errorData);
            return NextResponse.json({ error: 'Failed to get response from Gemini' }, { status: 500 });
        }

        const data: GeminiResponse = await response.json();
        let responseText = '';

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            responseText = data.candidates[0].content.parts?.[0]?.text || '';
        } else {
            responseText = "Sorry, I couldn't generate a response based on the transcript.";
        }

        return NextResponse.json({ response: responseText });
    } catch (error) {
        console.error('Error in Gemini chat:', error);
        return NextResponse.json({ error: 'Failed to process your query' }, { status: 500 });
    }
}