export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { revalidatePath } from "next/cache";
import { PopulateAllButton } from "@/components/admin/populate-all-button";
import { PopulateImagesButton } from "@/components/admin/populate-images-button";
import { DeleteConfirmButton } from "@/components/admin/delete-confirm-button";
import { ClearUnpopulatedButton } from "@/components/admin/clear-unpopulated-button";
import { DeleteAllPlantsButton } from "@/components/admin/delete-all-plants-button";
import { AdminSearch } from "@/components/admin/admin-search";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { StatusFilter } from "@/components/admin/status-filter";

const PAGE_SIZE = 50;

async function deletePlant(formData: FormData) {
  "use server";
  const plantId = formData.get("plantId") as string;
  if (!plantId) return;
  await prisma.plant.delete({ where: { id: plantId } });
  revalidatePath("/admin/plants");
}

async function clearUnpopulated(): Promise<{ deleted: number }> {
  "use server";
  const result = await prisma.plant.deleteMany({
    where: { aiPopulated: false },
  });
  revalidatePath("/admin/plants");
  return { deleted: result.count };
}

async function deleteAllPlants(): Promise<{ deleted: number }> {
  "use server";
  // Delete availability first (cascade would handle it, but explicit is safer for counts)
  await prisma.plantAvailability.deleteMany({});
  const result = await prisma.plant.deleteMany({});
  revalidatePath("/admin/plants");
  return { deleted: result.count };
}

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminPlantsPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const status = typeof params.status === "string" ? params.status : "";
  const page = Math.max(1, parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);

  // Build where clause
  const where: Prisma.PlantWhereInput = {};

  if (query) {
    where.OR = [
      { commonName: { contains: query, mode: "insensitive" } },
      { botanicalName: { contains: query, mode: "insensitive" } },
      { plantType: { contains: query, mode: "insensitive" } },
    ];
  }

  if (status === "populated") {
    where.aiPopulated = true;
  } else if (status === "pending") {
    where.aiPopulated = false;
  } else if (status === "low-confidence") {
    where.aiPopulated = true;
    where.aiConfidence = "low";
  }

  // Parallel queries for data + counts
  const [plants, totalCount, pendingCount, allPlantsCount, lowConfidenceCount] = await Promise.all([
    prisma.plant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        availability: {
          include: { supplier: { select: { name: true } } },
          take: 1,
        },
      },
    }),
    prisma.plant.count({ where }),
    prisma.plant.count({ where: { aiPopulated: false } }),
    prisma.plant.count(),
    prisma.plant.count({ where: { aiPopulated: true, aiConfidence: "low" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Get all pending plant IDs for the Populate All button (only when no filters applied)
  const pendingPlantIds =
    !query && !status
      ? (await prisma.plant.findMany({
          where: { aiPopulated: false },
          select: { id: true },
        })).map((p) => p.id)
      : plants.filter((p) => !p.aiPopulated).map((p) => p.id);

  // Plants missing an image (for the Fetch Images button)
  const noImagePlantIds = !query && !status
    ? (await prisma.plant.findMany({
        where: { imageUrl: null },
        select: { id: true },
      })).map((p) => p.id)
    : plants.filter((p) => !p.imageUrl).map((p) => p.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Plants</h2>
        <div className="flex gap-2">
          {allPlantsCount > 0 && (
            <DeleteAllPlantsButton
              count={allPlantsCount}
              action={deleteAllPlants}
            />
          )}
          {pendingCount > 0 && (
            <>
              <ClearUnpopulatedButton
                count={pendingCount}
                action={clearUnpopulated}
              />
              <PopulateAllButton pendingPlantIds={pendingPlantIds} />
            </>
          )}
          {noImagePlantIds.length > 0 && (
            <PopulateImagesButton plantIds={noImagePlantIds} />
          )}
          <Link href="/admin/plants/new">
            <Button>
              <Plus className="size-4" />
              Add Plant
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <AdminSearch placeholder="Search plants..." />
        <StatusFilter
          paramName="status"
          placeholder="All Status"
          options={[
            { value: "populated", label: "Populated" },
            { value: "pending", label: "Pending" },
            { value: "low-confidence", label: `Low Confidence${lowConfidenceCount > 0 ? ` (${lowConfidenceCount})` : ""}` },
          ]}
        />
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Image</TableHead>
              <TableHead>Common Name</TableHead>
              <TableHead>Botanical Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>AI Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {query || status
                    ? "No plants match your search."
                    : "No plants found. Add your first plant to get started."}
                </TableCell>
              </TableRow>
            ) : (
              plants.map((plant) => (
                <TableRow key={plant.id}>
                  <TableCell>
                    {plant.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={plant.imageUrl}
                        alt={plant.commonName}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                        —
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {plant.commonName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {plant.botanicalName || "\u2014"}
                  </TableCell>
                  <TableCell>{plant.plantType || "\u2014"}</TableCell>
                  <TableCell>
                    {plant.aiPopulated ? (
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-green-100 text-green-700">Populated</Badge>
                        {plant.aiConfidence === "low" && (
                          <Badge className="bg-red-100 text-red-700">Low confidence</Badge>
                        )}
                        {plant.aiConfidence === "medium" && (
                          <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>
                        )}
                      </div>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-700">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/plants/${plant.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <DeleteConfirmButton
                        name={plant.commonName}
                        entityType="plant"
                        hiddenFieldName="plantId"
                        hiddenFieldValue={plant.id}
                        action={deletePlant}
                        extraWarning="This will also remove all availability records for this plant."
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <AdminPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
        />
      </div>
    </div>
  );
}
