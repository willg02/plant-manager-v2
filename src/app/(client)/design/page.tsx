"use client";

import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Loader2,
  Leaf,
  MapPin,
  ImagePlus,
  X,
  Paintbrush,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
  imagePreview?: string;
}

interface Region {
  id: string;
  name: string;
  state: string | null;
}

interface DesignPlant {
  name: string;
  quantity: number;
  priceEach: string;
  supplier: string;
  placement: string;
  role: string;
}

interface DesignPlan {
  title: string;
  concept: string;
  totalEstimate: string;
  plants: DesignPlant[];
  installationNotes: string;
  maintenanceLevel: "Low" | "Medium" | "High" | string;
  peakSeason: string;
}

// ─── Design Plan Parser ───────────────────────────────────────────────────────

function parseDesignPlan(content: string): {
  before: string;
  plan: DesignPlan | null;
  after: string;
} {
  const match = content.match(/```design-plan\n([\s\S]*?)```/);
  if (!match) return { before: content, plan: null, after: "" };

  try {
    const plan = JSON.parse(match[1]) as DesignPlan;
    const idx = content.indexOf("```design-plan");
    const endIdx = idx + match[0].length;
    return {
      before: content.substring(0, idx).trim(),
      plan,
      after: content.substring(endIdx).trim(),
    };
  } catch {
    return { before: content, plan: null, after: "" };
  }
}

// ─── Design Plan Card ─────────────────────────────────────────────────────────

function DesignPlanCard({ plan }: { plan: DesignPlan }) {
  const maintenanceBadge =
    plan.maintenanceLevel === "Low"
      ? "bg-green-100 text-green-700 border-green-200"
      : plan.maintenanceLevel === "High"
        ? "bg-red-100 text-red-700 border-red-200"
        : "bg-yellow-100 text-yellow-700 border-yellow-200";

  const totalCost =
    plan.plants.reduce((sum, p) => {
      const price = parseFloat(p.priceEach.replace(/[^0-9.]/g, "")) || 0;
      return sum + price * p.quantity;
    }, 0) || null;

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
      {/* Header */}
      <div className="px-5 py-4" style={{ background: "linear-gradient(135deg, var(--primary) 0%, color-mix(in oklch, var(--primary) 70%, var(--zen-accent)) 100%)" }}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/70">
              Garden Design Plan
            </p>
            <h3 className="mt-0.5 text-lg font-bold leading-tight text-primary-foreground">
              {plan.title}
            </h3>
            <p className="mt-1 text-sm text-primary-foreground/80">{plan.concept}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] text-primary-foreground/70">Est. Cost</p>
            <p className="text-xl font-bold text-primary-foreground">
              {totalCost ? `$${totalCost.toFixed(2)}` : plan.totalEstimate}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${maintenanceBadge}`}>
            {plan.maintenanceLevel} Maintenance
          </span>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
            Peak: {plan.peakSeason}
          </span>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
            {plan.plants.reduce((s, p) => s + p.quantity, 0)} plants ·{" "}
            {plan.plants.length} varieties
          </span>
        </div>
      </div>

      {/* Plant list */}
      <div className="divide-y divide-border px-5">
        {plan.plants.map((plant, i) => {
          const lineTotal =
            parseFloat(plant.priceEach.replace(/[^0-9.]/g, "")) *
            plant.quantity;

          return (
            <div key={i} className="flex items-start gap-3 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Leaf className="h-4 w-4 text-[color:var(--zen-accent)]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground text-sm leading-tight">
                    {plant.name}
                  </p>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-[color:var(--zen-accent)]">
                      {!isNaN(lineTotal)
                        ? `$${lineTotal.toFixed(2)}`
                        : plant.priceEach}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {plant.quantity}x {plant.priceEach}
                    </p>
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{plant.placement}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                    {plant.role}
                  </span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                    {plant.supplier}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {plan.installationNotes && (
        <div className="border-t border-border bg-muted px-5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Installation Notes
          </p>
          <p className="mt-1 text-sm text-foreground">{plan.installationNotes}</p>
        </div>
      )}
    </div>
  );
}

// ─── Message Renderer ─────────────────────────────────────────────────────────

function MessageContent({ content }: { content: string }) {
  const { before, plan, after } = parseDesignPlan(content);

  return (
    <div>
      {before && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{before}</p>
      )}
      {plan && <DesignPlanCard plan={plan} />}
      {after && (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{after}</p>
      )}
      {!plan && !before && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
      )}
    </div>
  );
}

// ─── Image Compression ───────────────────────────────────────────────────────

function compressImage(
  file: File,
  maxWidth = 1024,
  quality = 0.8
): Promise<{ base64: string; mediaType: string; preview: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not available"));

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);

      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const base64 = dataUrl.split(",")[1];
      resolve({ base64, mediaType: "image/jpeg", preview: dataUrl });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DesignPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [regionId, setRegionId] = useState<string | undefined>(undefined);
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [pendingImage, setPendingImage] = useState<{
    base64: string;
    mediaType: string;
    preview: string;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/regions")
      .then((r) => r.json())
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

  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const compressed = await compressImage(file);
      setPendingImage(compressed);
    } catch {
      console.error("Image compression failed");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if ((!trimmed && !pendingImage) || isLoading || !regionId) return;

    const userMessage: Message = {
      role: "user",
      content: trimmed || "Here's a photo of my space.",
      imagePreview: pendingImage?.preview,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");

    const capturedImage = pendingImage;
    setPendingImage(null);

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({
            role,
            content,
          })),
          regionId,
          imageData: capturedImage
            ? {
                base64: capturedImage.base64,
                mediaType: capturedImage.mediaType,
              }
            : undefined,
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      const reader = res.body?.getReader();
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
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  const selectedRegion = regions.find((r) => r.id === regionId);

  const suggestions = [
    "I have a sunny 10ft border to fill",
    "Design a low-maintenance front yard",
    "I need plants for a shady corner",
    "Build me a colorful pollinator garden",
  ];

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
            No regions set up yet.
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
            Designs use in-stock plants from {selectedRegion.name}
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
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted border border-border shadow-sm">
              <Paintbrush className="h-7 w-7 text-[color:var(--zen-accent)]" />
            </div>
            <p className="mt-4 text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              AI Garden Designer
            </p>
            <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
              {regionId
                ? "Tell me about your space — or upload a photo — and I'll design a garden using plants that are actually in stock near you."
                : "Select your region above to get started."}
            </p>
            {regionId && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setInput(s);
                      textareaRef.current?.focus();
                    }}
                    className="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:bg-muted hover:text-foreground"
                  >
                    {s}
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
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground text-sm"
                  : "bg-muted text-foreground"
              }`}
            >
              {message.imagePreview && (
                <img
                  src={message.imagePreview}
                  alt="Uploaded space"
                  className="mb-2 max-h-52 w-full rounded-lg object-cover"
                />
              )}
              {message.role === "assistant" ? (
                <MessageContent content={message.content} />
              ) : (
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              )}
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

      {/* Pending image strip */}
      {pendingImage && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
          <img
            src={pendingImage.preview}
            alt="Preview"
            className="h-10 w-10 rounded-md object-cover"
          />
          <span className="flex-1 text-xs text-primary">
            Photo ready to send
          </span>
          <button
            onClick={() => setPendingImage(null)}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input row */}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!regionId}
          title="Upload a photo of your space"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-all hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ImagePlus className="h-5 w-5" />
        </button>

        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height =
                Math.min(e.target.scrollHeight, 120) + "px";
            }}
            placeholder={
              regionId
                ? "Describe your space, style, or goals..."
                : "Select a region first..."
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
            disabled={isLoading || (!input.trim() && !pendingImage) || !regionId}
            className="absolute bottom-1.5 right-1.5 h-8 w-8 rounded-lg bg-primary p-0 text-primary-foreground hover:opacity-90 disabled:opacity-30"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
