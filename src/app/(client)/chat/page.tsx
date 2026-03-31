"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Loader2, Leaf, MapPin, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Region {
  id: string;
  name: string;
  state: string | null;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = sessionStorage.getItem("chat-messages");
      return saved ? (JSON.parse(saved) as Message[]) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [regionId, setRegionId] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return sessionStorage.getItem("chat-regionId") || undefined;
  });
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Persist messages and region to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("chat-messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (regionId) sessionStorage.setItem("chat-regionId", regionId);
  }, [regionId]);

  useEffect(() => {
    fetch("/api/regions")
      .then((res) => res.json())
      .then((data: Region[]) => {
        setRegions(data);
        if (!regionId && data.length === 1) setRegionId(data[0].id);
      })
      .catch(console.error)
      .finally(() => setRegionsLoading(false));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || !regionId) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, regionId }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantContent += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: assistantContent,
            };
            return updated;
          });
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  const selectedRegion = regions.find((r) => r.id === regionId);

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col px-4 py-4 sm:px-6">
      {/* Region bar */}
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
        <MapPin className="h-4 w-4 shrink-0 text-[color:var(--zen-accent)]" />
        <span className="text-sm font-medium text-foreground">Region:</span>

        {regionsLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : regions.length === 0 ? (
          <span className="text-sm italic text-muted-foreground">
            No regions set up yet — ask an admin to add one.
          </span>
        ) : (
          <Select
            value={regionId}
            onValueChange={(v) => setRegionId(v ?? undefined)}
          >
            <SelectTrigger className="h-8 w-52 border-border bg-muted text-sm">
              <span className={!regionId ? "text-muted-foreground" : "text-foreground"}>
                {regionId
                  ? (() => {
                      const r = regions.find((r) => r.id === regionId);
                      return r ? `${r.name}${r.state ? `, ${r.state}` : ""}` : "Select your region...";
                    })()
                  : "Select your region..."}
              </span>
            </SelectTrigger>
            <SelectContent>
              {regions.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                  {r.state ? `, ${r.state}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedRegion && (
          <span className="ml-auto hidden text-xs text-muted-foreground sm:block">
            Showing plants in {selectedRegion.name}
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center">
            {/* Stone lantern avatar */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted border border-border">
              <Sparkles className="h-7 w-7 text-[color:var(--zen-accent)]" />
            </div>
            <p className="mt-4 text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Plant Assistant
            </p>
            <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
              {regionId
                ? "Ask me about plants, get garden recommendations, or learn about care and growing conditions."
                : "Select your region above to get started."}
            </p>
            {regionId && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  "What blooms in spring?",
                  "Best plants for shade",
                  "Low water options",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      textareaRef.current?.focus();
                    }}
                    className="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:bg-muted hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-muted border border-border">
                <Leaf className="h-3.5 w-3.5 text-[color:var(--zen-accent)]" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-muted border border-border">
              <Leaf className="h-3.5 w-3.5 text-[color:var(--zen-accent)]" />
            </div>
            <div className="rounded-2xl bg-muted px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 150, 300].map((delay) => (
                  <div
                    key={delay}
                    className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            placeholder={
              regionId ? "Ask about plants..." : "Select a region first..."
            }
            className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 pr-12 text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            rows={1}
            style={{ minHeight: "44px" }}
            disabled={!regionId}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !input.trim() || !regionId}
            className="absolute bottom-1.5 right-1.5 h-8 w-8 rounded-lg bg-primary p-0 text-primary-foreground hover:opacity-90 disabled:opacity-30"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
