// Gemini 2.5 Flash (preview) REST boilerplate
// Gemini 2.5 Flash (preview) REST boilerplate
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; // now reads from .env
const model = 'gemini-2.5-flash-preview-05-20';
const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

async function callGemini(promptParts) {
  if (!apiKey) {
    return { text: '(AI key missing. Provide an API key to enable AI features.)' };
  }
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: promptParts.map((t) => ({ text: t })) }]
    })
  });
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { text };
}

export async function generateDescription({ title, category, keywords }) {
  const prompt = [
    `Create a concise, friendly listing description for Fixify+.`,
    `Title: ${title}`,
    `Category: ${category}`,
    `Details/keywords: ${keywords || 'N/A'}`,
    `Constraints: 60-120 words, simple English, include contact via phone, safety and community tone.`
  ];
  return callGemini(prompt);
}

export async function summarizeReviews(reviews) {
  const raw = reviews?.map((r) => `- ${r}`).join('\n') || 'No reviews.';
  const prompt = [
    `Summarize these user reviews for a marketplace listing in 2-3 sentences.`,
    raw
  ];
  return callGemini(prompt);
}