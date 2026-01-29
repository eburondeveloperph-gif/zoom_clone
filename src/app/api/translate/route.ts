import { NextRequest, NextResponse } from 'next/server';

// Use Edge runtime for lower latency
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage, sourceLanguage } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'Orbit AI API key not configured' },
        { status: 500 }
      );
    }

    const languageNames: Record<string, string> = {
      en: 'English', es: 'Spanish', fr: 'French', de: 'German',
      it: 'Italian', pt: 'Portuguese', nl: 'Dutch', pl: 'Polish',
      ru: 'Russian', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
      ar: 'Arabic', hi: 'Hindi', th: 'Thai', vi: 'Vietnamese',
      tr: 'Turkish', sv: 'Swedish', da: 'Danish', no: 'Norwegian',
      fi: 'Finnish', el: 'Greek', he: 'Hebrew', id: 'Indonesian',
      ms: 'Malay', tl: 'Filipino', uk: 'Ukrainian', cs: 'Czech',
      sk: 'Slovak', hu: 'Hungarian', ro: 'Romanian', bg: 'Bulgarian',
    };

    const targetLangName = languageNames[targetLanguage] || targetLanguage;
    const sourceLangName = sourceLanguage ? languageNames[sourceLanguage] || sourceLanguage : 'auto-detected language';

    const systemPrompt = `You are a professional translator. Translate the following text to ${targetLangName}. 
Only output the translation, nothing else. Maintain the original tone and style.
${sourceLanguage ? `The source language is ${sourceLangName}.` : 'Auto-detect the source language.'}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Translation failed' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content?.trim();

    if (!translatedText) {
      return NextResponse.json(
        { error: 'No translation received' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      translatedText,
      sourceLanguage: sourceLanguage || 'auto',
      targetLanguage,
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
