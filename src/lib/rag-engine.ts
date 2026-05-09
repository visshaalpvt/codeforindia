import datasetData from "../data/knowledge/forensic_qa_dataset.json";

export interface QARecord {
  id: number;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  difficulty: string;
  source: string;
}

function loadDataset(): QARecord[] {
  return datasetData as QARecord[];
}

// Simple stop words list
const STOP_WORDS = new Set(["a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "if", "in", "into", "is", "it", "no", "not", "of", "on", "or", "such", "that", "the", "their", "then", "there", "these", "they", "this", "to", "was", "will", "with", "what", "how", "why", "when", "where", "does", "do", "can", "should"]);

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

// A simple TF-IDF based scoring function for keyword matching
export function retrieveKnowledge(query: string, topK: number = 5): QARecord[] {
  const dataset = loadDataset();
  if (!dataset || dataset.length === 0) return [];

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const scoredRecords = dataset.map(record => {
    let score = 0;
    const qTokens = tokenize(record.question);
    const aTokens = tokenize(record.answer);
    
    // Check keywords (highest weight)
    for (const token of queryTokens) {
      if (record.keywords.some(kw => kw.toLowerCase().includes(token))) {
        score += 5;
      }
      if (qTokens.includes(token)) {
        score += 3;
      }
      if (aTokens.includes(token)) {
        score += 1;
      }
    }
    
    return { record, score };
  });

  // Sort by score descending
  scoredRecords.sort((a, b) => b.score - a.score);

  // Return the top K that have at least some relevance (score > 0)
  return scoredRecords.filter(item => item.score > 0).slice(0, topK).map(item => item.record);
}

export function formatKnowledgeContext(records: QARecord[]): string {
  if (!records || records.length === 0) return "";
  
  const header = "--- RELEVANT FORENSIC KNOWLEDGE BASE (STATIC SOPs) ---\n";
  const body = records.map(r => `[Category: ${r.category}] Q: ${r.question}\nA: ${r.answer}`).join("\n\n");
  
  return `\n\n${header}${body}\n------------------------------------------------------\n`;
}
