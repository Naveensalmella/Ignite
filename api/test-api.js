// TEST ENDPOINT — Visit your-site.vercel.app/api/test-api to check
// This will tell you exactly what's wrong

module.exports = async function handler(req, res) {
    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    const results = {
        gemini: { configured: !!geminiKey, keyPreview: geminiKey ? geminiKey.slice(0, 8) + "..." : "NOT SET" },
        groq: { configured: !!groqKey, keyPreview: groqKey ? groqKey.slice(0, 8) + "..." : "NOT SET" },
    };

    // Test Gemini if key exists
    if (geminiKey) {
        try {
            const r = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: "user", parts: [{ text: "Say hello in 3 words" }] }],
                        generationConfig: { maxOutputTokens: 20 },
                    }),
                }
            );
            const data = await r.json();
            if (r.ok) {
                results.gemini.status = "✅ WORKING";
                results.gemini.response = data.candidates?.[0]?.content?.parts?.[0]?.text || "Got response";
            } else {
                results.gemini.status = "❌ ERROR";
                results.gemini.error = data.error?.message || JSON.stringify(data.error || data);
            }
        } catch (e) {
            results.gemini.status = "❌ FETCH FAILED";
            results.gemini.error = e.message;
        }
    }

    // Test Groq if key exists
    if (groqKey) {
        try {
            const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "user", content: "Say hello in 3 words" }],
                    max_tokens: 20,
                }),
            });
            const data = await r.json();
            if (r.ok) {
                results.groq.status = "✅ WORKING";
                results.groq.response = data.choices?.[0]?.message?.content || "Got response";
            } else {
                results.groq.status = "❌ ERROR";
                results.groq.error = data.error?.message || JSON.stringify(data.error || data);
            }
        } catch (e) {
            results.groq.status = "❌ FETCH FAILED";
            results.groq.error = e.message;
        }
    }

    res.status(200).json({
        message: "IGNITE API Test",
        instructions: "Set GEMINI_API_KEY or GROQ_API_KEY in Vercel → Settings → Environment Variables, then Redeploy",
        results,
    });
};