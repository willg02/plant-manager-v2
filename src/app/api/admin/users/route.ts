import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

// GET /api/admin/users — list all users with their roles
export async function GET() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await clerkClient();
  const response = await client.users.getUserList({ limit: 100 });

  const users = response.data.map((u) => ({
    id: u.id,
    email: u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ?? "",
    firstName: u.firstName,
    lastName: u.lastName,
    imageUrl: u.imageUrl,
    role: (u.publicMetadata as { role?: string })?.role ?? null,
    createdAt: u.createdAt,
  }));

  return NextResponse.json(users);
}

// PATCH /api/admin/users — set or remove a user's role
export async function PATCH(request: NextRequest) {
  const { sessionClaims, userId: callerId } = await auth();
  const callerRole = (sessionClaims?.metadata as { role?: string })?.role;
  if (callerRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, role } = await request.json() as { userId: string; role: string | null };

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Prevent an admin from removing their own admin role
  if (userId === callerId && role !== "admin") {
    return NextResponse.json(
      { error: "You cannot remove your own admin role" },
      { status: 400 }
    );
  }

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { role: role ?? undefined },
  });

  return NextResponse.json({ success: true });
}
