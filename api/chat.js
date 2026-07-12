// Vercel Serverless Function — Gemini API (Chat + Food Image Analysis)
// Supports text chat AND image-based food nutrition analysis

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  try {
    const { messages, system, mode, imageBase64 } = req.body;

    // ═══ FOOD ANALYSIS MODE ═══
    if (mode === "food_analyze" && imageBase64) {
      const foodPrompt = `Analyze this food image carefully. Identify EVERY food item visible in the image.

For each food item, estimate the nutritional values per serving shown in the image.

Return ONLY a valid JSON array, no markdown, no backticks, no explanation. Each object must have exactly these fields:
[
  {
    "name": "Food name",
    "emoji": "relevant emoji",
    "cal": estimated calories (number),
    "protein": grams of protein (number),
    "carbs": grams of carbs (number),
    "fat": grams of fat (number),
    "fiber": grams of fiber (number),
    "serving": "estimated serving size description",
    "confidence": "high" or "medium" or "low"
  }
]

Be as accurate as possible. If you see rice, estimate for the amount visible. If you see curry, estimate its nutrition. Include ALL items you can identify. If you cannot identify the food clearly, still give your best estimate with confidence "low".

Return ONLY the JSON array. Nothing else.`;

      const body = {
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
            { text: foodPrompt }
          ]
        }],
        generationConfig: { maxOutputTokens: 1024, temperature: 0.2 },
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return res.status(response.status).json({ error: err.error?.message || 'Gemini API failed' });
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "[]";

      // Clean and parse JSON
      let cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      // Try to extract JSON array
      const arrMatch = cleaned.match(/\[[\s\S]*\]/);
      if (arrMatch) cleaned = arrMatch[0];

      try {
        const foods = JSON.parse(cleaned);
        return res.status(200).json({ foods: Array.isArray(foods) ? foods : [foods] });
      } catch (parseErr) {
        return res.status(200).json({ foods: [], raw: text, error: "Could not parse food data" });
      }
    }

    // ═══ NORMAL CHAT MODE ═══
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    const geminiMessages = messages.slice(-20).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const cleaned = [];
    for (const msg of geminiMessages) {
      if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== msg.role) {
        cleaned.push(msg);
      } else {
        cleaned[cleaned.length - 1].parts[0].text += "\n" + msg.parts[0].text;
      }
    }
    if (cleaned.length > 0 && cleaned[0].role === "model") cleaned.shift();

    const body = {
      contents: cleaned,
      systemInstruction: { parts: [{ text: system || "You are a helpful assistant." }] },
      generationConfig: { maxOutputTokens: 1024, temperature: 0.8 },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || 'Gemini API failed' });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n") || "The Oracle is silent.";
    return res.status(200).json({ content: [{ type: "text", text }] });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
};