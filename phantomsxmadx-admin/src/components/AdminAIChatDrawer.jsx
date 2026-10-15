import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Sparkles, 
  Send, 
  X, 
  Trash2, 
  User, 
  Loader2, 
  ChevronDown, 
  Minimize2,
  Maximize2,
  HelpCircle,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import toast from "react-hot-toast";

const SUGGESTIONS = [
  "Send a warning letter to Farrukh Saleem for missing daily reports",
  "Tehreem Ijaz ko late arrival ka warning letter bhej do",
  "Farrukh Saleem ki last warning remove kr do",
  "Summarize Farrukh Saleem's daily reports for this week",
  "Who has missing daily reports in September?"
];

// Helper to format clean markdown-like text without external heavy parser
function FormattedMessage({ content }) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed text-gray-800 dark:text-gray-200">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Section header like **Title**
        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          const text = trimmed.slice(2, -2);
          return (
            <div key={idx} className="font-bold text-[#004AAE] dark:text-blue-400 mt-2 mb-1 text-xs uppercase tracking-wider">
              {text}
            </div>
          );
        }

        // Bullet points (* or -)
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
          const rawText = trimmed.substring(2);
          const parts = rawText.split(/(\*\*.*?\*\*)/g);

          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-[#004AAE] dark:text-blue-400 font-bold mt-0.5">•</span>
              <div className="flex-1">
                {parts.map((p, pIdx) => {
                  if (p.startsWith("**") && p.endsWith("**")) {
                    return <strong key={pIdx} className="font-semibold text-gray-900 dark:text-white">{p.slice(2, -2)}</strong>;
                  }
                  return <span key={pIdx}>{p}</span>;
                })}
              </div>
            </div>
          );
        }

        // Regular line with potential **bold** text
        const parts = trimmed.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={idx}>
            {parts.map((p, pIdx) => {
              if (p.startsWith("**") && p.endsWith("**")) {
                return <strong key={pIdx} className="font-semibold text-gray-900 dark:text-white">{p.slice(2, -2)}</strong>;
              }
              return <span key={pIdx}>{p}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}

export default function AdminAIChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem("admin_ai_chat_history");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [
      {
        role: "assistant",
        content: "Hello Admin! I am your **HAT-TECH AI Assistant**. Ask me anything about employee daily reports, attendance records, performance evaluations, or team status.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem("admin_ai_chat_history", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, loading]);

  const handleSend = async (textToSend) => {
    const prompt = typeof textToSend === "string" ? textToSend : query;
    if (!prompt || !prompt.trim() || loading) return;

    const userMsg = {
      role: "user",
      content: prompt.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.post("/admin/ai-chat/query", {
        query: prompt.trim(),
        history: historyPayload
      });

      if (res.data.success) {
        if (res.data.actionExecuted === 'WARNING_LETTER_ISSUED') {
          toast.success("⚠️ Warning letter issued & sent successfully!");
        } else if (res.data.actionExecuted === 'WARNING_LETTER_REMOVED') {
          toast.success("✅ Warning letter revoked & removed successfully!");
        }
        const assistantMsg = {
          role: "assistant",
          content: res.data.reply,
          matchedEmployee: res.data.matchedEmployee,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(res.data.message || "Failed to generate answer.");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Something went wrong.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `**Error:** ${errMsg}`,
          isError: true,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    const reset = [
      {
        role: "assistant",
        content: "Chat cleared. What else can I help you inspect?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(reset);
    sessionStorage.removeItem("admin_ai_chat_history");
    toast.success("Chat history reset");
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-24 z-[99] h-14 px-4 rounded-2xl flex items-center gap-2.5 shadow-2xl transition-all duration-300 border ${
          isOpen
            ? "bg-gray-900 dark:bg-gray-800 text-white border-gray-700"
            : "bg-gradient-to-r from-[#004AAE] via-indigo-600 to-blue-600 text-white border-white/20 shadow-[#004AAE]/30"
        }`}
        title="Admin AI Assistant"
      >
        <div className="relative flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
        </div>
        <span className="font-bold text-xs sm:text-sm tracking-wide hidden sm:inline">Ask AI</span>
      </motion.button>

      {/* CHAT MODAL / DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`fixed z-[105] shadow-2xl rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col overflow-hidden backdrop-blur-xl transition-all duration-300 ${
              isExpanded
                ? "bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[650px] h-[calc(100vh-2rem)] sm:h-[750px] max-h-[85vh]"
                : "bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[540px] max-h-[80vh]"
            }`}
          >
            {/* HEADER */}
            <div className="px-4 py-3.5 bg-gradient-to-r from-[#004AAE] to-indigo-700 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">Admin AI Assistant</h3>
                  <p className="text-[11px] text-blue-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    Read-Only Database Analytics
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-white/80">
                <button
                  onClick={handleClear}
                  title="Clear Chat History"
                  className="p-1.5 hover:bg-white/10 rounded-lg hover:text-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Collapse" : "Expand"}
                  className="p-1.5 hover:bg-white/10 rounded-lg hover:text-white transition-colors hidden sm:block"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close Assistant"
                  className="p-1.5 hover:bg-white/10 rounded-lg hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* MESSAGES LIST */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-950/50">
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-end gap-2 max-w-[88%] sm:max-w-[85%]">
                      {!isUser && (
                        <div className="w-6 h-6 rounded-lg bg-[#004AAE]/10 dark:bg-blue-500/20 text-[#004AAE] dark:text-blue-400 flex items-center justify-center shrink-0 mb-1">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`p-3 rounded-2xl relative group ${
                          isUser
                            ? "bg-[#004AAE] text-white rounded-br-xs shadow-md shadow-[#004AAE]/20"
                            : msg.isError
                            ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-bl-xs"
                            : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-bl-xs shadow-sm"
                        }`}
                      >
                        {isUser ? (
                          <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                            {msg.content}
                          </p>
                        ) : (
                          <>
                            <FormattedMessage content={msg.content} />
                            
                            {/* Copy button */}
                            <button
                              onClick={() => handleCopy(msg.content, idx)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                              title="Copy response"
                            >
                              {copiedIdx === idx ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {msg.time}
                    </span>
                  </motion.div>
                );
              })}

              {/* LOADING INDICATOR */}
              {loading && (
                <div className="flex items-end gap-2 max-w-[85%]">
                  <div className="w-6 h-6 rounded-lg bg-[#004AAE]/10 dark:bg-blue-500/20 text-[#004AAE] dark:text-blue-400 flex items-center justify-center shrink-0 mb-1">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-2xl rounded-bl-xs shadow-sm flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin text-[#004AAE]" />
                    <span>Analyzing database & generating summary...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* SUGGESTION CHIPS (Show if few messages) */}
            {messages.length <= 3 && !loading && (
              <div className="px-3 py-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {SUGGESTIONS.map((sugg, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => handleSend(sugg)}
                    className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-gray-100 hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-[#004AAE] dark:hover:text-blue-400 transition-colors border border-gray-200/50 dark:border-gray-700/50"
                  >
                    {sugg}
                  </button>
                ))}
              </div>
            )}

            {/* INPUT AREA */}
            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-2xl p-1.5 focus-within:border-[#004AAE] focus-within:ring-2 focus-within:ring-[#004AAE]/10 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about employee reports, attendance, stats..."
                  disabled={loading}
                  className="flex-1 bg-transparent px-2.5 py-1 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!query.trim() || loading}
                  className="w-8 h-8 rounded-xl bg-[#004AAE] hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white flex items-center justify-center transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-1.5">
                Read-only analysis. Safe & secure.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
