export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  MessageCircle,
  CheckCircle,
  XCircle,
  Sun,
  Droplets,
  Ruler,
  TrendingUp,
  Flower2,
  Leaf,
  MapPin,
  Calendar,
  Palette,
  Globe,
} from "lucide-react";

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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Back link */}
      <Link
        href="/plants"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Plants
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {plant.commonName}
            </h1>
            {plant.botanicalName && (
              <p className="mt-1 text-lg italic text-gray-400">
                {plant.botanicalName}
              </p>
            )}
            {plant.alternateNames.length > 0 && (
              <p className="mt-2 text-sm text-gray-400">
                Also known as: {plant.alternateNames.join(", ")}
              </p>
            )}
          </div>
          {plant.plantType && (
            <Badge className="mt-1 bg-emerald-50 text-emerald-600 border-emerald-200">
              {plant.plantType}
            </Badge>
          )}
        </div>
      </div>

      {/* Quick stats row */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {plant.sunRequirement && (
          <QuickStat
            icon={<Sun className="h-4 w-4 text-amber-500" />}
            label="Sun"
            value={plant.sunRequirement}
          />
        )}
        {plant.waterNeeds && (
          <QuickStat
            icon={<Droplets className="h-4 w-4 text-blue-500" />}
            label="Water"
            value={plant.waterNeeds}
          />
        )}
        {(plant.hardinessZoneMin || plant.hardinessZoneMax) && (
          <QuickStat
            icon={<Globe className="h-4 w-4 text-green-500" />}
            label="Zones"
            value={`${plant.hardinessZoneMin || "?"} – ${plant.hardinessZoneMax || "?"}`}
          />
        )}
        {plant.growthRate && (
          <QuickStat
            icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
            label="Growth"
            value={plant.growthRate}
          />
        )}
      </div>

      {/* Details grid */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {/* Left column */}
          <div className="space-y-0 divide-y">
            {plant.family && (
              <DetailRow icon={<Leaf className="h-4 w-4" />} label="Family" value={plant.family} />
            )}
            {plant.matureHeight && (
              <DetailRow icon={<Ruler className="h-4 w-4" />} label="Mature Height" value={plant.matureHeight} />
            )}
            {plant.matureWidth && (
              <DetailRow icon={<Ruler className="h-4 w-4 rotate-90" />} label="Mature Width" value={plant.matureWidth} />
            )}
            {plant.soilPreference && (
              <DetailRow icon={<MapPin className="h-4 w-4" />} label="Soil" value={plant.soilPreference} />
            )}
          </div>

          {/* Right column */}
          <div className="space-y-0 divide-y">
            {plant.bloomTime && (
              <DetailRow icon={<Calendar className="h-4 w-4" />} label="Bloom Time" value={plant.bloomTime} />
            )}
            {plant.bloomColor && (
              <DetailRow icon={<Palette className="h-4 w-4" />} label="Bloom Color" value={plant.bloomColor} />
            )}
            {plant.foliageColor && (
              <DetailRow icon={<Flower2 className="h-4 w-4" />} label="Foliage" value={plant.foliageColor} />
            )}
            {plant.nativeRegion && (
              <DetailRow icon={<Globe className="h-4 w-4" />} label="Native Region" value={plant.nativeRegion} />
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {plant.description && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
            About
          </h2>
          <p className="leading-relaxed text-gray-700">{plant.description}</p>
        </div>
      )}

      {/* Care Tips */}
      {plant.careTips && (
        <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50/50 p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-600">
            Care Tips
          </h2>
          <p className="leading-relaxed text-gray-700">{plant.careTips}</p>
        </div>
      )}

      {/* Companion Plants */}
      {plant.companionPlants.length > 0 && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Companion Plants
          </h2>
          <div className="flex flex-wrap gap-2">
            {plant.companionPlants.map((companion) => (
              <Badge
                key={companion}
                variant="secondary"
                className="bg-gray-50 text-gray-600"
              >
                {companion}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Availability */}
      {plant.availability.length > 0 && (
        <div className="mb-8 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-50 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              Availability
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plant.availability.map((avail) => (
                <TableRow key={avail.id}>
                  <TableCell>
                    <Link
                      href={`/suppliers/${avail.supplier.id}`}
                      className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                    >
                      {avail.supplier.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {avail.size || "—"}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {avail.price
                      ? `$${Number(avail.price).toFixed(2)}`
                      : "Contact"}
                  </TableCell>
                  <TableCell>
                    {avail.inStock ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
                        <CheckCircle className="h-4 w-4" /> In Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
                        <XCircle className="h-4 w-4" /> Unavailable
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Chat CTA */}
      <div className="flex justify-center rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="text-center">
          <p className="mb-4 text-sm text-gray-500">
            Have questions about {plant.commonName}?
          </p>
          <Link href="/chat">
            <Button className="rounded-full bg-gray-900 px-6 text-white hover:bg-gray-800">
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat with AI
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function QuickStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      {icon}
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 px-6 py-4">
      <span className="mt-0.5 text-gray-300">{icon}</span>
      <div>
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p className="mt-0.5 text-sm text-gray-900">{value}</p>
      </div>
    </div>
  );
}
