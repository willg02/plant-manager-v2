"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Upload, FileSpreadsheet, FileText, CheckCircle, AlertTriangle, Trash2 } from "lucide-react";
import Papa from "papaparse";

interface Supplier {
  id: string;
  name: string;
}

interface Region {
  id: string;
  name: string;
}

type ParsedRow = Record<string, string>;

interface PdfExtractedPlant {
  commonName: string;
  botanicalName?: string | null;
}

const PLANT_FIELDS = [
  { value: "", label: "-- Skip --" },
  { value: "commonName", label: "Common Name" },
  { value: "botanicalName", label: "Botanical Name" },
  { value: "price", label: "Price" },
  { value: "size", label: "Size" },
  { value: "inStock", label: "In Stock" },
];

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [fileName, setFileName] = useState("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [syncMode, setSyncMode] = useState(false);
  const [listTag, setListTag] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    added: number;
    updated: number;
    errors: number;
    removed: number;
    plantIds: string[];
  } | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // PDF upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDragOver, setPdfDragOver] = useState(false);
  const [pdfProcessing, setPdfProcessing] = useState(false);
  const [pdfPlants, setPdfPlants] = useState<PdfExtractedPlant[]>([]);
  const [pdfReviewing, setPdfReviewing] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfSupplierId, setPdfSupplierId] = useState("");
  const [pdfRegionId, setPdfRegionId] = useState("");
  const [pdfResult, setPdfResult] = useState<{ created: number; errors: number } | null>(null);
  const [pdfError, setPdfError] = useState("");

  useEffect(() => {
    async function fetchData() {
      const [suppRes, regRes] = await Promise.all([
        fetch("/api/suppliers"),
        fetch("/api/regions"),
      ]);
      setSuppliers(await suppRes.json());
      setRegions(await regRes.json());
    }
    fetchData();
  }, []);

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    setError("");

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "csv" || extension === "txt") {
      Papa.parse<ParsedRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError(`Parse errors: ${results.errors.map((e) => e.message).join(", ")}`);
            return;
          }
          const headers = results.meta.fields || [];
          setCsvHeaders(headers);
          setParsedData(results.data);

          // Auto-map columns by name similarity
          const autoMapping: Record<string, string> = {};
          for (const header of headers) {
            const lower = header.toLowerCase().replace(/[_\s-]/g, "");
            if (lower.includes("common") || lower === "name" || lower === "plantname") {
              autoMapping[header] = "commonName";
            } else if (lower.includes("botanical") || lower.includes("scientific") || lower.includes("latin")) {
              autoMapping[header] = "botanicalName";
            } else if (lower.includes("price") || lower.includes("cost")) {
              autoMapping[header] = "price";
            } else if (lower.includes("size") || lower.includes("container")) {
              autoMapping[header] = "size";
            } else if (lower.includes("stock") || lower.includes("available") || lower.includes("qty")) {
              autoMapping[header] = "inStock";
            }
          }
          setColumnMapping(autoMapping);
          setStep(3);
        },
      });
    } else if (extension === "xlsx" || extension === "xls") {
      // Dynamic import for xlsx
      import("xlsx").then((XLSX) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(worksheet, {
            defval: "",
          });

          if (jsonData.length === 0) {
            setError("No data found in spreadsheet.");
            return;
          }

          const headers = Object.keys(jsonData[0]);
          setCsvHeaders(headers);
          setParsedData(jsonData);

          // Auto-map
          const autoMapping: Record<string, string> = {};
          for (const header of headers) {
            const lower = header.toLowerCase().replace(/[_\s-]/g, "");
            if (lower.includes("common") || lower === "name" || lower === "plantname") {
              autoMapping[header] = "commonName";
            } else if (lower.includes("botanical") || lower.includes("scientific")) {
              autoMapping[header] = "botanicalName";
            } else if (lower.includes("price") || lower.includes("cost")) {
              autoMapping[header] = "price";
            } else if (lower.includes("size") || lower.includes("container")) {
              autoMapping[header] = "size";
            } else if (lower.includes("stock") || lower.includes("available")) {
              autoMapping[header] = "inStock";
            }
          }
          setColumnMapping(autoMapping);
          setStep(3);
        };
        reader.readAsBinaryString(file);
      });
    } else {
      setError("Unsupported file format. Please use CSV or Excel (.xlsx, .xls) files.");
    }
  }, []);

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function updateMapping(csvCol: string, plantField: string) {
    setColumnMapping((prev) => ({ ...prev, [csvCol]: plantField }));
  }

  async function handleUpload() {
    // Validate mapping has commonName
    const hasCommonName = Object.values(columnMapping).includes("commonName");
    if (!hasCommonName) {
      setError("You must map at least one column to 'Common Name'.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // Transform data using mapping
      const rows = parsedData.map((row) => {
        const mapped: Record<string, string | boolean | number> = {};
        for (const [csvCol, plantField] of Object.entries(columnMapping)) {
          if (plantField && row[csvCol] !== undefined) {
            if (plantField === "inStock") {
              const val = row[csvCol].toString().toLowerCase();
              mapped[plantField] = val === "true" || val === "yes" || val === "1" || val === "y";
            } else if (plantField === "price") {
              const num = parseFloat(row[csvCol].toString().replace(/[^0-9.]/g, ""));
              if (!isNaN(num)) mapped[plantField] = num;
            } else {
              mapped[plantField] = row[csvCol].toString().trim();
            }
          }
        }
        return mapped;
      }).filter((row) => row.commonName);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          regionId,
          fileName,
          rows,
          syncMode,
          listTag: listTag.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      setResult(data);
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setUploading(false);
    }
  }

  async function handlePdfProcess() {
    if (!pdfFile || !pdfSupplierId || !pdfRegionId) return;

    setPdfProcessing(true);
    setPdfError("");

    try {
      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("supplierId", pdfSupplierId);
      formData.append("regionId", pdfRegionId);

      const res = await fetch("/api/upload/pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "PDF processing failed");
      }

      const data = await res.json();
      setPdfPlants(data.plants);
      setPdfReviewing(true);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setPdfProcessing(false);
    }
  }

  function removePdfPlant(index: number) {
    setPdfPlants((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePdfPlant(index: number, field: "commonName" | "botanicalName", value: string) {
    setPdfPlants((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  async function handlePdfUpload() {
    if (pdfPlants.length === 0) return;

    setPdfUploading(true);
    setPdfError("");

    try {
      const rows = pdfPlants
        .filter((p) => p.commonName.trim())
        .map((p) => ({
          commonName: p.commonName.trim(),
          botanicalName: p.botanicalName?.trim() || undefined,
        }));

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: pdfSupplierId,
          regionId: pdfRegionId,
          fileName: pdfFile?.name || "pdf-upload.pdf",
          rows,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      setPdfResult({ created: data.created, errors: data.errors });
      setPdfReviewing(false);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setPdfUploading(false);
    }
  }

  function resetPdf() {
    setPdfFile(null);
    setPdfPlants([]);
    setPdfReviewing(false);
    setPdfResult(null);
    setPdfError("");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h2 className="text-2xl font-bold">CSV / Excel Upload</h2>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex size-8 items-center justify-center rounded-full text-sm font-medium ${
                step >= s
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step > s ? <CheckCircle className="size-5" /> : s}
            </div>
            {s < 5 && (
              <div
                className={`h-0.5 w-8 ${step > s ? "bg-green-600" : "bg-gray-200"}`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Step 1: Select supplier and region */}
      {step >= 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select Supplier & Region</CardTitle>
            <CardDescription>
              Choose the supplier and region for the plant data you are uploading.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierId">Supplier</Label>
                <select
                  id="supplierId"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                >
                  <option value="">Select supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="regionId">Region</Label>
                <select
                  id="regionId"
                  value={regionId}
                  onChange={(e) => setRegionId(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                >
                  <option value="">Select region...</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Sync mode */}
            <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncMode}
                  onChange={(e) => setSyncMode(e.target.checked)}
                  className="h-4 w-4 accent-green-600"
                />
                <div>
                  <p className="text-sm font-medium">Sync inventory</p>
                  <p className="text-xs text-muted-foreground">
                    Remove this supplier&apos;s plants that are <em>not</em> in the uploaded file.
                  </p>
                </div>
              </label>

              {syncMode && (
                <div className="pl-7 space-y-1">
                  <Label htmlFor="listTag" className="text-xs">
                    List tag <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <input
                    id="listTag"
                    type="text"
                    placeholder="e.g. Shrubs, Trees, Perennials"
                    value={listTag}
                    onChange={(e) => setListTag(e.target.value)}
                    className="h-8 w-full max-w-xs rounded-lg border border-input bg-card px-2.5 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {listTag.trim()
                      ? `Only "${listTag.trim()}" records for this supplier will be synced — other list tags are left untouched.`
                      : "No tag: all existing records for this supplier will be synced."}
                  </p>
                </div>
              )}
            </div>

            {step === 1 && (
              <Button
                onClick={() => setStep(2)}
                disabled={!supplierId || !regionId}
              >
                Next
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Upload file */}
      {step >= 2 && step < 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Upload File</CardTitle>
            <CardDescription>
              Upload a CSV or Excel file containing plant data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                dragOver
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 bg-gray-50"
              }`}
            >
              {fileName ? (
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="size-8 text-green-600" />
                  <div>
                    <p className="font-medium">{fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {parsedData.length} rows found
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="mb-2 size-10 text-gray-400" />
                  <p className="mb-1 text-sm font-medium">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports CSV, XLS, XLSX
                  </p>
                </>
              )}
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="mt-3"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Column mapping */}
      {step >= 3 && step < 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Map Columns</CardTitle>
            <CardDescription>
              Map your file columns to plant data fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {csvHeaders.map((header) => (
                <div
                  key={header}
                  className="flex items-center gap-4 rounded border p-2"
                >
                  <span className="w-48 truncate text-sm font-medium">
                    {header}
                  </span>
                  <span className="text-muted-foreground">&rarr;</span>
                  <select
                    value={columnMapping[header] || ""}
                    onChange={(e) => updateMapping(header, e.target.value)}
                    className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  >
                    {PLANT_FIELDS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            {step === 3 && (
              <Button onClick={() => setStep(4)}>
                Next: Review
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review and submit */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Review & Submit</CardTitle>
            <CardDescription>
              Preview the first 10 rows of mapped data before uploading.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.entries(columnMapping)
                      .filter(([, v]) => v)
                      .map(([csvCol, plantField]) => (
                        <TableHead key={csvCol}>
                          {PLANT_FIELDS.find((f) => f.value === plantField)?.label || plantField}
                        </TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 10).map((row, i) => (
                    <TableRow key={i}>
                      {Object.entries(columnMapping)
                        .filter(([, v]) => v)
                        .map(([csvCol]) => (
                          <TableCell key={csvCol}>
                            {row[csvCol]?.toString() || "\u2014"}
                          </TableCell>
                        ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <p className="text-sm text-muted-foreground">
              Showing {Math.min(10, parsedData.length)} of {parsedData.length} rows
            </p>

            <div className="flex gap-2">
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading
                  ? "Uploading..."
                  : `Upload ${parsedData.length} rows`}
              </Button>
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Result */}
      {step === 5 && result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="size-6" />
              Upload Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`grid gap-4 ${syncMode ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold text-green-600">{result.added}</p>
                <p className="text-sm text-muted-foreground">New plants</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
                <p className="text-sm text-muted-foreground">Updated</p>
              </div>
              {syncMode && (
                <div className="rounded-lg border p-4">
                  <p className="text-2xl font-bold text-amber-600">{result.removed}</p>
                  <p className="text-sm text-muted-foreground">
                    Removed{listTag.trim() ? ` (${listTag.trim()})` : ""}
                  </p>
                </div>
              )}
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold text-red-600">{result.errors}</p>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>
            <Button onClick={() => router.push("/admin/plants")}>
              View Plants
            </Button>
          </CardContent>
        </Card>
      )}
      {/* ─── PDF Upload Section ─── */}
      <div className="border-t pt-8 mt-8">
        <h2 className="text-2xl font-bold mb-1">PDF Upload</h2>
        <div className="flex items-start gap-2 mb-6 rounded-lg bg-amber-50 border border-amber-200 p-3">
          <AlertTriangle className="size-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Experimental — Results may vary</p>
            <p className="mt-1">
              PDF files don&apos;t have a standard structure, so AI is used to interpret
              the document and extract plant names. Accuracy depends on the PDF&apos;s
              formatting and quality. Always review the extracted list before uploading.
            </p>
          </div>
        </div>

        {pdfError && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 mb-4">
            {pdfError}
          </div>
        )}

        {pdfResult ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="size-6" />
                PDF Upload Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <p className="text-2xl font-bold text-green-600">
                    {pdfResult.created}
                  </p>
                  <p className="text-sm text-muted-foreground">Plants created</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-2xl font-bold text-red-600">
                    {pdfResult.errors}
                  </p>
                  <p className="text-sm text-muted-foreground">Errors</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => router.push("/admin/plants")}>
                  View Plants
                </Button>
                <Button variant="outline" onClick={resetPdf}>
                  Upload Another PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : pdfReviewing ? (
          <Card>
            <CardHeader>
              <CardTitle>Review Extracted Plants</CardTitle>
              <CardDescription>
                The AI found {pdfPlants.length} plants. Review, edit, or remove
                entries before uploading. Names can be edited inline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Common Name</TableHead>
                      <TableHead>Botanical Name</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pdfPlants.map((plant, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground text-xs">
                          {i + 1}
                        </TableCell>
                        <TableCell>
                          <input
                            type="text"
                            value={plant.commonName}
                            onChange={(e) =>
                              updatePdfPlant(i, "commonName", e.target.value)
                            }
                            className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-green-500 focus:outline-none text-sm py-0.5"
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="text"
                            value={plant.botanicalName || ""}
                            onChange={(e) =>
                              updatePdfPlant(i, "botanicalName", e.target.value)
                            }
                            className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-green-500 focus:outline-none text-sm py-0.5 text-muted-foreground"
                            placeholder="—"
                          />
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => removePdfPlant(i)}
                            className="text-red-400 hover:text-red-600"
                            title="Remove"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <p className="text-sm text-muted-foreground">
                {pdfPlants.length} plants to upload
              </p>

              <div className="flex gap-2">
                <Button
                  onClick={handlePdfUpload}
                  disabled={pdfUploading || pdfPlants.length === 0}
                >
                  {pdfUploading
                    ? "Uploading..."
                    : `Upload ${pdfPlants.length} Plants`}
                </Button>
                <Button variant="outline" onClick={resetPdf}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pdfSupplierId">Supplier</Label>
                  <select
                    id="pdfSupplierId"
                    value={pdfSupplierId}
                    onChange={(e) => setPdfSupplierId(e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  >
                    <option value="">Select supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pdfRegionId">Region</Label>
                  <select
                    id="pdfRegionId"
                    value={pdfRegionId}
                    onChange={(e) => setPdfRegionId(e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  >
                    <option value="">Select region...</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setPdfDragOver(true);
                }}
                onDragLeave={() => setPdfDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setPdfDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file && file.name.toLowerCase().endsWith(".pdf")) {
                    setPdfFile(file);
                    setPdfError("");
                  } else {
                    setPdfError("Please upload a PDF file.");
                  }
                }}
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                  pdfDragOver
                    ? "border-amber-500 bg-amber-50"
                    : "border-gray-300 bg-gray-50"
                }`}
              >
                {pdfFile ? (
                  <div className="flex items-center gap-2">
                    <FileText className="size-8 text-amber-600" />
                    <div>
                      <p className="font-medium">{pdfFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(pdfFile.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <FileText className="mb-2 size-10 text-gray-400" />
                    <p className="mb-1 text-sm font-medium">
                      Drop a PDF here or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Nursery availability lists, catalogs, etc.
                    </p>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPdfFile(file);
                      setPdfError("");
                    }
                  }}
                  className="mt-3"
                />
              </div>

              <Button
                onClick={handlePdfProcess}
                disabled={!pdfFile || !pdfSupplierId || !pdfRegionId || pdfProcessing}
              >
                {pdfProcessing ? "AI is reading the PDF..." : "Extract Plants from PDF"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
