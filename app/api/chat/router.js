export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM_PROMPT = `Kamu adalah Yumna Ai, asisten AI yang ramah, cerdas, dan sedikit playful.
Kamu menjawab dengan bahasa yang sama seperti yang dipakai pengguna (default Bahasa Indonesia).
Gunakan format yang rapi dan mudah dibaca. Jangan pernah mengaku sebagai Google Gemini — kamu adalah Yumna Ai.
Jika pengguna meminta gambar, arahkan mereka ke tab "Bikin Gambar".`;

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest',
  'gemini-1.5-flash',
];

export async function POST(req) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    return Response.json(
      { error: 'GEMINI_API_KEY belum diset di Environment Variables Vercel. Tambahkan lalu Redeploy.' },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Format request tidak valid.' }, { status: 400 });
  }

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  if (messages.length === 0) {
    return Response.json({ error: 'Pesan kosong.' }, { status: 400 });
  }

  const contents = messages
    .filter((m) => m && typeof m.text === 'string' && m.text.trim())
    .map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

  while (contents.length && contents[0].role !== 'user') contents.shift();
  if (contents.length === 0) {
    return Response.json({ error: 'Tidak ada pesan pengguna.' }, { status: 400 });
  }

  const payload = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      maxOutputTokens: 4096,
    },
  };

  let lastError = 'Gagal menghubungi Gemini API.';

  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        lastError = data?.error?.message || `Error ${res.status} pada model ${model}`;
        console.error(`[chat] ${model} gagal:`, lastError);
        continue;
      }

      const blocked = data?.promptFeedback?.blockReason;
      if (blocked) {
        return Response.json(
          { error: `Pesan diblokir oleh filter keamanan (${blocked}). Coba ubah pertanyaanmu.` },
          { status: 400 }
        );
      }

      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((p) => p.text)
          .filter(Boolean)
          .join('')
          .trim() || '';

      if (!text) {
        lastError = 'Yumna Ai tidak mengembalikan jawaban. Coba lagi.';
        continue;
      }

      return Response.json({ text, model });
    } catch (err) {
      lastError = err?.message || 'Terjadi kesalahan jaringan.';
      console.error(`[chat] ${model} error:`, lastError);
    }
  }

  return Response.json({ error: lastError }, { status: 502 });
}
