import Link from "next/link";
import { Leaf, MessageCircle, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-800">
          <Leaf className="h-4 w-4" />
          AI-Powered Plant Discovery
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Discover Local Plants
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
          Find the perfect plants for your garden from local suppliers. Get
          AI-powered recommendations, care tips, and availability information
          tailored to your region.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/plants">
            <Button className="h-11 bg-green-700 px-6 text-base text-white hover:bg-green-600">
              <Search className="mr-2 h-4 w-4" />
              Browse Plants
            </Button>
          </Link>
          <Link href="/chat">
            <Button
              variant="outline"
              className="h-11 border-green-700 px-6 text-base text-green-700 hover:bg-green-50"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat with AI
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="mx-auto max-w-5xl px-4 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          <Card className="border-green-100 bg-white">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <MessageCircle className="h-5 w-5 text-green-700" />
              </div>
              <CardTitle>AI Plant Chat</CardTitle>
              <CardDescription>
                Chat with our AI about local plants, get recommendations for
                your garden, and learn about care requirements.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-green-100 bg-white">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Search className="h-5 w-5 text-green-700" />
              </div>
              <CardTitle>Browse Plants</CardTitle>
              <CardDescription>
                Explore a growing catalog of plants available from local
                suppliers in your region, with prices and stock info.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-green-100 bg-white">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Sparkles className="h-5 w-5 text-green-700" />
              </div>
              <CardTitle>Smart Details</CardTitle>
              <CardDescription>
                AI-populated plant information including care tips, companion
                plants, bloom times, and hardiness zones.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
}
