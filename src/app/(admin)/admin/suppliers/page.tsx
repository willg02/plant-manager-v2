export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
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
import { SupplierClearButtons } from "@/components/admin/supplier-clear-buttons";
import { DeleteConfirmButton } from "@/components/admin/delete-confirm-button";

async function deleteSupplier(formData: FormData) {
  "use server";
  const supplierId = formData.get("supplierId") as string;
  if (!supplierId) return;
  await prisma.supplier.delete({ where: { id: supplierId } });
  revalidatePath("/admin/suppliers");
}

export default async function AdminSuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: {
      region: { select: { name: true } },
      _count: { select: { availability: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Suppliers</h2>
        <Link href="/admin/suppliers/new">
          <Button>
            <Plus className="size-4" />
            Add Supplier
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Plant Count</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No suppliers found.
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.region.name}</TableCell>
                  <TableCell>{supplier.city || "\u2014"}</TableCell>
                  <TableCell>{supplier._count.availability}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <SupplierClearButtons
                        supplierId={supplier.id}
                        supplierName={supplier.name}
                        plantCount={supplier._count.availability}
                      />
                      <Link href={`/admin/suppliers/${supplier.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <DeleteConfirmButton
                        name={supplier.name}
                        entityType="supplier"
                        hiddenFieldName="supplierId"
                        hiddenFieldValue={supplier.id}
                        action={deleteSupplier}
                        extraWarning="This will also remove all plant listings for this supplier."
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
