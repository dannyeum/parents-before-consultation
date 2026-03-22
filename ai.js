// pages/api/ai.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { prompt, maxTokens = 1500 } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // ── 디버그: API 키 확인 ──
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY 환경변수가 없습니다. Vercel 설정을 확인해주세요." });
  }
  if (!apiKey.startsWith("sk-ant-")) {
    return res.status(500).json({ error: `API 키 형식이 올바르지 않습니다. 현재 시작: ${apiKey.substring(0, 10)}...` });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",   // 가장 저렴하고 빠른 모델
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    // HTTP 에러 시 상세 내용 반환
    if (!response.ok) {
      const errText = await response.text();
      console.error("Claude API HTTP error:", response.status, errText);
      return res.status(response.status).json({
        error: `Claude API 오류 (${response.status}): ${errText}`
      });
    }

    const data = await response.json();

    // 응답 구조 확인
    if (!data.content || !data.content[0]) {
      console.error("Unexpected response:", JSON.stringify(data));
      return res.status(500).json({ error: "Claude 응답 구조 오류: " + JSON.stringify(data) });
    }

    return res.status(200).json(data);

  } catch (e) {
    console.error("Fetch error:", e.message);
    return res.status(500).json({ error: "네트워크 오류: " + e.message });
  }
}
