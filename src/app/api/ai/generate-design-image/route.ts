import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fal } from "@fal-ai/client";

export const runtime = "nodejs";
export const maxDuration = 60;

const anthropic = new Anthropic();

interface DesignPlant {
  name: string;
  quantity: number;
  placement: string;
  role: string;
}

interface DesignPlan {
  title: string;
  concept: string;
  plants: DesignPlant[];
  maintenanceLevel: string;
  peakSeason: string;
}

export async function POST(req: NextRequest) {
  try {
    const { plan, spaceDescription } = (await req.json()) as {
      plan: DesignPlan;
      spaceDescription?: string;
    };

    if (!plan?.title || !plan?.plants?.length) {
      return NextResponse.json({ error: "Invalid design plan" }, { status: 400 });
    }

    // ── Step 1: Claude writes an optimised image generation prompt ─────────
    const plantList = plan.plants
      .map((p) => `${p.quantity}x ${p.name} (${p.placement})`)
      .join(", ");

    const promptMsg = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Write a vivid image generation prompt for a professional garden photography shot of this design:

Title: ${plan.title}
Concept: ${plan.concept}
Plants: ${plantList}
Maintenance: ${plan.maintenanceLevel}
Peak season: ${plan.peakSeason}
${spaceDescription ? `Space: ${spaceDescription}` : ""}

Requirements:
- Photorealistic garden scene, eye-level or slight overhead angle
- Show the specific plants named above in a naturalistic arrangement
- Beautiful natural lighting (golden hour or soft daylight)
- Lush, well-maintained residential garden setting
- Professional garden photography style
- Include the architectural/structural context (fence, wall, path, etc.) if relevant

Return ONLY the image prompt, no explanation. Keep it under 250 words.`,
        },
      ],
    });

    const imagePrompt =
      (promptMsg.content[0] as { type: string; text: string }).type === "text"
        ? (promptMsg.content[0] as { type: string; text: string }).text.trim()
        : `A beautiful ${plan.concept} garden with ${plan.plants.map((p) => p.name).join(", ")}, professional garden photography, natural lighting, lush residential garden`;

    // ── Step 2: Generate image via fal.ai FLUX ────────────────────────────
    fal.config({ credentials: process.env.FAL_KEY });

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: imagePrompt,
        image_size: "landscape_16_9",
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      },
    }) as { images?: Array<{ url: string }> };

    const imageUrl = result?.images?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
    }

    return NextResponse.json({ imageUrl, prompt: imagePrompt });
  } catch (err) {
    console.error("[generate-design-image]", err);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
