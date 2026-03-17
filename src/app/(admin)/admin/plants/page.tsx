export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
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
import { redirect } from "next/navigation";
import { populatePlantBatch } from "@/lib/ai/populate-plant";

async function deletePlant(formData: FormData) {
  "use server";
  const plantId = formData.get("plantId") as string;
  if (!plantId) return;
  await prisma.plant.delete({ where: { id: plantId } });
  revalidatePath("/admin/plants");
}

async function populateAll() {
  "use server";
  const pending = await prisma.plant.findMany({
    where: { aiPopulated: false },
    select: { id: true },
  });
  if (pending.length === 0) return;

  const plantIds = pending.map((p) => p.id);
  await populatePlantBatch(plantIds);

  revalidatePath("/admin/plants");
  redirect("/admin/plants");
}

export default async function AdminPlantsPage() {
  const plants = await prisma.plant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      availability: {
        include: { supplier: { select: { name: true } } },
        take: 1,
      },
    },
  });

  const pendingCount = plants.filter((p) => !p.aiPopulated).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Plants</h2>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <form action={populateAll}>
              <Button variant="outline" type="submit">
                Populate All ({pendingCount})
              </Button>
            </form>
          )}
          <Link href="/admin/plants/new">
            <Button>
              <Plus className="size-4" />
              Add Plant
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
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
                  No plants found. Add your first plant to get started.
                </TableCell>
              </TableRow>
            ) : (
              plants.map((plant) => (
                <TableRow key={plant.id}>
                  <TableCell className="font-medium">
                    {plant.commonName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {plant.botanicalName || "\u2014"}
                  </TableCell>
                  <TableCell>{plant.plantType || "\u2014"}</TableCell>
                  <TableCell>
                    {plant.aiPopulated ? (
                      <Badge className="bg-green-100 text-green-700">
                        Populated
                      </Badge>
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
                      <form action={deletePlant}>
                        <input type="hidden" name="plantId" value={plant.id} />
                        <Button variant="destructive" size="sm" type="submit">
                          Delete
                        </Button>
                      </form>
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
