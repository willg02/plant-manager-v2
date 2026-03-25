export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Leaf,
  Sun,
  Droplets,
  TreeDeciduous,
  Flower2,
  Shrub,
  Sprout,
  Search,
  Store,
  ArrowUpDown,
  PackageCheck,
  Gauge,
} from "lucide-react";

interface PlantsPageProps {
  searchParams: Promise<{
    regionId?: string;
    supplierId?: string;
    type?: string;
    sun?: string;
    water?: string;
    growthRate?: string;
    inStock?: string;
    sort?: string;
    search?: string;
    page?: string;
  }>;
}

const TYPE_COLORS: Record<string, string> = {
  Tree: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Shrub: "bg-green-500/10 text-green-600 border-green-500/20",
  Perennial: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  Annual: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  Herb: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Vine: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  Groundcover: "bg-lime-500/10 text-lime-600 border-lime-500/20",
  Grass: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  Fern: "bg-green-500/10 text-green-700 border-green-500/20",
  Succulent: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  Bulb: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Tree: <TreeDeciduous className="h-3.5 w-3.5" />,
  Shrub: <Shrub className="h-3.5 w-3.5" />,
  Herb: <Sprout className="h-3.5 w-3.5" />,
  Perennial: <Flower2 className="h-3.5 w-3.5" />,
  Annual: <Flower2 className="h-3.5 w-3.5" />,
};

const PLANT_TYPES = [
  "Tree", "Shrub", "Perennial", "Annual", "Herb",
  "Vine", "Groundcover", "Grass", "Fern", "Succulent", "Bulb",
];

const SUN_OPTIONS = ["Full Sun", "Part Sun", "Part Shade", "Full Shade"];
const WATER_OPTIONS = ["Low", "Moderate", "High"];
const GROWTH_RATE_OPTIONS = ["Slow", "Moderate", "Fast"];

const SORT_OPTIONS = [
  { value: "name_asc",  label: "Name A → Z" },
  { value: "name_desc", label: "Name Z → A" },
  { value: "newest",    label: "Newest First" },
];

function sortToOrderBy(sort?: string) {
  switch (sort) {
    case "name_desc": return { commonName: "desc" as const };
    case "newest":    return { createdAt: "desc" as const };
    default:          return { commonName: "asc" as const };
  }
}

export default async function PlantsPage({ searchParams }: PlantsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const pageSize = 24;

  // Build Prisma where clause
  const where: Record<string, unknown> = {};

  const availabilityFilter: Record<string, unknown> = {};
  if (params.regionId)   availabilityFilter.regionId   = params.regionId;
  if (params.supplierId) availabilityFilter.supplierId = params.supplierId;
  if (params.inStock === "1") availabilityFilter.inStock = true;

  if (Object.keys(availabilityFilter).length > 0) {
    where.availability = { some: availabilityFilter };
  }

  if (params.type)       where.plantType       = params.type;
  if (params.sun)        where.sunRequirement  = params.sun;
  if (params.water)      where.waterNeeds      = params.water;
  if (params.growthRate) where.growthRate      = params.growthRate;

  if (params.search) {
    where.OR = [
      { commonName:    { contains: params.search, mode: "insensitive" } },
      { botanicalName: { contains: params.search, mode: "insensitive" } },
    ];
  }

  // Fetch suppliers for the filter row (scoped to region if selected)
  const [plants, total, suppliers] = await Promise.all([
    prisma.plant.findMany({
      where,
      include: {
        availability: { include: { supplier: true } },
      },
      orderBy: sortToOrderBy(params.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.plant.count({ where }),
    prisma.supplier.findMany({
      where: {
        isActive: true,
        ...(params.regionId ? { regionId: params.regionId } : {}),
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, city: true, state: true },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  // Builds a URL with one param toggled, resetting to page 1
  function filterUrl(key: string, value: string | undefined) {
    const p = { ...params, page: "1" } as Record<string, string | undefined>;
    if (value !== undefined) {
      p[key] = value;
    } else {
      delete p[key];
    }
    const qs = new URLSearchParams(
      Object.entries(p).filter(([, v]) => v !== undefined) as [string, string][]
    ).toString();
    return `/plants${qs ? `?${qs}` : ""}`;
  }

  // Count how many filters are active (excluding search/page)
  const activeFilterCount = [
    params.type, params.sun, params.water, params.growthRate,
    params.supplierId, params.inStock, params.sort,
  ].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Browse Plants
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString()} plant{total !== 1 ? "s" : ""} available
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-[color:var(--zen-accent)]">
                {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
              </span>
            )}
          </p>
        </div>
        {activeFilterCount > 0 && (
          <Link
            href="/plants"
            className="text-sm font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Clear all filters
          </Link>
        )}
      </div>

      {/* Search bar */}
      <form action="/plants" method="GET" className="mb-6">
        {params.type       && <input type="hidden" name="type"       value={params.type} />}
        {params.sun        && <input type="hidden" name="sun"        value={params.sun} />}
        {params.water      && <input type="hidden" name="water"      value={params.water} />}
        {params.growthRate && <input type="hidden" name="growthRate" value={params.growthRate} />}
        {params.supplierId && <input type="hidden" name="supplierId" value={params.supplierId} />}
        {params.regionId   && <input type="hidden" name="regionId"   value={params.regionId} />}
        {params.inStock    && <input type="hidden" name="inStock"    value={params.inStock} />}
        {params.sort       && <input type="hidden" name="sort"       value={params.sort} />}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            name="search"
            defaultValue={params.search}
            placeholder="Search by common or botanical name..."
            className="h-11 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </form>

      {/* ── Filter panel ── */}
      <div className="mb-8 space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">

        {/* Plant type */}
        <FilterRow label="Type" icon={<Leaf className="h-3.5 w-3.5" />}>
          <Chip label="All" active={!params.type} href={filterUrl("type", undefined)} />
          {PLANT_TYPES.map((t) => (
            <Chip
              key={t}
              label={t}
              active={params.type === t}
              href={filterUrl("type", params.type === t ? undefined : t)}
            />
          ))}
        </FilterRow>

        {/* Supplier */}
        {suppliers.length > 0 && (
          <FilterRow label="Supplier" icon={<Store className="h-3.5 w-3.5" />}>
            <Chip label="All Suppliers" active={!params.supplierId} href={filterUrl("supplierId", undefined)} />
            {suppliers.map((s) => (
              <Chip
                key={s.id}
                label={s.name}
                sublabel={s.city ? `${s.city}${s.state ? `, ${s.state}` : ""}` : undefined}
                active={params.supplierId === s.id}
                href={filterUrl("supplierId", params.supplierId === s.id ? undefined : s.id)}
                color="supplier"
              />
            ))}
          </FilterRow>
        )}

        {/* Sun */}
        <FilterRow label="Sun" icon={<Sun className="h-3.5 w-3.5 text-amber-500" />}>
          {SUN_OPTIONS.map((opt) => (
            <Chip key={opt} label={opt} active={params.sun === opt} href={filterUrl("sun", params.sun === opt ? undefined : opt)} color="sun" />
          ))}
        </FilterRow>

        {/* Water */}
        <FilterRow label="Water" icon={<Droplets className="h-3.5 w-3.5 text-blue-500" />}>
          {WATER_OPTIONS.map((opt) => (
            <Chip key={opt} label={opt} active={params.water === opt} href={filterUrl("water", params.water === opt ? undefined : opt)} color="water" />
          ))}
        </FilterRow>

        {/* Growth Rate */}
        <FilterRow label="Growth" icon={<Gauge className="h-3.5 w-3.5 text-violet-500" />}>
          {GROWTH_RATE_OPTIONS.map((opt) => (
            <Chip key={opt} label={opt} active={params.growthRate === opt} href={filterUrl("growthRate", params.growthRate === opt ? undefined : opt)} color="growth" />
          ))}
        </FilterRow>

        {/* Sort + In Stock */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <FilterRow label="Sort" icon={<ArrowUpDown className="h-3.5 w-3.5" />} inline>
            {SORT_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                active={params.sort === opt.value || (!params.sort && opt.value === "name_asc")}
                href={filterUrl("sort", params.sort === opt.value ? undefined : opt.value)}
              />
            ))}
          </FilterRow>

          <Link
            href={filterUrl("inStock", params.inStock === "1" ? undefined : "1")}
            className={`ml-auto flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
              params.inStock === "1"
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted"
            }`}
          >
            <PackageCheck className="h-3.5 w-3.5" />
            In Stock Only
          </Link>
        </div>
      </div>

      {/* Plant grid */}
      {plants.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20">
          <Leaf className="mb-4 h-12 w-12 text-muted-foreground/20" />
          <h2 className="text-lg font-semibold text-muted-foreground">No plants found</h2>
          <p className="mt-1 text-sm text-muted-foreground/70">Try adjusting your search or filters.</p>
          <Link href="/plants" className="mt-4 text-sm font-medium text-primary hover:opacity-80">
            Clear all filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {plants.map((plant) => {
            const typeColor =
              TYPE_COLORS[plant.plantType || ""] ||
              "bg-muted text-muted-foreground border-border";
            const typeIcon = TYPE_ICONS[plant.plantType || ""];
            const inStockCount = plant.availability.filter((a) => a.inStock).length;

            return (
              <Link key={plant.id} href={`/plants/${plant.id}`}>
                <div className="group relative flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                  {/* Type badge */}
                  {plant.plantType && (
                    <div className="mb-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeColor}`}>
                        {typeIcon}
                        {plant.plantType}
                      </span>
                    </div>
                  )}

                  {/* Name */}
                  <h3 className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                    {plant.commonName}
                  </h3>
                  {plant.botanicalName && (
                    <p className="mt-0.5 text-xs italic text-muted-foreground">
                      {plant.botanicalName}
                    </p>
                  )}

                  {/* Quick details */}
                  <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-4 text-xs text-muted-foreground">
                    {plant.sunRequirement && (
                      <span className="flex items-center gap-1">
                        <Sun className="h-3 w-3 text-amber-400" />
                        {plant.sunRequirement}
                      </span>
                    )}
                    {plant.waterNeeds && (
                      <span className="flex items-center gap-1">
                        <Droplets className="h-3 w-3 text-blue-400" />
                        {plant.waterNeeds}
                      </span>
                    )}
                    {plant.growthRate && (
                      <span className="flex items-center gap-1">
                        <Gauge className="h-3 w-3 text-violet-400" />
                        {plant.growthRate}
                      </span>
                    )}
                  </div>

                  {/* Supplier / stock footer */}
                  {plant.availability.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                      <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                        {plant.availability.length} supplier{plant.availability.length !== 1 ? "s" : ""}
                      </Badge>
                      {inStockCount > 0 ? (
                        <span className="ml-auto text-xs text-primary">✓ In Stock</span>
                      ) : (
                        <span className="ml-auto text-xs text-muted-foreground/50">Out of Stock</span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={{ query: { ...params, page: String(page - 1) } }}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted"
            >
              Previous
            </Link>
          )}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7)             pageNum = i + 1;
              else if (page <= 4)              pageNum = i + 1;
              else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
              else                             pageNum = page - 3 + i;
              return (
                <Link
                  key={pageNum}
                  href={{ query: { ...params, page: String(pageNum) } }}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    pageNum === page
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {pageNum}
                </Link>
              );
            })}
          </div>
          {page < totalPages && (
            <Link
              href={{ query: { ...params, page: String(page + 1) } }}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ── Small reusable components ────────────────────────────────────────────────

function FilterRow({
  label,
  icon,
  children,
  inline = false,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  inline?: boolean;
}) {
  return (
    <div className={`flex ${inline ? "items-center" : "items-start"} gap-3`}>
      <span className="flex w-20 shrink-0 items-center gap-1.5 pt-1 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  label,
  sublabel,
  active,
  href,
  color,
}: {
  label: string;
  sublabel?: string;
  active: boolean;
  href: string;
  color?: "sun" | "water" | "supplier" | "growth";
}) {
  const activeStyles: Record<string, string> = {
    sun:      "border-amber-400/50  bg-amber-500/10   text-amber-600 dark:text-amber-400",
    water:    "border-blue-400/50   bg-blue-500/10    text-blue-600 dark:text-blue-400",
    supplier: "border-violet-400/50 bg-violet-500/10  text-violet-600 dark:text-violet-400",
    growth:   "border-fuchsia-400/50 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
    default:  "border-primary/50    bg-primary/10     text-primary",
  };
  const inactiveStyle = "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted hover:text-foreground";
  const activeStyle = active
    ? (activeStyles[color ?? "default"] ?? activeStyles.default)
    : inactiveStyle;

  return (
    <Link
      href={href}
      className={`flex flex-col rounded-full border px-3 py-1.5 text-xs font-medium transition-all leading-tight ${activeStyle}`}
    >
      <span>{label}</span>
      {sublabel && <span className="text-[10px] opacity-70">{sublabel}</span>}
    </Link>
  );
}
