import { GoogleGenAI, Type } from "@google/genai";
import { Holding, MarketTrend } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to clean JSON string if Markdown code blocks are present
const cleanJsonString = (str: string) => {
  // Try to match a JSON code block first
  const match = str.match(/```json\s*([\s\S]*?)\s*```/);
  if (match) return match[1];
  
  // Fallback: match any code block
  const matchGeneric = str.match(/```\s*([\s\S]*?)\s*```/);
  if (matchGeneric) return matchGeneric[1];
  
  // Fallback: strip potential markdown ticks if no block structure found but just ticks
  return str.replace(/```json\n?|\n?```/g, "").trim();
};

/**
 * Analyzes an investment screenshot (e.g., Alipay/Broker) to extract holdings.
 */
export const analyzeScreenshot = async (base64Image: string): Promise<Partial<Holding>[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png', // Assumes PNG/JPEG compatible
              data: base64Image
            }
          },
          {
            text: `Analyze this investment screenshot. Extract the list of stock holdings. 
            For each holding, identify the Stock Name, Stock Symbol (if visible, otherwise guess based on name), 
            Quantity (number of shares), and Profit/Loss amount. 
            If exact quantity isn't visible, estimate or leave as 0.
            Return ONLY a JSON array.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              symbol: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              profit: { type: Type.NUMBER },
              currentPrice: { type: Type.NUMBER, description: "Current price if visible, else 0" }
            },
            required: ["name", "profit"]
          }
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(cleanJsonString(response.text));
      return parsed.map((item: any) => ({
        ...item,
        id: crypto.randomUUID(),
        updatedAt: Date.now(),
        avgPrice: 0,
        profitPercent: 0,
        notes: "截图导入"
      }));
    }
    return [];
  } catch (error) {
    console.error("Error analyzing screenshot:", error);
    throw error;
  }
};

/**
 * Uses Google Search Grounding to analyze market trends for specific stocks.
 */
export const analyzeMarketTrends = async (holdings: Holding[]): Promise<MarketTrend[]> => {
  if (holdings.length === 0) return [];

  // Group by unique symbol to avoid duplicate requests
  const symbols = Array.from(new Set(holdings.map(h => h.name + (h.symbol ? ` (${h.symbol})` : ''))));
  const queryList = symbols.join(", ");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Search for the latest financial news and market sentiment for the following assets: ${queryList}. 
      For each asset, provide a brief summary in Chinese (中文) of the latest news and judge the trend (bullish/bearish/neutral).
      
      Return a raw JSON array (do not include markdown text outside the JSON) where each object has:
      - "symbol": string
      - "sentiment": "bullish" | "bearish" | "neutral"
      - "summary": string (in Chinese)
      `,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType and responseSchema are NOT supported when using googleSearch tools
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web?.uri && chunk.web?.title)
      .map((chunk: any) => ({ title: chunk.web.title, uri: chunk.web.uri }));

    if (response.text) {
      const parsed = JSON.parse(cleanJsonString(response.text));
      return parsed.map((item: any) => ({
        ...item,
        sources: sources.slice(0, 3), // Attach top 3 general sources to each for context
        timestamp: Date.now()
      }));
    }
    return [];
  } catch (error) {
    console.error("Error analyzing trends:", error);
    return [];
  }
};