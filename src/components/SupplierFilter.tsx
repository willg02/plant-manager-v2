"use client";

import { useState, useEffect, useRef } from "react";
import { Store, ChevronDown, Check } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
}

interface SupplierFilterProps {
  regionId: string | undefined;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function SupplierFilter({ regionId, selectedIds, onChange }: SupplierFilterProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!regionId) { setSuppliers([]); return; }
    fetch(`/api/suppliers?regionId=${regionId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Supplier[]) => setSuppliers(Array.isArray(data) ? data : []))
      .catch(() => setSuppliers([]));
  }, [regionId]);

  // Clear selection when region changes
  useEffect(() => {
    onChange([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionId]);

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]
    );
  }

  // Hide if there's only one supplier (nothing to filter)
  if (!regionId || suppliers.length <= 1) return null;

  const allSelected = selectedIds.length === 0 || selectedIds.length === suppliers.length;
  const isFiltered = !allSelected;

  const label = isFiltered
    ? selectedIds.length === 1
      ? (suppliers.find((s) => s.id === selectedIds[0])?.name ?? "1 supplier")
      : `${selectedIds.length} of ${suppliers.length} suppliers`
    : "All suppliers";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
          isFiltered
            ? "border-primary/50 bg-primary/10 text-foreground"
            : "border-border bg-muted text-muted-foreground hover:bg-card hover:text-foreground"
        }`}
      >
        <Store className="h-3.5 w-3.5 shrink-0" />
        <span className="max-w-36 truncate">{label}</span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-48 rounded-lg border border-border bg-card shadow-lg">
          <div className="p-1">
            <button
              onClick={() => onChange([])}
              className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-foreground hover:bg-muted"
            >
              <Checkbox checked={allSelected} />
              All suppliers
            </button>
            <div className="my-1 border-t border-border" />
            {suppliers.map((s) => (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-foreground hover:bg-muted"
              >
                <Checkbox checked={selectedIds.includes(s.id)} />
                <span className="truncate">{s.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
        checked ? "border-primary bg-primary" : "border-border bg-card"
      }`}
    >
      {checked && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
    </span>
  );
}
