import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();

  try {
    // Quick DB connectivity check
    await prisma.$queryRaw`SELECT 1`;
    const dbMs = Date.now() - start;

    return Response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      db: { connected: true, latencyMs: dbMs },
    });
  } catch (error) {
    return Response.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        db: { connected: false, error: String(error) },
      },
      { status: 503 }
    );
  }
}
