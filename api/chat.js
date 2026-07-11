// Vercel Serverless Function — Secure proxy for Google Gemini API (FREE)
// Place at: api/chat.js (project root)
// Add GEMINI_API_KEY to Vercel Environment Variables
// Get your free key: https://aistudio.google.com/apikey

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured. Add it in Vercel → Settings → Environment Variables.' });
  }

  try {
    const { messages, system } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    // Convert from our format to Gemini format
    // Our format: { role: "user"/"assistant", content: "text" }
    // Gemini format: { role: "user"/"model", parts: [{ text: "text" }] }
    const geminiMessages = messages.slice(-20).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Gemini requires alternating user/model messages
    // Filter out consecutive same-role messages
    const cleaned = [];
    for (const msg of geminiMessages) {
      if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== msg.role) {
        cleaned.push(msg);
      } else {
        // Merge with previous message of same role
        cleaned[cleaned.length - 1].parts[0].text += "\n" + msg.parts[0].text;
      }
    }

    // Ensure first message is from user
    if (cleaned.length > 0 && cleaned[0].role === "model") {
      cleaned.shift();
    }

    const body = {
      contents: cleaned,
      systemInstruction: {
        parts: [{ text: system || "You are a helpful assistant." }],
      },
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.8,
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', errorData);
      return res.status(response.status).json({
        error: errorData.error?.message || 'Gemini API request failed',
      });
    }

    const data = await response.json();

    // Convert Gemini response to our format
    const text = data.candidates?.[0]?.content?.parts
      ?.map(p => p.text)
      .join("\n") || "The Oracle is silent. Try again.";

    // Return in same format as before so AIChat.jsx doesn't need changes
    return res.status(200).json({
      content: [{ type: "text", text }],
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};
