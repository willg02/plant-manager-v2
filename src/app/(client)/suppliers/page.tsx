export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Store, MapPin, Phone, Mail, Globe } from "lucide-react";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    include: {
      region: true,
      _count: { select: { availability: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
        <p className="mt-1 text-sm text-gray-500">
          {suppliers.length} active supplier{suppliers.length !== 1 ? "s" : ""}
        </p>
      </div>

      {suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
          <Store className="mb-4 h-12 w-12 text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-600">
            No suppliers yet
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Suppliers will appear here once they are added.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <Link key={supplier.id} href={`/suppliers/${supplier.id}`}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardHeader>
                  <CardTitle>{supplier.name}</CardTitle>
                  <CardDescription>
                    {supplier.region.name}
                    {supplier.region.state
                      ? ` - ${supplier.region.state}`
                      : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    {(supplier.city || supplier.state) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>
                          {[supplier.city, supplier.state]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{supplier.email}</span>
                      </div>
                    )}
                    {supplier.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{supplier.website}</span>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-gray-400">
                    {supplier._count.availability} plant
                    {supplier._count.availability !== 1 ? "s" : ""} available
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
