import { NextResponse } from "next/server";
import { aiClient, DEFAULT_MODEL } from "@/lib/ai-client";

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const response = await aiClient.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: messages,
      max_tokens: 4096,
    });

    return NextResponse.json({
      content: response.choices[0].message.content,
    });
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during AI processing" },
      { status: 500 }
    );
  }
}
