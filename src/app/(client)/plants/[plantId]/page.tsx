export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, MessageCircle, CheckCircle, XCircle } from "lucide-react";

interface PlantDetailPageProps {
  params: Promise<{ plantId: string }>;
}

export default async function PlantDetailPage({
  params,
}: PlantDetailPageProps) {
  const { plantId } = await params;

  const plant = await prisma.plant.findUnique({
    where: { id: plantId },
    include: {
      availability: {
        include: {
          supplier: true,
        },
      },
    },
  });

  if (!plant) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/plants"
        className="mb-6 inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Plants
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {plant.commonName}
        </h1>
        {plant.botanicalName && (
          <p className="mt-1 text-lg italic text-gray-500">
            {plant.botanicalName}
          </p>
        )}
        {plant.alternateNames.length > 0 && (
          <p className="mt-1 text-sm text-gray-400">
            Also known as: {plant.alternateNames.join(", ")}
          </p>
        )}
      </div>

      {/* Details Grid */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Plant Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {plant.plantType && (
              <DetailItem label="Type" value={plant.plantType} />
            )}
            {plant.family && (
              <DetailItem label="Family" value={plant.family} />
            )}
            {(plant.hardinessZoneMin || plant.hardinessZoneMax) && (
              <DetailItem
                label="Hardiness Zones"
                value={`${plant.hardinessZoneMin || "?"} - ${plant.hardinessZoneMax || "?"}`}
              />
            )}
            {plant.sunRequirement && (
              <DetailItem label="Sun" value={plant.sunRequirement} />
            )}
            {plant.waterNeeds && (
              <DetailItem label="Water" value={plant.waterNeeds} />
            )}
            {plant.soilPreference && (
              <DetailItem label="Soil" value={plant.soilPreference} />
            )}
            {plant.growthRate && (
              <DetailItem label="Growth Rate" value={plant.growthRate} />
            )}
            {plant.matureHeight && (
              <DetailItem label="Mature Height" value={plant.matureHeight} />
            )}
            {plant.matureWidth && (
              <DetailItem label="Mature Width" value={plant.matureWidth} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bloom Info */}
      {(plant.bloomTime || plant.bloomColor || plant.foliageColor) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bloom &amp; Foliage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {plant.bloomTime && (
                <DetailItem label="Bloom Time" value={plant.bloomTime} />
              )}
              {plant.bloomColor && (
                <DetailItem label="Bloom Color" value={plant.bloomColor} />
              )}
              {plant.foliageColor && (
                <DetailItem label="Foliage Color" value={plant.foliageColor} />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {plant.description && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-relaxed text-gray-700">{plant.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Care Tips */}
      {plant.careTips && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Care Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-relaxed text-gray-700">{plant.careTips}</p>
          </CardContent>
        </Card>
      )}

      {/* Companion Plants */}
      {plant.companionPlants.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Companion Plants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {plant.companionPlants.map((companion) => (
                <Badge key={companion} variant="secondary">
                  {companion}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Availability */}
      {plant.availability.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>In Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plant.availability.map((avail) => (
                  <TableRow key={avail.id}>
                    <TableCell>
                      <Link
                        href={`/suppliers/${avail.supplier.id}`}
                        className="font-medium text-green-700 hover:underline"
                      >
                        {avail.supplier.name}
                      </Link>
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
          </CardContent>
        </Card>
      )}

      {/* Chat CTA */}
      <div className="flex justify-center">
        <Link href="/chat">
          <Button className="bg-green-700 text-white hover:bg-green-600">
            <MessageCircle className="mr-2 h-4 w-4" />
            Chat about this plant
          </Button>
        </Link>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
    </div>
  );
}
