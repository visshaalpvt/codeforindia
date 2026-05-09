/**
 * Shared AI helper — calls Groq API for forensic analysis.
 * Used by all modules that need AI-generated insights.
 */

const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function askGemma(prompt: string, systemPrompt?: string): Promise<string> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY || "";

    const messages: { role: string; content: string }[] = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    } else {
      messages.push({
        role: "system",
        content: "You are AIVENTRA, a professional forensic AI assistant. Provide detailed, accurate forensic analysis with confidence levels. Be concise but thorough.",
      });
    }

    messages.push({ role: "user", content: prompt });

    const res = await fetch(GROQ_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("Groq API error:", errData);
      throw new Error(errData.error?.message || `API returned ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "No response generated.";
  } catch (error: any) {
    console.error("askGemma error:", error);
    return `Forensic Analysis (offline mode):\n- The AI engine encountered a temporary issue.\n- Error: ${error.message}\n- Please retry in a moment.`;
  }
}

/**
 * Generate a forensic analysis prompt for a specific module context.
 */
export function buildForensicPrompt(module: string, context: Record<string, any>): string {
  const base = `As AIVENTRA forensic AI, analyze the following ${module} data:\n\n`;
  const contextStr = Object.entries(context)
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join("\n");
  return base + contextStr + "\n\nProvide a professional forensic assessment.";
}
