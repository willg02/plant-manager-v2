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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [regionId, setRegionId] = useState<string | undefined>(undefined);
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/regions")
      .then((res) => res.json())
      .then((data: Region[]) => {
        setRegions(data);
        if (data.length === 1) setRegionId(data[0].id);
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
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-3xl flex-col px-4 py-4 sm:px-6">
      {/* Region bar */}
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-2.5 shadow-sm">
        <MapPin className="h-4 w-4 shrink-0 text-emerald-500" />
        <span className="text-sm font-medium text-gray-700">Region:</span>

        {regionsLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : regions.length === 0 ? (
          <span className="text-sm italic text-gray-400">
            No regions set up yet — ask an admin to add one.
          </span>
        ) : (
          <Select
            value={regionId}
            onValueChange={(v) => setRegionId(v ?? undefined)}
          >
            <SelectTrigger className="h-8 w-52 border-gray-200 bg-gray-50 text-sm focus:ring-emerald-500">
              <SelectValue placeholder="Select your region..." />
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
          <span className="ml-auto hidden text-xs text-gray-400 sm:block">
            Showing plants in {selectedRegion.name}
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
              <Sparkles className="h-7 w-7 text-emerald-500" />
            </div>
            <p className="mt-4 text-lg font-semibold text-gray-900">
              Plant Assistant
            </p>
            <p className="mt-1 max-w-sm text-center text-sm text-gray-400">
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
                    className="rounded-full border border-gray-200 px-3.5 py-1.5 text-xs font-medium text-gray-500 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
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
              <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                <Leaf className="h-3.5 w-3.5 text-emerald-500" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-50 text-gray-800"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50">
              <Leaf className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-300" style={{ animationDelay: "0ms" }} />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-300" style={{ animationDelay: "150ms" }} />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-300" style={{ animationDelay: "300ms" }} />
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
              // Auto-resize
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            placeholder={
              regionId ? "Ask about plants..." : "Select a region first..."
            }
            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm shadow-sm transition-all placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
            className="absolute bottom-1.5 right-1.5 h-8 w-8 rounded-lg bg-gray-900 p-0 text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
