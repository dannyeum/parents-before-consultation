// pages/api/ai.js
// Google Gemini API (무료) 사용 — API 키는 서버에만 존재, 브라우저에 절대 노출되지 않음
// 무료 한도: Gemini 1.5 Flash 기준 분당 15회 / 하루 1,500회
// 키 발급: https://aistudio.google.com/app/apikey

const GEMINI_MODEL = "gemini-1.5-flash";
// 더 높은 품질: "gemini-1.5-pro" (무료 한도 분당 2회 / 하루 50회)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, maxTokens = 1500 } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "prompt is required" });
  }

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Google Gemini API key가 서버에 설정되지 않았습니다." });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.7,
          },
          systemInstruction: {
            parts: [{
              text: "당신은 초등학교 교사를 돕는 학생 상담 분석 전문가입니다. 항상 요청한 JSON 형식만 반환하고, 마크다운 코드블록(```)이나 다른 텍스트는 절대 포함하지 마세요.",
            }],
          },
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      console.error("Gemini API error:", errData);
      if (response.status === 429) {
        return res.status(429).json({
          error: "API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요. (무료 한도: 분당 15회)",
        });
      }
      return res.status(response.status).json({ error: errData });
    }

    const data = await response.json();

    // Gemini 응답에서 텍스트 추출
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: "Gemini 응답이 비어있습니다." });
    }

    // 프론트엔드가 그대로 동작하도록 Claude 형식으로 래핑
    return res.status(200).json({
      content: [{ type: "text", text }],
    });
  } catch (error) {
    console.error("Gemini API 호출 오류:", error);
    return res.status(500).json({ error: error.message });
  }
}
