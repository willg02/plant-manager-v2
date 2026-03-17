export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Leaf, Store, MapPin, Clock } from "lucide-react";

export default async function AdminDashboardPage() {
  const [plantCount, supplierCount, regionCount, pendingCount, recentUploads] =
    await Promise.all([
      prisma.plant.count(),
      prisma.supplier.count(),
      prisma.region.count(),
      prisma.plant.count({ where: { aiPopulated: false } }),
      prisma.uploadLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const stats = [
    {
      label: "Total Plants",
      value: plantCount,
      icon: Leaf,
      color: "text-green-600",
    },
    {
      label: "Total Suppliers",
      value: supplierCount,
      icon: Store,
      color: "text-blue-600",
    },
    {
      label: "Total Regions",
      value: regionCount,
      icon: MapPin,
      color: "text-purple-600",
    },
    {
      label: "Pending AI Population",
      value: pendingCount,
      icon: Clock,
      color: "text-yellow-600",
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader>
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Icon className={`size-6 ${stat.color}`} />
                  {stat.value}
                </CardTitle>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Recent uploads */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
          <CardDescription>Last 5 upload operations</CardDescription>
        </CardHeader>
        <CardContent>
          {recentUploads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No uploads yet.</p>
          ) : (
            <div className="space-y-3">
              {recentUploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{upload.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {upload.rowCount} rows &middot; {upload.successCount}{" "}
                      success &middot; {upload.errorCount} errors
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        upload.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : upload.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {upload.status}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {upload.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
