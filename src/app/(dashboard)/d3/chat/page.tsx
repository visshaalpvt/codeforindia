"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Send, Bot, User, ChevronRight,
  PanelRightClose, Lightbulb, FileText, Clock,
  Activity, Shield, AlertTriangle, X,
} from "lucide-react";
import { cn, formatDateTime, riskColor } from "@/lib/utils";
import { useData } from "@/lib/store";
import { generateChatResponse, getAICaseContext } from "@/lib/dynamic-data";
import type { ChatMessage } from "@/types";

function ThinkingDots() {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
        <Bot className="w-3.5 h-3.5 text-violet-600" />
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-cyan-400"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>
      <span className="text-xs text-slate-400">AIVENTRA AI is thinking</span>
    </div>
  );
}

const suggestions = [
  "Show me all suspicious evidence",
  "Generate a case summary",
  "What's the estimated time of death?",
  "Who had access to Evidence E-007?",
];

function formatAIResponse(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let listIndex = 0;

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList && listItems.length > 0) {
        elements.push(
          <ol key={`list-${i}`} className="space-y-1.5 my-2">
            {listItems}
          </ol>,
        );
        listItems = [];
        inList = false;
      }
      return;
    }

    const numberedMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
    const bulletMatch = trimmed.match(/^[-*]\s*(.*)/);

    if (numberedMatch || bulletMatch) {
      inList = true;
      const content = numberedMatch ? numberedMatch[2] : bulletMatch![1];
      const idx = numberedMatch ? parseInt(numberedMatch[1]) : ++listIndex;
      const formatted = content
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/✅/g, "<span class='text-green-600'>✅</span>")
        .replace(/⚠️/g, "<span class='text-amber-600'>⚠️</span>");
      listItems.push(
        <li key={idx} className="text-sm text-slate-700 flex gap-2">
          <span className="text-violet-600 shrink-0">{idx}.</span>
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
        </li>,
      );
    } else {
      if (inList && listItems.length > 0) {
        elements.push(
          <ol key={`list-${i}`} className="space-y-1.5 my-2">
            {listItems}
          </ol>,
        );
        listItems = [];
        inList = false;
      }
      const formatted = trimmed
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/✅/g, "<span class='text-green-600'>✅</span>")
        .replace(/⚠️/g, "<span class='text-amber-600'>⚠️</span>");
      elements.push(
        <p
          key={`p-${i}`}
          className="text-sm text-slate-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />,
      );
    }
  });

  if (inList && listItems.length > 0) {
    elements.push(
      <ol key="list-end" className="space-y-1.5 my-2">
        {listItems}
      </ol>,
    );
  }

  return elements;
}

function TypewriterText({ text, speed = 20 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed(0);
    const interval = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(indexRef.current);
      if (indexRef.current >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <>{formatAIResponse(text.slice(0, displayed))}</>;
}



export default function ChatPage() {
  const { chatMessages, cases, evidence, anomalies, timelineEvents, addChatMessage } = useData();
  const caseData = cases[0];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [contextOpen, setContextOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addWelcomeMessage = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: chatMessages[0]?.content ?? "Welcome to AIVENTRA AI. I'm your investigative assistant. How can I help you today?",
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [chatMessages]);

  useEffect(() => {
    addWelcomeMessage();
  }, [addWelcomeMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || thinking) return;

    const trimmed = text.trim();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    addChatMessage({ role: "user", content: trimmed });

    try {
      const context = getAICaseContext(cases, evidence, anomalies, timelineEvents);
      
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: context },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: trimmed }
          ]
        }),
      });

      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      const aiContent = data.content;
      const aiId = `ai-${Date.now()}`;
      const aiMsg: ChatMessage = {
        id: aiId,
        role: "assistant",
        content: aiContent,
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, aiMsg]);
      setThinking(false);
      setStreamingId(aiId);

      addChatMessage({ role: "assistant", content: aiContent });

      // Keep the typewriter effect
      const totalLength = aiContent.length;
      let revealed = 0;
      const interval = setInterval(() => {
        revealed += 3;
        if (revealed >= totalLength) {
          clearInterval(interval);
          setStreamingId(null);
        }
      }, 25);
    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "⚠️ **Error:** I'm having trouble connecting to the AI core. Please check your API configuration.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setThinking(false);
    }
  }, [thinking, cases, evidence, anomalies, timelineEvents, addChatMessage, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const conversationHistory = [
    { id: "conv-1", title: "Case CI-2025-014 Analysis", icon: FileText },
    { id: "conv-2", title: "TOD Questions", icon: Clock },
    { id: "conv-3", title: "Evidence Review", icon: Lightbulb },
  ];

  return (
    <div className="relative h-[calc(100vh-5rem)] flex gap-0 animate-grid-bg">
      <motion.div
        layout
        className="shrink-0 w-56 lg:w-64 border-r border-white/5 overflow-y-auto
          backdrop-blur-xl bg-black/20 hidden md:flex flex-col"
      >
        <div className="p-3 border-b border-white/5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Conversations
          </h3>
        </div>
        <div className="p-2 space-y-1">
          {conversationHistory.map((conv) => {
            const Icon = conv.icon;
            return (
              <button
                key={conv.id}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left
                  text-xs text-slate-500 hover:text-gray-200 hover:bg-slate-50 hover:bg-slate-100
                  transition-all"
              >
                <Icon className="w-4 h-4 text-violet-600/60" />
                <span className="truncate">{conv.title}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-auto p-3 border-t border-white/5">
          <div className="backdrop-blur-md bg-cyan-500/5 border border-slate-200 rounded-xl p-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Active Case</p>
            <p className="text-xs font-medium text-violet-700 mt-0.5 truncate">{caseData?.id || "No Active Case"}</p>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-3 max-w-3xl",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "",
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                  msg.role === "user"
                    ? "bg-violet-100 text-violet-600"
                    : "bg-slate-100 text-slate-500",
                )}>
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "rounded-2xl px-4 py-3 max-w-[85%] md:max-w-[70%]",
                  msg.role === "user"
                    ? "bg-violet-100 border border-slate-300"
                    : "bg-slate-50 hover:bg-slate-100 border border-slate-200",
                )}>
                  {msg.role === "assistant" && streamingId === msg.id ? (
                    <TypewriterText text={msg.content} />
                  ) : msg.role === "assistant" ? (
                    <>{formatAIResponse(msg.content)}</>
                  ) : (
                    <p className="text-sm text-gray-200">{msg.content}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-2">
                    {new Date(msg.timestamp).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {thinking && <ThinkingDots />}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        <div className="shrink-0 px-4 pb-3 pt-2 border-t border-white/5">
          <div className="max-w-3xl mx-auto space-y-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  disabled={thinking}
                  className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-medium
                    bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500
                    hover:bg-violet-50 hover:border-slate-300 hover:text-violet-700
                    transition-all whitespace-nowrap disabled:opacity-40"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask AIVENTRA AI about this case..."
                className="flex-1 px-4 py-3 rounded-xl text-sm bg-slate-50 hover:bg-slate-100 border border-slate-200
                  text-gray-200 placeholder-gray-600 focus:outline-none focus:border-slate-400
                  transition-colors"
                disabled={thinking}
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || thinking}
                className="p-3 rounded-xl bg-violet-100 text-violet-600 border border-slate-300
                  hover:bg-violet-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed
                  hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {contextOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="shrink-0 border-l border-white/5 overflow-hidden
              backdrop-blur-xl bg-black/20 hidden lg:flex flex-col"
          >
            <div className="flex items-center justify-between p-3 border-b border-white/5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Context
              </h3>
              <button
                onClick={() => setContextOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 space-y-3 overflow-y-auto">
              <div className="backdrop-blur-md bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Current Case</p>
                <p className="text-sm font-semibold mt-1">{caseData?.id || "No Active Case"}</p>
                <p className="text-xs text-slate-500 truncate">{caseData?.title || "Pending Selection"}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-bold",
                    "text-red-600 border border-slate-300 bg-red-500/10",
                  )}>
                    {caseData?.priority || "None"}
                  </span>
                  <span className="text-[10px] text-slate-400">{caseData?.status || "None"}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="backdrop-blur-md bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-violet-600" />
                    <span className="text-xs text-slate-500">Evidence Items</span>
                  </div>
                  <p className="text-lg font-bold text-violet-700 mt-1">{caseData?.evidenceCount || 0}</p>
                </div>
                <div className="backdrop-blur-md bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs text-slate-500">Anomalies</span>
                  </div>
                  <p className="text-lg font-bold text-amber-300 mt-1">{caseData?.anomalies || 0}</p>
                </div>
                <div className="backdrop-blur-md bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" />
                    <span className="text-xs text-slate-500">Risk Score</span>
                  </div>
                  <p className={cn("text-lg font-bold mt-1", riskColor(caseData?.riskScore || 0))}>
                    {caseData?.riskScore || 0}
                  </p>
                </div>
              </div>
              <div className="backdrop-blur-md bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-amber-600/70 leading-relaxed">
                    AI responses are for investigative assistance only.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!contextOpen && (
        <button
          onClick={() => setContextOpen(true)}
          className="hidden lg:flex absolute right-4 top-4 w-8 h-8 rounded-lg
            bg-slate-50 hover:bg-slate-100 border border-slate-200 items-center justify-center
            text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
