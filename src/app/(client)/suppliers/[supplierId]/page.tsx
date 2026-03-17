export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface SupplierDetailPageProps {
  params: Promise<{ supplierId: string }>;
}

export default async function SupplierDetailPage({
  params,
}: SupplierDetailPageProps) {
  const { supplierId } = await params;

  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    include: {
      region: true,
      availability: {
        include: { plant: true },
        orderBy: { plant: { commonName: "asc" } },
      },
    },
  });

  if (!supplier) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/suppliers"
        className="mb-6 inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Suppliers
      </Link>

      {/* Supplier Info Header */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">{supplier.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 text-sm text-gray-600">
              <div>
                <Badge variant="secondary">{supplier.region.name}</Badge>
              </div>
              {supplier.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-gray-400" />
                  <span>
                    {supplier.address}
                    {supplier.city || supplier.state || supplier.zip
                      ? `, ${[supplier.city, supplier.state, supplier.zip].filter(Boolean).join(", ")}`
                      : ""}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2 text-sm text-gray-600">
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
                  <a
                    href={supplier.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 hover:underline"
                  >
                    {supplier.website}
                  </a>
                </div>
              )}
            </div>
          </div>
          {supplier.notes && (
            <p className="mt-4 text-sm text-gray-500">{supplier.notes}</p>
          )}
        </CardContent>
      </Card>

      {/* Plants Available */}
      <Card>
        <CardHeader>
          <CardTitle>
            Plants Available ({supplier.availability.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {supplier.availability.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">
              No plants listed for this supplier yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plant</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>In Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.availability.map((avail) => (
                  <TableRow key={avail.id}>
                    <TableCell>
                      <Link
                        href={`/plants/${avail.plant.id}`}
                        className="font-medium text-green-700 hover:underline"
                      >
                        {avail.plant.commonName}
                      </Link>
                      {avail.plant.botanicalName && (
                        <span className="ml-2 text-xs italic text-gray-400">
                          {avail.plant.botanicalName}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{avail.size || "N/A"}</TableCell>
                    <TableCell>
                      {avail.price
                        ? `$${Number(avail.price).toFixed(2)}`
                        : "Contact"}
                    </TableCell>
                    <TableCell>
                      {avail.inStock ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-500">
                          <XCircle className="h-4 w-4" /> No
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
