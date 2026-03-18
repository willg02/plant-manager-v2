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
} from "lucide-react";

interface PlantsPageProps {
  searchParams: Promise<{
    regionId?: string;
    type?: string;
    sun?: string;
    water?: string;
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
  "Tree",
  "Shrub",
  "Perennial",
  "Annual",
  "Herb",
  "Vine",
  "Groundcover",
  "Grass",
  "Fern",
  "Succulent",
  "Bulb",
];

const SUN_OPTIONS = ["Full Sun", "Part Sun", "Part Shade", "Full Shade"];
const WATER_OPTIONS = ["Low", "Moderate", "High"];

export default async function PlantsPage({ searchParams }: PlantsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const pageSize = 24;

  const where: Record<string, unknown> = {};

  if (params.regionId) {
    where.availability = { some: { regionId: params.regionId } };
  }
  if (params.type) {
    where.plantType = params.type;
  }
  if (params.sun) {
    where.sunRequirement = params.sun;
  }
  if (params.water) {
    where.waterNeeds = params.water;
  }
  if (params.search) {
    where.OR = [
      { commonName: { contains: params.search, mode: "insensitive" } },
      { botanicalName: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [plants, total] = await Promise.all([
    prisma.plant.findMany({
      where,
      include: {
        availability: {
          include: { supplier: true },
        },
      },
      orderBy: { commonName: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.plant.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  // Build URLs for filters
  function filterUrl(key: string, value: string | undefined) {
    const p = { ...params, page: "1" };
    if (value) {
      (p as Record<string, string>)[key] = value;
    } else {
      delete (p as Record<string, string | undefined>)[key];
    }
    const qs = new URLSearchParams(
      Object.entries(p).filter(([, v]) => v !== undefined) as [string, string][]
    ).toString();
    return `/plants${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Browse Plants
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {total} plant{total !== 1 ? "s" : ""} available
        </p>
      </div>

      {/* Search bar */}
      <form action="/plants" method="GET" className="mb-6">
        {/* Preserve existing filters */}
        {params.type && (
          <input type="hidden" name="type" value={params.type} />
        )}
        {params.sun && <input type="hidden" name="sun" value={params.sun} />}
        {params.water && (
          <input type="hidden" name="water" value={params.water} />
        )}
        {params.regionId && (
          <input type="hidden" name="regionId" value={params.regionId} />
        )}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            name="search"
            defaultValue={params.search}
            placeholder="Search by common or botanical name..."
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm shadow-sm transition-all placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </form>

      {/* Filter chips */}
      <div className="mb-8 space-y-3">
        {/* Type filters */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={filterUrl("type", undefined)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              !params.type
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            All Types
          </Link>
          {PLANT_TYPES.map((type) => (
            <Link
              key={type}
              href={filterUrl("type", params.type === type ? undefined : type)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                params.type === type
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {type}
            </Link>
          ))}
        </div>

        {/* Sun & water filters */}
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 pr-1 text-xs text-gray-400">
            <Sun className="h-3.5 w-3.5" />
          </span>
          {SUN_OPTIONS.map((opt) => (
            <Link
              key={opt}
              href={filterUrl("sun", params.sun === opt ? undefined : opt)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                params.sun === opt
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
              }`}
            >
              {opt}
            </Link>
          ))}

          <span className="ml-2 flex items-center gap-1 pr-1 text-xs text-gray-400">
            <Droplets className="h-3.5 w-3.5" />
          </span>
          {WATER_OPTIONS.map((opt) => (
            <Link
              key={opt}
              href={filterUrl(
                "water",
                params.water === opt ? undefined : opt
              )}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                params.water === opt
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
              }`}
            >
              {opt}
            </Link>
          ))}
        </div>
      </div>

      {/* Plant grid */}
      {plants.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20">
          <Leaf className="mb-4 h-12 w-12 text-gray-200" />
          <h2 className="text-lg font-semibold text-gray-500">
            No plants found
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {plants.map((plant) => {
            const typeColor =
              TYPE_COLORS[plant.plantType || ""] ||
              "bg-gray-100 text-gray-600 border-gray-200";
            const typeIcon = TYPE_ICONS[plant.plantType || ""];

            return (
              <Link key={plant.id} href={`/plants/${plant.id}`}>
                <div className="group relative flex h-full flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-gray-200 hover:shadow-md">
                  {/* Type badge */}
                  {plant.plantType && (
                    <div className="mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeColor}`}
                      >
                        {typeIcon}
                        {plant.plantType}
                      </span>
                    </div>
                  )}

                  {/* Name */}
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700">
                    {plant.commonName}
                  </h3>
                  {plant.botanicalName && (
                    <p className="mt-0.5 text-xs italic text-gray-400">
                      {plant.botanicalName}
                    </p>
                  )}

                  {/* Quick details */}
                  <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-4 text-xs text-gray-400">
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
                  </div>

                  {plant.availability.length > 0 && (
                    <div className="mt-3 border-t border-gray-50 pt-3">
                      <Badge
                        variant="secondary"
                        className="bg-emerald-50 text-emerald-600 text-xs"
                      >
                        {plant.availability.length} supplier
                        {plant.availability.length !== 1 ? "s" : ""}
                      </Badge>
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
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <Link
                  key={pageNum}
                  href={{ query: { ...params, page: String(pageNum) } }}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    pageNum === page
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
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
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
