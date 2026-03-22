// pages/api/ai.js  — Claude API (서버 전용, 키 보호)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { prompt, maxTokens = 1500 } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Claude API error:", JSON.stringify(err));
      return res.status(response.status).json({ error: err?.error?.message || "Claude API 오류" });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    console.error("API handler error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
