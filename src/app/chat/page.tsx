"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, RefreshCw } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevCountRef = useRef(0);

  const scrollToBottom = useCallback((force = false) => {
    if (force || messages.length !== prevCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      prevCountRef.current = messages.length;
    }
  }, [messages.length]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      // silent — keep existing messages
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setError("");
    setSending(true);

    // Optimistic user message
    setMessages(prev => [...prev, { role: "user", content: text, timestamp: Date.now() }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      // Refresh to get actual response from transcript
      await fetchHistory();
    } catch {
      setError("Couldn't reach Smarty. Is the OpenClaw gateway running?");
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 104px)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-base font-bold"
          style={{ background: "var(--accent)", color: "#fff" }}>
          💡
        </div>
        <div className="flex-1">
          <h1 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Smarty</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Squad Lead · agent:smarty:main</p>
        </div>
        <button onClick={fetchHistory} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: "var(--text-muted)" }} title="Refresh">
          <RefreshCw size={14} />
        </button>
        {(loading || sending) && (
          <Loader2 size={14} className="animate-spin" style={{ color: "var(--text-muted)" }} />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No messages yet. Start a conversation.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-1"
                style={{ background: "var(--accent)", color: "#fff" }}>
                💡
              </div>
            )}
            <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
              <div className={`rounded-2xl px-4 py-2.5 ${msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"}`}
                style={{
                  background: msg.role === "user" ? "var(--accent)" : "var(--bg-secondary)",
                  color: msg.role === "user" ? "#fff" : "var(--text-primary)",
                  border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                }}>
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
              </div>
              {msg.timestamp > 0 && (
                <p className="text-[10px] mt-1 px-1" style={{ color: "var(--text-muted)" }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-1 font-bold"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                A
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0"
              style={{ background: "var(--accent)", color: "#fff" }}>💡</div>
            <div className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--text-muted)", animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--text-muted)", animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--text-muted)", animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="flex-shrink-0 mb-2 px-3 py-2 rounded-lg text-xs" style={{ background: "var(--red)", color: "#fff", opacity: 0.9 }}>
          {error}
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Smarty… (Enter to send, Shift+Enter for newline)"
            disabled={sending}
            rows={1}
            className="flex-1 px-4 py-3 rounded-xl border outline-none text-sm resize-none transition-colors"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
              minHeight: "48px",
              maxHeight: "120px",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="p-3 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 flex-shrink-0"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="text-[10px] mt-2 text-center" style={{ color: "var(--text-muted)" }}>
          Connected to OpenClaw Gateway · Polling every 5s
        </p>
      </div>
    </div>
  );
}
