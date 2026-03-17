"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Loader2, Leaf, MapPin } from "lucide-react";

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

  // Fetch available regions on mount
  useEffect(() => {
    fetch("/api/regions")
      .then((res) => res.json())
      .then((data: Region[]) => {
        setRegions(data);
        // Auto-select if there's only one region
        if (data.length === 1) setRegionId(data[0].id);
      })
      .catch(console.error)
      .finally(() => setRegionsLoading(false));
  }, []);

  // Auto-scroll to latest message
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
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-3xl flex-col px-4 py-4">
      {/* Region Selector */}
      <div className="mb-4 flex items-center gap-3 rounded-lg bg-green-50 px-4 py-2.5">
        <MapPin className="h-4 w-4 shrink-0 text-green-700" />
        <span className="text-sm font-medium text-green-800">Region:</span>

        {regionsLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-green-600" />
        ) : regions.length === 0 ? (
          <span className="text-sm italic text-green-700">
            No regions set up yet — ask an admin to add one.
          </span>
        ) : (
          <Select value={regionId} onValueChange={setRegionId}>
            <SelectTrigger className="h-8 w-52 border-green-200 bg-white text-sm focus:ring-green-500">
              <SelectValue placeholder="Select your region…" />
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
          <span className="ml-auto text-xs text-green-600">
            Showing plants available in {selectedRegion.name}
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-lg bg-white p-4 shadow-inner"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-gray-400">
            <Leaf className="mb-3 h-10 w-10" />
            <p className="text-lg font-medium">Plant Chat</p>
            <p className="mt-1 text-sm">
              {regionId
                ? "Ask me anything about plants, gardening, or local availability."
                : "Select your region above to get started."}
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-green-700 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-gray-100 px-4 py-2.5 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={regionId ? "Ask about plants…" : "Select a region first…"}
          className="min-h-[44px] resize-none"
          rows={1}
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
          disabled={isLoading || !input.trim() || !regionId}
          className="bg-green-700 text-white hover:bg-green-600"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
