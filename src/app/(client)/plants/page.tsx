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
import { Badge } from "@/components/ui/badge";
import { Leaf } from "lucide-react";

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Plants</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} plant{total !== 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      {plants.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
          <Leaf className="mb-4 h-12 w-12 text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-600">
            No plants found
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Try adjusting your search or filters to find what you&apos;re
            looking for.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {plants.map((plant) => (
            <Link key={plant.id} href={`/plants/${plant.id}`}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardHeader>
                  <CardTitle>{plant.commonName}</CardTitle>
                  {plant.botanicalName && (
                    <CardDescription className="italic">
                      {plant.botanicalName}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {plant.plantType && (
                      <Badge variant="secondary">{plant.plantType}</Badge>
                    )}
                    {plant.sunRequirement && (
                      <Badge variant="outline">{plant.sunRequirement}</Badge>
                    )}
                  </div>
                  {plant.availability.length > 0 && (
                    <p className="mt-3 text-xs text-gray-500">
                      Available from {plant.availability.length} supplier
                      {plant.availability.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {total > pageSize && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={{ query: { ...params, page: String(page - 1) } }}
              className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-gray-600">
            Page {page} of {Math.ceil(total / pageSize)}
          </span>
          {page * pageSize < total && (
            <Link
              href={{ query: { ...params, page: String(page + 1) } }}
              className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
