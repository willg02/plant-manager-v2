import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { DesignPlanPDF, type DesignPlan } from "@/lib/design-plan-pdf";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const plan = (await req.json()) as DesignPlan;

    if (!plan?.title || !plan?.plants) {
      return NextResponse.json({ error: "Invalid design plan" }, { status: 400 });
    }

    const buffer = await renderToBuffer(
      createElement(DesignPlanPDF, { plan })
    );

    const safeName = plan.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="plantmanager-${safeName}.pdf"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error("[design/pdf]", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
