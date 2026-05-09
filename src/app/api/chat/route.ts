import { NextResponse } from "next/server";
import { aiClient, DEFAULT_MODEL } from "@/lib/ai-client";
import { retrieveKnowledge, formatKnowledgeContext } from "@/lib/rag-engine";

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // --- RAG Knowledge Retrieval ---
    // Get the latest user message to query the knowledge base
    const lastUserMessage = messages.filter(m => m.role === "user").pop();
    let knowledgeContext = "";
    if (lastUserMessage) {
      const retrievedRecords = retrieveKnowledge(lastUserMessage.content, 5);
      knowledgeContext = formatKnowledgeContext(retrievedRecords);
    }

    // Inject the knowledge context into the system prompt (which should be the first message)
    const augmentedMessages = [...messages];
    if (augmentedMessages.length > 0 && augmentedMessages[0].role === "system") {
      augmentedMessages[0].content += knowledgeContext;
    } else if (knowledgeContext) {
      augmentedMessages.unshift({ role: "system", content: "You are an AI Forensic Assistant." + knowledgeContext });
    }

    const response = await aiClient.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: augmentedMessages,
      max_tokens: 2048,
      temperature: 0.7,
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
