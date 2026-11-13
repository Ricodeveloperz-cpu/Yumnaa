export const runtime = 'nodejs';
export const maxDuration = 60;

async function tryGeminiImage(prompt, apiKey) {
  const models = [
    'gemini-2.5-flash-image',
    'gemini-2.5-flash-image-preview',
    'gemini-2.0-flash-exp-image-generation',
  ];

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
          }),
        }
      );

      if (!res.ok) {
        console.error(`[image] ${model} HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const imgPart = parts.find((p) => p.inlineData || p.inline_data);

      if (imgPart) {
        const inline = imgPart.inlineData || imgPart.inline_data;
        if (inline?.data) {
          return {
            b64: inline.data,
            mime: inline.mimeType || inline.mime_type || 'image/png',
          };
        }
      }
    } catch (err) {
      console.error(`[image] ${model} error:`, err?.message);
    }
  }

  return null;
}

async function tryImagen(prompt, apiKey) {
  const models = [
    'imagen-4.0-generate-001',
    'imagen-3.0-generate-002',
    'imagen-3.0-fast-generate-001',
  ];

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: { sampleCount: 1, aspectRatio: '1:1' },
          }),
        }
      );

      if (!res.ok) {
        console.error(`[imagen] ${model} HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      const pred = data?.predictions?.[0];

      if (pred?.bytesBase64Encoded) {
        return {
          b64: pred.bytesBase64Encoded,
          mime: pred.mimeType || 'image/png',
        };
      }
    } catch (err) {
      console.error(`[imagen] ${model} error:`, err?.message);
    }
  }

  return null;
}

export async function POST(req) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    return Response.json(
      { error: 'GEMINI_API_KEY belum diset di Environment Variables Vercel.' },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Format request tidak valid.' }, { status: 400 });
  }

  const prompt = (body?.prompt || '').toString().trim();

  if (!prompt) {
    return Response.json({ error: 'Prompt gambar kosong.' }, { status: 400 });
  }

  if (prompt.length > 1000) {
    return Response.json({ error: 'Prompt terlalu panjang (maks 1000 karakter).' }, { status: 400 });
  }

  const fullPrompt = `${prompt}. High quality, detailed, well-lit, sharp focus.`;

  let result = await tryGeminiImage(fullPrompt, apiKey);
  if (!result) result = await tryImagen(fullPrompt, apiKey);

  if (!result) {
    return Response.json(
      {
        error:
          'Gagal membuat gambar. Pastikan API key punya akses ke model image generation (Gemini 2.5 Flash Image / Imagen). Cek billing di Google AI Studio.',
      },
      { status: 502 }
    );
  }

  return Response.json({
    image: `data:${result.mime};base64,${result.b64}`,
    prompt,
  });
}
