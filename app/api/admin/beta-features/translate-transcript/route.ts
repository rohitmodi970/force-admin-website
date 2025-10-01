import { NextRequest, NextResponse } from 'next/server';

interface RequestBody {
  transcript: string;
  targetLanguage: string;
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
    const { transcript, targetLanguage } = body;

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    if (!targetLanguage) {
      return NextResponse.json({ error: 'Target language is required' }, { status: 400 });
    }

    // Call Gemini API for translation
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
            text: `Translate the following transcript into ${targetLanguage}. Maintain the original meaning and tone while providing a natural translation:\n\n${transcript.substring(0, 8000)}`
          }]
        }]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      return NextResponse.json({ error: 'Failed to translate transcript with Gemini' }, { status: 500 });
    }

    const data: GeminiResponse = await response.json();
    let translatedText = '';

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      translatedText = data.candidates[0].content.parts?.[0]?.text || '';
    } else {
      translatedText = "Could not translate the transcript.";
    }

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error('Error translating transcript:', error);
    return NextResponse.json({ error: 'Failed to translate transcript' }, { status: 500 });
  }
}