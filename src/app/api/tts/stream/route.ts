import { NextRequest } from 'next/server';

// Use Edge runtime for streaming TTS with low latency
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId, language } = await request.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Missing text' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cartesiaApiKey = process.env.CARTESIA_API_KEY;
    if (!cartesiaApiKey) {
      return new Response(JSON.stringify({ error: 'Orbit AI TTS key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Use streaming endpoint for lower latency
    const response = await fetch('https://api.cartesia.ai/tts/sse', {
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
          id: voiceId || 'a0e99841-438c-4a64-b679-ae501e7d6091', // Default voice
        },
        output_format: {
          container: 'raw',
          encoding: 'pcm_f32le',
          sample_rate: 24000,
        },
        language: language || 'en',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Cartesia streaming error:', error);
      return new Response(JSON.stringify({ error: 'TTS streaming failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Forward the SSE stream to the client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('TTS streaming error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
