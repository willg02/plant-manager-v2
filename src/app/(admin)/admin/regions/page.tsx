export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
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
import { DeleteRegionButton } from "./delete-region-button";
import { AdminSearch } from "@/components/admin/admin-search";

async function deleteRegion(formData: FormData) {
  "use server";
  const regionId = formData.get("regionId") as string;
  if (!regionId) return;

  // Cascade rules on FK relations handle PlantAvailability, Suppliers,
  // and ChatSession cleanup automatically
  await prisma.region.delete({ where: { id: regionId } });

  revalidatePath("/admin/regions");
}

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminRegionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";

  const where: Prisma.RegionWhereInput = {};
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { state: { contains: query, mode: "insensitive" } },
      { climateZone: { contains: query, mode: "insensitive" } },
    ];
  }

  const regions = await prisma.region.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { suppliers: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Regions</h2>
        <Link href="/admin/regions/new">
          <Button>
            <Plus className="size-4" />
            Add Region
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <AdminSearch placeholder="Search regions..." />
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Climate Zone</TableHead>
              <TableHead>Supplier Count</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {query ? "No regions match your search." : "No regions found."}
                </TableCell>
              </TableRow>
            ) : (
              regions.map((region) => (
                <TableRow key={region.id}>
                  <TableCell className="font-medium">{region.name}</TableCell>
                  <TableCell>{region.state || "\u2014"}</TableCell>
                  <TableCell>{region.climateZone || "\u2014"}</TableCell>
                  <TableCell>{region._count.suppliers}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/regions/${region.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <DeleteRegionButton
                        regionId={region.id}
                        regionName={region.name}
                        supplierCount={region._count.suppliers}
                        action={deleteRegion}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
