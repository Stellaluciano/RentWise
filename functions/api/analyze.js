// /functions/api/analyze.js

const FALLBACK_BY_LANGUAGE = {
  en: {
    safety: {
      rating: 3,
      description: "Demo analysis: configure OPENAI_API_KEY to receive live location-specific safety insights."
    },
    accessibility: {
      rating: 3,
      description: "Demo analysis: accessibility details will appear here when the API is configured."
    },
    convenience: {
      rating: 3,
      description: "Demo analysis: convenience and lifestyle details will appear here when the API is configured."
    }
  },
  zh: {
    safety: {
      rating: 3,
      description: "演示分析：配置 OPENAI_API_KEY 后可获取实时且与地点相关的安全性洞察。"
    },
    accessibility: {
      rating: 3,
      description: "演示分析：配置 API 后，这里将显示该位置的便利性细节。"
    },
    convenience: {
      rating: 3,
      description: "演示分析：配置 API 后，这里将显示生活方式与周边配套细节。"
    }
  },
  es: {
    safety: {
      rating: 3,
      description: "Análisis de demostración: configura OPENAI_API_KEY para obtener información real de seguridad por ubicación."
    },
    accessibility: {
      rating: 3,
      description: "Análisis de demostración: aquí aparecerán detalles de accesibilidad cuando la API esté configurada."
    },
    convenience: {
      rating: 3,
      description: "Análisis de demostración: aquí aparecerán detalles de conveniencia y estilo de vida cuando la API esté configurada."
    }
  }
};

function getFallback(language) {
  return FALLBACK_BY_LANGUAGE[language] ?? FALLBACK_BY_LANGUAGE.en;
}

function clampRating(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 3;
  return Math.max(1, Math.min(5, Math.round(numeric)));
}

function normalizeAnalysis(raw, language) {
  const fallback = getFallback(language);

  const safety = raw?.safety ?? {};
  const accessibility = raw?.accessibility ?? {};
  const convenience = raw?.convenience ?? {};

  return {
    safety: {
      rating: clampRating(safety.rating),
      description:
        typeof safety.description === "string" && safety.description.trim()
          ? safety.description.trim()
          : fallback.safety.description
    },
    accessibility: {
      rating: clampRating(accessibility.rating),
      description:
        typeof accessibility.description === "string" && accessibility.description.trim()
          ? accessibility.description.trim()
          : fallback.accessibility.description
    },
    convenience: {
      rating: clampRating(convenience.rating),
      description:
        typeof convenience.description === "string" && convenience.description.trim()
          ? convenience.description.trim()
          : fallback.convenience.description
    }
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { address = "", language = "en" } = await request.json();

    if (!address || typeof address !== "string") {
      return Response.json(
        { error: "Missing or invalid 'address'.", fallback: getFallback(language) },
        { status: 400 }
      );
    }

    if (!env.OPENAI_API_KEY) {
      return Response.json(
        {
          error: "OPENAI_API_KEY is not configured in this environment.",
          fallback: getFallback(language)
        },
        { status: 500 }
      );
    }

    const prompts = {
      en: `You are a location analysis expert. Analyze this location: ${address}.\nProvide a brief description and rating (1-5) for each of: 1) Safety 2) Accessibility 3) Convenience & Lifestyle.`,
      zh: `你是一个位置分析专家。请分析该位置：${address}。\n请分别给出以下三项的简要描述与评分（1-5）：1）安全性 2）便利性 3）生活方式。`,
      es: `Eres un experto en análisis de ubicaciones. Analiza esta ubicación: ${address}.\nDevuelve una descripción breve y una calificación (1-5) para: 1) Seguridad 2) Accesibilidad 3) Conveniencia y estilo de vida.`
    };

    const content = prompts[language] ?? prompts.en;

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "rentwise_location_analysis",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                safety: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    rating: { type: "number" },
                    description: { type: "string" }
                  },
                  required: ["rating", "description"]
                },
                accessibility: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    rating: { type: "number" },
                    description: { type: "string" }
                  },
                  required: ["rating", "description"]
                },
                convenience: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    rating: { type: "number" },
                    description: { type: "string" }
                  },
                  required: ["rating", "description"]
                }
              },
              required: ["safety", "accessibility", "convenience"]
            }
          }
        },
        messages: [{ role: "user", content }]
      })
    });

    if (!openAiResponse.ok) {
      const text = await openAiResponse.text();
      return Response.json(
        {
          error: `OpenAI API error: ${text}`,
          fallback: getFallback(language)
        },
        { status: 500 }
      );
    }

    const data = await openAiResponse.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return Response.json(
        {
          error: "Model did not return valid JSON.",
          fallback: getFallback(language)
        },
        { status: 500 }
      );
    }

    return Response.json(normalizeAnalysis(parsed, language));
  } catch (e) {
    return Response.json(
      {
        error: e instanceof Error ? e.message : "Unexpected server error",
        fallback: getFallback("en")
      },
      { status: 500 }
    );
  }
}
