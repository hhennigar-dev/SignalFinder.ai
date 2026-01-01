
import { GoogleGenAI, Type } from "@google/genai";
import { ValidationReport, OpportunityStatus } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function huntSignals(topic: string): Promise<ValidationReport> {
  const prompt = `
    Analyze recent online discussions (last 6 months) on Reddit, IndieHackers, and niche forums related to: "${topic}".
    
    Research Goal: Identify the top 5-7 distinct, recurring business problems or pain points that users are complaining about.
    
    For each problem identified:
    1. Extract 3-5 high-signal evidence quotes with metadata (author, source, engagement, date, and original URL).
    2. Score the Frequency (1-10) based on how often it's mentioned.
    3. Score the Urgency (1-10) based on language intensity (e.g., "struggling", "hate", "urgent", "desperate").
    4. Score the Monetization (1-10) based on willingness-to-pay signals (e.g., "paying too much", "would pay", "expensive tool").
    5. Perform sentiment breakdown (Frustration, Desperation, Cost Pain).
    6. Provide a key insight and specific actionable next steps.
    
    CRITICAL: 
    - Use ONLY real data found via search. 
    - Do not hallucinate quotes.
    - Status mapping: 8.0+ is "strong", 6.0-7.9 is "medium", <6.0 is "weak".
    - Overall Score formula: (Frequency * 0.3 + Urgency * 0.4 + Monetization * 0.3).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          meta: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              discussions_analyzed: { type: Type.INTEGER },
              sources: { type: Type.ARRAY, items: { type: Type.STRING } },
              date_range: { type: Type.STRING }
            },
            required: ["topic", "discussions_analyzed", "sources", "date_range"]
          },
          problems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                statement: { type: Type.STRING },
                scores: {
                  type: Type.OBJECT,
                  properties: {
                    frequency: { type: Type.NUMBER },
                    urgency: { type: Type.NUMBER },
                    monetization: { type: Type.NUMBER },
                    overall: { type: Type.NUMBER },
                    status: { type: Type.STRING, enum: ["strong", "medium", "weak"] }
                  },
                  required: ["frequency", "urgency", "monetization", "overall", "status"]
                },
                quotes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      author: { type: Type.STRING },
                      source: { type: Type.STRING },
                      engagement: { type: Type.STRING },
                      date: { type: Type.STRING },
                      url: { type: Type.STRING }
                    },
                    required: ["text", "author", "source", "date"]
                  }
                },
                sentiment: {
                  type: Type.OBJECT,
                  properties: {
                    frustration: { type: Type.NUMBER },
                    desperation: { type: Type.NUMBER },
                    cost_pain: { type: Type.NUMBER },
                    intensity: { type: Type.STRING, enum: ["high", "medium", "low"] },
                    insight: { type: Type.STRING }
                  },
                  required: ["frustration", "desperation", "cost_pain", "intensity", "insight"]
                },
                next_steps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["id", "statement", "scores", "quotes", "sentiment", "next_steps"]
            }
          }
        },
        required: ["meta", "problems"]
      }
    }
  });

  // Extract text and trim before parsing
  const jsonStr = response.text?.trim() || "{}";
  const report = JSON.parse(jsonStr) as ValidationReport;

  // Extract URLs from groundingChunks and list them in meta.sources as required
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    const searchUrls = groundingChunks
      .map(chunk => chunk.web?.uri)
      .filter((uri): uri is string => !!uri);
    
    if (searchUrls.length > 0) {
      report.meta.sources = Array.from(new Set([...report.meta.sources, ...searchUrls]));
    }
  }

  return report;
}
