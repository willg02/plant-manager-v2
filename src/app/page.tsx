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
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav — minimal for landing */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-green-600">
            <Leaf className="h-4.5 w-4.5 text-white" />
          </div>
          <span>
            Plant<span className="text-emerald-400">Manager</span>
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/plants"
            className="hidden text-sm text-gray-400 transition-colors hover:text-white sm:block"
          >
            Plants
          </Link>
          <Link
            href="/suppliers"
            className="hidden text-sm text-gray-400 transition-colors hover:text-white sm:block"
          >
            Suppliers
          </Link>
          <Link
            href="/chat"
            className="hidden text-sm text-gray-400 transition-colors hover:text-white sm:block"
          >
            Chat
          </Link>
          <Link href="/plants">
            <Button className="rounded-full bg-emerald-500 px-5 text-sm font-medium text-white hover:bg-emerald-400">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20 sm:pt-28">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
          <div className="absolute right-1/4 top-1/3 h-[300px] w-[400px] rounded-full bg-green-600/5 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Plant Discovery
          </div>

          {/* Heading */}
          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
            Find the right plants
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
              from local growers
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl">
            AI-powered recommendations, real-time availability, and detailed
            care information — tailored to your region and growing conditions.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/plants">
              <Button className="h-12 rounded-full bg-emerald-500 px-8 text-base font-medium text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/40">
                <Search className="mr-2 h-4 w-4" />
                Browse Plants
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/chat">
              <Button
                variant="outline"
                className="h-12 rounded-full border-gray-700 bg-transparent px-8 text-base font-medium text-gray-300 transition-all hover:border-gray-500 hover:bg-white/5 hover:text-white"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat with AI
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="relative px-6 pb-32">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<MessageCircle className="h-5 w-5" />}
              title="AI Chat"
              description="Ask about plants, get personalized garden recommendations from an AI that knows your local inventory."
            />
            <FeatureCard
              icon={<Search className="h-5 w-5" />}
              title="Smart Search"
              description="Filter by sun, water, hardiness zone, and more. Find exactly what works for your space."
            />
            <FeatureCard
              icon={<Globe className="h-5 w-5" />}
              title="Regional Data"
              description="Real availability from suppliers in your area. No guessing — see what's actually in stock."
            />
            <FeatureCard
              icon={<Zap className="h-5 w-5" />}
              title="AI Details"
              description="Every plant enriched with care tips, companion plants, bloom times, and growing conditions."
            />
          </div>

          {/* Trust bar */}
          <div className="mt-16 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
            <TrustItem
              icon={<Shield className="h-4 w-4" />}
              text="Verified local suppliers"
            />
            <TrustItem
              icon={<Sparkles className="h-4 w-4" />}
              text="AI-enriched plant data"
            />
            <TrustItem
              icon={<Globe className="h-4 w-4" />}
              text="Region-specific recommendations"
            />
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
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-gray-800 bg-gray-900/50 p-6 transition-all hover:border-gray-700 hover:bg-gray-900">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 transition-colors group-hover:bg-emerald-500/20">
        {icon}
      </div>
      <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-400">{description}</p>
    </div>
  );
}

function TrustItem({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span className="text-emerald-500">{icon}</span>
      {text}
    </div>
  );
}
