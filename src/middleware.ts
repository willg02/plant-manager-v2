import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isAdminApiRoute = createRouteMatcher([
  "/api/upload(.*)",
  "/api/ai/populate(.*)",
  "/api/admin/(.*)",
  "/api/plants(.*)",
  "/api/regions(.*)",
  "/api/suppliers(.*)",
  "/api/scraper(.*)",
]);

// AI routes require login but not admin role
const isAuthApiRoute = createRouteMatcher([
  "/api/ai/chat(.*)",
  "/api/ai/design(.*)",
  "/api/ai/generate-design-image(.*)",
  "/api/design/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const method = req.method;

  // AI/design routes: require login (any role)
  if (isAuthApiRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return;
  }

  // Admin UI: always require admin
  if (isAdminRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = user.publicMetadata?.role as string | undefined;
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return;
  }

  // Admin API routes: GET is public for browsing, writes require admin
  if (isAdminApiRoute(req)) {
    if (method === "GET") return;

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = user.publicMetadata?.role as string | undefined;
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
