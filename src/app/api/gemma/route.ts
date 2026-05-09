import { NextResponse } from "next/server";
import { aiClient, DEFAULT_MODEL } from "@/lib/ai-client";

export async function POST(request: Request) {
  try {
    const { messages, max_tokens } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const response = await aiClient.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      max_tokens: max_tokens || 1024,
    });

    return NextResponse.json({
      response: response.choices[0].message.content,
    });
  } catch (error: any) {
    console.error("Gemma API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gemma AI processing failed" },
      { status: 500 }
    );
  }
}
