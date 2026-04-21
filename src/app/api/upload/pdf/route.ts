import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { claude } from "@/lib/claude";
import { auth } from "@clerk/nextjs/server";

export const maxDuration = 60;

const PDF_EXTRACT_PROMPT = `You are an expert at reading plant nursery availability lists, catalogs, and inventory documents.

Given the raw text extracted from a PDF, identify all plant names mentioned. For each plant, extract:
- commonName: The common/trade name of the plant
- botanicalName: The scientific/botanical name if present (otherwise null)

Return ONLY a valid JSON array of objects. Example:
[
  {"commonName": "Limelight Hydrangea", "botanicalName": "Hydrangea paniculata 'Limelight'"},
  {"commonName": "Eastern Redbud", "botanicalName": "Cercis canadensis"}
]

Rules:
- Include ALL plants mentioned in the text, even if information is sparse
- If only a botanical name is given, use it as commonName too and set botanicalName to the same
- Ignore non-plant content like headers, addresses, phone numbers, pricing, quantities, container sizes
- If the same plant appears multiple times (e.g. different sizes), include it only once
- Clean up names: capitalize properly, remove stray characters or line-break artifacts
- If a section header indicates a plant type (e.g. "ROSES:" or "Azaleas"), use that context to form better common names
- Return ONLY the JSON array, no markdown formatting or explanation`;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const supplierId = formData.get("supplierId") as string;
    const regionId = formData.get("regionId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!supplierId || !regionId) {
      return NextResponse.json(
        { error: "supplierId and regionId are required" },
        { status: 400 }
      );
    }

    // Verify supplier and region exist
    const [supplier, region] = await Promise.all([
      prisma.supplier.findUnique({ where: { id: supplierId } }),
      prisma.region.findUnique({ where: { id: regionId } }),
    ]);

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }
    if (!region) {
      return NextResponse.json(
        { error: "Region not found" },
        { status: 404 }
      );
    }

    // Parse PDF
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdfParse(buffer);
    const pdfText = pdfData.text;

    if (!pdfText || pdfText.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract text from PDF. It may be a scanned image." },
        { status: 400 }
      );
    }

    // Truncate very long PDFs to fit in context
    const maxChars = 50000;
    const truncatedText =
      pdfText.length > maxChars
        ? pdfText.slice(0, maxChars) + "\n\n[... truncated ...]"
        : pdfText;

    // Use Claude to extract plant names
    const message = await claude.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Extract all plant names from this nursery/availability document:\n\n${truncatedText}`,
        },
      ],
      system: PDF_EXTRACT_PROMPT,
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let plants: Array<{ commonName: string; botanicalName?: string | null }>;
    try {
      plants = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          error:
            "AI could not parse the PDF into a structured plant list. The document format may not be supported.",
        },
        { status: 422 }
      );
    }

    if (!Array.isArray(plants) || plants.length === 0) {
      return NextResponse.json(
        { error: "No plants were identified in the PDF." },
        { status: 422 }
      );
    }

    // Return the extracted plants for review before committing
    return NextResponse.json({
      plants,
      pageCount: pdfData.numpages,
      textLength: pdfText.length,
    });
  } catch (error) {
    console.error("POST /api/upload/pdf error:", error);
    return NextResponse.json(
      { error: "PDF processing failed" },
      { status: 500 }
    );
  }
}
