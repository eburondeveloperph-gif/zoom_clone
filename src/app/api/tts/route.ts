import { NextRequest, NextResponse } from 'next/server';

// Use Edge runtime for lower latency
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId, speed } = await request.json();

    if (!text || !voiceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const cartesiaApiKey = process.env.CARTESIA_API_KEY;
    if (!cartesiaApiKey) {
      return NextResponse.json(
        { error: 'Orbit AI TTS key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'X-API-Key': cartesiaApiKey,
        'Cartesia-Version': '2024-06-10',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: 'sonic-english',
        transcript: text,
        voice: {
          mode: 'id',
          id: voiceId,
        },
        output_format: {
          container: 'mp3',
          encoding: 'mp3',
          sample_rate: 44100,
        },
        language: 'en',
        speed: speed || 1.0,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Cartesia API error:', error);
      return NextResponse.json(
        { error: 'Text-to-speech synthesis failed' },
        { status: 500 }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
