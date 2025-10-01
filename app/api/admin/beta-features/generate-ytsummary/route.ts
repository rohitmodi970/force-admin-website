// app\api\admin\beta-features\generate-ytsummary\route.ts
import { NextRequest, NextResponse } from 'next/server';

interface RequestBody {
  transcript: string;
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
    const { transcript } = body;

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    // Call the Gemini API
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
            text: `Please provide a concise summary of the following transcript from a YouTube video. Focus on the main topics, key points, and important takeaways. Format the summary as bullet points or short paragraphs:\n\n${transcript.substring(0, 8000)}`
          }]
        }]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      return NextResponse.json({ error: 'Failed to generate summary with Gemini' }, { status: 500 });
    }

    const data: GeminiResponse = await response.json();
    let summary = '';

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      summary = data.candidates[0].content.parts?.[0]?.text || '';
    } else {
      summary = "Could not generate summary from the response.";
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}