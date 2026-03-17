import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isAdminApiRoute = createRouteMatcher([
  "/api/upload(.*)",
  "/api/ai/populate(.*)",
  "/api/admin/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Auto-promote the bootstrap admin email if set via env var
  const adminEmail = process.env.ADMIN_EMAIL;
  if (userId && adminEmail && role !== "admin") {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const emails = user.emailAddresses.map((e) => e.emailAddress);
    if (emails.includes(adminEmail)) {
      await client.users.updateUserMetadata(userId, {
        publicMetadata: { role: "admin" },
      });
      // Let the request through; the session will carry the role on next request
    }
  }

  if (isAdminRoute(req) || isAdminApiRoute(req)) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
