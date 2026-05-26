import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

let anthropic: Anthropic | null = null;
let genAI: GoogleGenerativeAI | null = null;

function getAnthropic(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[Claude] ANTHROPIC_API_KEY is not set");
    return null;
  }
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

function getGemini(): GoogleGenerativeAI | null {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("[Gemini] GEMINI_API_KEY is not set");
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

export async function generateText(prompt: string): Promise<string> {
  const provider = process.env.AI_PROVIDER?.toLowerCase() || "gemini";

  if (provider === "claude") {
    return generateTextClaude(prompt);
  } else {
    return generateTextGemini(prompt);
  }
}

async function generateTextClaude(prompt: string): Promise<string> {
  const client = getAnthropic();

  if (!client) {
    return "AI insights temporarily unavailable. Please add your ANTHROPIC_API_KEY to enable Claude.";
  }

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      return content.text;
    }
    return "Error: Unexpected response format from Claude.";
  } catch (err) {
    console.error("[Claude] Error generating content:", err);
    return `ERROR: ${err instanceof Error ? err.message : String(err)}`;
  }
}

async function generateTextGemini(prompt: string): Promise<string> {
  const client = getGemini();

  if (!client) {
    return "AI insights temporarily unavailable. Please add your GEMINI_API_KEY to enable Gemini.";
  }

  try {
    const model = client.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error("[Gemini] Error generating content:", err);
    return `ERROR: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export async function generateMarketBriefing(): Promise<string> {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = `You are a financial analyst AI. Today's date is ${today}. Generate a 3-sentence personalized stock market briefing for a retail investor. Be concise, clear, and mention general market conditions. Do not give specific buy/sell advice. Keep it factual and balanced.`;

  return generateText(prompt);
}

export async function generateComparisonVerdict(
  symbols: string[],
  scores: number[],
  days: number = 7
): Promise<string> {
  const stocksInfo = symbols
    .map((s, i) => `${s} (AI Score: ${scores[i]})`)
    .join(", ");

  const prompt = `Given these stocks: ${stocksInfo}, which is the strongest pick for a ${days}-day horizon? Explain in 2 sentences for a retail investor. Be objective and mention the AI scores in your reasoning.`;

  return generateText(prompt);
}
