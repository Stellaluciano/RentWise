// /functions/api/analyze.js
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { address, language } = await request.json();

    const prompts = {
      en: `You are a location analysis expert. Analyze this location: ${address}.
Provide a brief description and rating (1-5) for each of:
1. Safety
2. Accessibility
3. Convenience & Lifestyle
Respond ONLY in English as JSON with keys: safety, accessibility, convenience.`,
      zh: `你是一个位置分析专家。分析这个位置：${address}。
为以下类别提供简要描述与评分（1-5）：
1. 安全性 2. 便利性 3. 生活方式
用中文回答，输出 JSON，包含键 safety, accessibility, convenience。`,
      es: `Eres un experto en análisis de ubicaciones. Analiza esta ubicación: ${address}.
Proporciona descripción y calificación (1-5) para:
1. Seguridad 2. Accesibilidad 3. Conveniencia y estilo de vida.
Responde solo en español en formato JSON con claves: safety, accessibility, convenience.`
    };

    const content = prompts[language] ?? prompts.en;

    // 调用 OpenAI API
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.OPENAI_API_KEY}` // 从 Cloudflare secret 读取
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content }]
      })
    });

    if (!r.ok) {
      const text = await r.text();
      return new Response(JSON.stringify({ error: text }), { status: 500 });
    }

    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { error: "Model did not return valid JSON", raw };
    }

    return Response.json(parsed);
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
