"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useUser } from "@clerk/nextjs";
import { ShieldCheck, ShieldOff, Loader2 } from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  role: string | null;
  createdAt: number;
}

export default function UsersPage() {
  const { user: currentUser } = useUser();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function fetchUsers() {
    const res = await fetch("/api/admin/users");
    if (!res.ok) {
      setError("Failed to load users");
      return;
    }
    const data = await res.json();
    data.sort((a: UserRow, b: UserRow) => a.createdAt - b.createdAt);
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function toggleRole(userId: string, currentRole: string | null) {
    const newRole = currentRole === "admin" ? null : "admin";
    setUpdating(userId);
    setError("");

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to update user");
    } else {
      await fetchUsers();
    }
    setUpdating(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Promote or demote users to admin. Admins can access this panel,
          upload inventory, and manage all data.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {users.length} registered user{users.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading users…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const isCurrentUser = u.id === currentUser?.id;
                  const initials =
                    [u.firstName, u.lastName]
                      .filter(Boolean)
                      .map((n) => n![0])
                      .join("") || u.email[0].toUpperCase();

                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={u.imageUrl} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">
                            {u.firstName} {u.lastName}
                            {isCurrentUser && (
                              <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        {u.role === "admin" ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">User</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={u.role === "admin" ? "outline" : "default"}
                          size="sm"
                          disabled={updating === u.id || isCurrentUser}
                          onClick={() => toggleRole(u.id, u.role)}
                          className="gap-1.5"
                        >
                          {updating === u.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : u.role === "admin" ? (
                            <ShieldOff className="h-3.5 w-3.5" />
                          ) : (
                            <ShieldCheck className="h-3.5 w-3.5" />
                          )}
                          {u.role === "admin" ? "Remove Admin" : "Make Admin"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
