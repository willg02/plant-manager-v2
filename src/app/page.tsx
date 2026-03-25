import Link from "next/link";
import {
  Leaf,
  MessageCircle,
  Search,
  Sparkles,
  ArrowRight,
  Zap,
  Globe,
  Shield,
  Paintbrush,
} from "lucide-react";
import { ZenHero } from "@/components/zen-hero";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Landing Nav ── */}
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
            <Leaf className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">
            Plant<span className="text-[color:var(--zen-accent)]">Manager</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/plants"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Plants
          </Link>
          <Link
            href="/suppliers"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Suppliers
          </Link>
          <Link
            href="/chat"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Chat
          </Link>
          <ThemeToggle collapsed />
          <Link href="/plants">
            <button className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 pb-28 pt-16 sm:pt-24">
        <ZenHero />

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground"
            style={{ animation: "zen-fade-in 0.6s ease-out both" }}
          >
            <Sparkles className="h-3.5 w-3.5 text-[color:var(--zen-accent)]" />
            AI-Powered Plant Discovery
          </div>

          {/* Heading */}
          <h1
            className="text-5xl font-bold leading-tight tracking-tight sm:text-7xl"
            style={{
              fontFamily: "var(--font-display)",
              animation: "zen-fade-in 0.7s ease-out 0.1s both",
            }}
          >
            Find the right plants
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--primary) 0%, var(--zen-accent) 100%)",
              }}
            >
              from local growers
            </span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
            style={{ animation: "zen-fade-in 0.7s ease-out 0.2s both" }}
          >
            AI-powered recommendations, real-time availability, and detailed
            care information — tailored to your region and growing conditions.
          </p>

          {/* CTAs */}
          <div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            style={{ animation: "zen-fade-in 0.7s ease-out 0.3s both" }}
          >
            <Link href="/plants">
              <button className="flex h-12 items-center gap-2 rounded-full bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg transition-all hover:opacity-90">
                <Search className="h-4 w-4" />
                Browse Plants
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/chat">
              <button className="flex h-12 items-center gap-2 rounded-full border border-border bg-card px-8 text-base font-medium text-foreground transition-all hover:border-primary/40 hover:bg-muted">
                <MessageCircle className="h-4 w-4" />
                Chat with AI
              </button>
            </Link>
            <Link href="/design">
              <button className="flex h-12 items-center gap-2 rounded-full border border-border bg-card px-8 text-base font-medium text-foreground transition-all hover:border-primary/40 hover:bg-muted">
                <Paintbrush className="h-4 w-4" />
                Design a Garden
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="relative px-6 pb-32">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <MessageCircle className="h-5 w-5" />,
                title: "AI Chat",
                description:
                  "Ask about plants, get personalized garden recommendations from an AI that knows your local inventory.",
                delay: "0.1s",
              },
              {
                icon: <Search className="h-5 w-5" />,
                title: "Smart Search",
                description:
                  "Filter by sun, water, hardiness zone, and more. Find exactly what works for your space.",
                delay: "0.2s",
              },
              {
                icon: <Globe className="h-5 w-5" />,
                title: "Regional Data",
                description:
                  "Real availability from suppliers in your area. No guessing — see what's actually in stock.",
                delay: "0.3s",
              },
              {
                icon: <Zap className="h-5 w-5" />,
                title: "AI Design",
                description:
                  "Upload a photo of your space and get a planting design built from locally available plants.",
                delay: "0.4s",
              },
            ].map((card) => (
              <FeatureCard key={card.title} {...card} />
            ))}
          </div>

          {/* Trust bar */}
          <div className="mt-16 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
            <TrustItem icon={<Shield className="h-4 w-4" />} text="Verified local suppliers" />
            <TrustItem icon={<Sparkles className="h-4 w-4" />} text="AI-enriched plant data" />
            <TrustItem icon={<Globe className="h-4 w-4" />} text="Region-specific recommendations" />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div
      className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
      style={{ animation: `zen-fade-in 0.6s ease-out ${delay} both` }}
    >
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-200 group-hover:scale-105"
        style={{
          background: "color-mix(in oklch, var(--zen-accent) 12%, transparent)",
          color: "var(--zen-accent)",
          transition: "transform 0.2s ease",
        }}
      >
        {icon}
      </div>
      <h3
        className="mb-2 text-base font-semibold text-foreground"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function TrustItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span style={{ color: "var(--zen-accent)" }}>{icon}</span>
      {text}
    </div>
  );
}
