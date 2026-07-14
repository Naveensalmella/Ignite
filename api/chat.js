// Vercel Serverless Function — AI Chat + Food Analysis
// Supports GEMINI (primary) and GROQ (backup)
// Set GEMINI_API_KEY or GROQ_API_KEY in Vercel env vars

async function callGemini(apiKey, messages, system, mode, imageBase64) {
  // Food analysis mode
  if (mode === "food_analyze" && imageBase64) {
    const body = {
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
          { text: `Analyze this food image. Identify every food item. Return ONLY a JSON array, no markdown:\n[{"name":"Food","emoji":"🍽️","cal":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"serving":"size","confidence":"high"}]` }
        ]
      }],
      generationConfig: { maxOutputTokens: 1024, temperature: 0.2 },
    };
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error?.message || 'Gemini failed');
    const data = await r.json();
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "[]";
    let cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) cleaned = match[0];
    return { foods: JSON.parse(cleaned) };
  }

  // Food search mode
  if (mode === "food_search") {
    const body = {
      contents: [{ role: "user", parts: [{ text: `Give me the nutrition data per 100 grams for: "${messages}". Return ONLY a JSON array:\n[{"name":"Food Name","emoji":"🍽️","cal":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"category":"Category"}]\nBe accurate. If multiple items, return all. No markdown, no explanation, ONLY the JSON array.` }] }],
      generationConfig: { maxOutputTokens: 512, temperature: 0.1 },
    };
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error?.message || 'Gemini failed');
    const data = await r.json();
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "[]";
    let cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) cleaned = match[0];
    return { foods: JSON.parse(cleaned) };
  }

  // Chat mode
  const geminiMsgs = messages.slice(-20).map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const cleaned = [];
  for (const msg of geminiMsgs) {
    if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== msg.role) cleaned.push(msg);
    else cleaned[cleaned.length - 1].parts[0].text += "\n" + msg.parts[0].text;
  }
  if (cleaned.length > 0 && cleaned[0].role === "model") cleaned.shift();

  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: cleaned,
      systemInstruction: { parts: [{ text: system || "You are a helpful assistant." }] },
      generationConfig: { maxOutputTokens: 1024, temperature: 0.8 },
    }),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error?.message || 'Gemini failed');
  const data = await r.json();
  return { content: [{ type: "text", text: data.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n") || "No response" }] };
}

async function callGroq(apiKey, messages, system, mode) {
  // Food search mode
  if (mode === "food_search") {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Return ONLY a JSON array of nutrition data per 100g. No markdown, no explanation." },
          { role: "user", content: `Nutrition per 100g for: "${messages}". Return: [{"name":"","emoji":"","cal":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"category":""}]` }
        ],
        max_tokens: 512, temperature: 0.1,
      }),
    });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error?.message || 'Groq failed');
    const data = await r.json();
    const text = data.choices?.[0]?.message?.content || "[]";
    let cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) cleaned = match[0];
    return { foods: JSON.parse(cleaned) };
  }

  // Food analyze - Groq doesn't support images, return error
  if (mode === "food_analyze") {
    throw new Error("Image analysis requires Gemini. Set GEMINI_API_KEY for food scanning.");
  }

  // Chat mode
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: system || "You are a helpful assistant." }, ...messages.slice(-20)],
      max_tokens: 1024, temperature: 0.8,
    }),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error?.message || 'Groq failed');
  const data = await r.json();
  return { content: [{ type: "text", text: data.choices?.[0]?.message?.content || "No response" }] };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (!geminiKey && !groqKey) {
    return res.status(500).json({
      error: 'No AI API key configured. Add GEMINI_API_KEY or GROQ_API_KEY in Vercel → Settings → Environment Variables, then Redeploy.',
      setup: {
        gemini: 'Get free key at: https://aistudio.google.com/apikey',
        groq: 'Get free key at: https://console.groq.com/keys',
      }
    });
  }

  try {
    const { messages, system, mode, imageBase64 } = req.body;

    // Try Gemini first, then Groq as fallback
    if (geminiKey) {
      try {
        const result = await callGemini(geminiKey, messages, system, mode, imageBase64);
        return res.status(200).json(result);
      } catch (geminiErr) {
        console.error('Gemini error:', geminiErr.message);
        // If Groq is available, try it as fallback
        if (groqKey && mode !== "food_analyze") {
          console.log('Falling back to Groq...');
          const result = await callGroq(groqKey, messages, system, mode);
          return res.status(200).json(result);
        }
        throw geminiErr; // No fallback available
      }
    }

    // Only Groq available
    if (groqKey) {
      const result = await callGroq(groqKey, messages, system, mode);
      return res.status(200).json(result);
    }

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
};