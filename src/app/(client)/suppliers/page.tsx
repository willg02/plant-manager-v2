export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Store, MapPin, Phone, Mail, Globe, ArrowUpRight } from "lucide-react";

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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          Suppliers
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {suppliers.length} active supplier
          {suppliers.length !== 1 ? "s" : ""} in your area
        </p>
      </div>

      {suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20">
          <Store className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <h2 className="text-lg font-semibold text-muted-foreground">
            No suppliers yet
          </h2>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Suppliers will appear here once they are added.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <Link key={supplier.id} href={`/suppliers/${supplier.id}`}>
              <div className="group relative flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                {/* Arrow indicator */}
                <ArrowUpRight className="absolute right-5 top-5 h-4 w-4 text-muted-foreground/30 transition-all group-hover:text-[color:var(--zen-accent)]" />

                {/* Name & region */}
                <h3 className="text-base font-semibold text-foreground transition-colors group-hover:text-primary" style={{ fontFamily: "var(--font-display)" }}>
                  {supplier.name}
                </h3>
                <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {supplier.region.name}
                  {supplier.region.state ? ` · ${supplier.region.state}` : ""}
                </span>

                {/* Contact info */}
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {(supplier.city || supplier.state) && (
                    <div className="flex items-center gap-2.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                      <span>{[supplier.city, supplier.state].filter(Boolean).join(", ")}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.website && (
                    <div className="flex items-center gap-2.5">
                      <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                      <span className="truncate">{supplier.website}</span>
                    </div>
                  )}
                </div>

                {/* Plant count */}
                <div className="mt-auto pt-4">
                  <div className="rounded-lg bg-muted px-3 py-2 text-center text-xs font-medium text-muted-foreground">
                    {supplier._count.availability} plant
                    {supplier._count.availability !== 1 ? "s" : ""} available
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
