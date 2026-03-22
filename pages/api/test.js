// pages/api/test.js — API 키 & 연결 테스트용 (배포 후 /api/test 접속)
export default async function handler(req, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      status: "❌ 실패",
      reason: "ANTHROPIC_API_KEY 환경변수가 없음",
      fix: "Vercel → Settings → Environment Variables에서 ANTHROPIC_API_KEY 추가 후 Redeploy"
    });
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
        model: "claude-haiku-4-5",
        max_tokens: 50,
        messages: [{ role: "user", content: "안녕하세요. '연결성공'이라고만 답하세요." }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        status: "❌ API 오류",
        httpStatus: response.status,
        error: data,
        keyPrefix: apiKey.substring(0, 14) + "...",
      });
    }

    return res.status(200).json({
      status: "✅ 연결 성공!",
      reply: data.content?.[0]?.text,
      model: data.model,
      keyPrefix: apiKey.substring(0, 14) + "...",
    });

  } catch (e) {
    return res.status(200).json({
      status: "❌ 네트워크 오류",
      error: e.message,
    });
  }
}
