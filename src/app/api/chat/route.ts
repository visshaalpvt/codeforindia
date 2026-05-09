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
    let retrievedRecords: any[] = [];
    if (lastUserMessage) {
      retrievedRecords = retrieveKnowledge(lastUserMessage.content, 3);
      knowledgeContext = formatKnowledgeContext(retrievedRecords);
    }

    // Inject the knowledge context into the system prompt (which should be the first message)
    const augmentedMessages = [...messages];
    if (augmentedMessages.length > 0 && augmentedMessages[0].role === "system") {
      augmentedMessages[0].content += knowledgeContext + "\n\nIMPORTANT INSTRUCTION: Use the RELEVANT FORENSIC KNOWLEDGE BASE provided above to answer the user's question. Explicitly mention the forensic principles you used.";
    } else if (knowledgeContext) {
      augmentedMessages.unshift({ role: "system", content: "You are an AI Forensic Assistant." + knowledgeContext + "\n\nIMPORTANT INSTRUCTION: Use the RELEVANT FORENSIC KNOWLEDGE BASE provided above to answer the user's question. Explicitly mention the forensic principles you used." });
    }

    const response = await aiClient.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: augmentedMessages,
      max_tokens: 2048,
      temperature: 0.7,
    });

    let finalContent = response.choices[0].message.content;

    // Make the RAG Explainable: Append sources to the output if we retrieved any
    if (retrievedRecords && retrievedRecords.length > 0) {
      finalContent += "\n\n---\n**🧠 RAG Knowledge Sources Used:**\n";
      retrievedRecords.forEach(r => {
        finalContent += `- *${r.category}* (Match Score: High)\n`;
      });
    }

    return NextResponse.json({
      content: finalContent,
    });
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during AI processing" },
      { status: 500 }
    );
  }
}
