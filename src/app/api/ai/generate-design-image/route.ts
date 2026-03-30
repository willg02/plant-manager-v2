import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fal } from "@fal-ai/client";

export const runtime = "nodejs";
export const maxDuration = 60;

fal.config({ credentials: process.env.FAL_KEY });

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

interface FalOutput {
  images?: Array<{ url: string }>;
}

interface FalResult {
  data?: FalOutput;
  images?: Array<{ url: string }>;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.FAL_KEY) {
      return NextResponse.json({ error: "FAL_KEY environment variable is not set" }, { status: 500 });
    }

    const { plan, spaceImageDataUrl } = (await req.json()) as {
      plan: DesignPlan;
      spaceImageDataUrl?: string;
    };

    if (!plan?.title || !plan?.plants?.length) {
      return NextResponse.json({ error: "Invalid design plan" }, { status: 400 });
    }

    // ── Step 1: Claude writes an optimised image generation prompt ──────────
    const plantList = plan.plants
      .map((p) => `${p.quantity}x ${p.name} (${p.placement})`)
      .join(", ");

    const hasPhoto = !!spaceImageDataUrl;

    const promptMsg = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Write a vivid image generation prompt for this garden design:

Title: ${plan.title}
Concept: ${plan.concept}
Plants: ${plantList}
Maintenance: ${plan.maintenanceLevel}
Peak season: ${plan.peakSeason}

${hasPhoto
  ? `This is an img2img transformation of a real photo of the space.
The prompt must describe what should REPLACE or BE ADDED to the existing scene —
keep the same architectural elements (walls, fences, paths, structures) but fill in the planting design.
Describe the plants in their naturalistic positions, lush and well-grown.`
  : `Create a photorealistic garden scene showing these plants in a naturalistic arrangement.
Include appropriate architectural context (fence, wall, path) if relevant.`
}

Style: Professional garden photography, beautiful natural lighting, lush well-maintained planting.

Return ONLY the image prompt, no explanation. Keep it under 200 words.`,
        },
      ],
    });

    const imagePrompt =
      promptMsg.content[0]?.type === "text"
        ? promptMsg.content[0].text.trim()
        : `A beautiful ${plan.concept} garden with ${plan.plants.map((p) => p.name).join(", ")}, professional garden photography, natural lighting`;

    let result: FalResult;

    if (hasPhoto) {
      // ── img2img: transform the actual space photo ─────────────────────────
      // Upload the data URL as a fal.ai file first
      const base64Data = spaceImageDataUrl!.split(",")[1];
      const mimeType = spaceImageDataUrl!.split(";")[0].split(":")[1] ?? "image/jpeg";
      const imageBuffer = Buffer.from(base64Data, "base64");
      const imageBlob = new Blob([imageBuffer], { type: mimeType });
      const imageFile = new File([imageBlob], "space.jpg", { type: mimeType });

      const imageUrl = await fal.storage.upload(imageFile);

      result = await fal.run("fal-ai/flux/dev/image-to-image", {
        input: {
          prompt: imagePrompt,
          image_url: imageUrl,
          strength: 0.70,         // 0 = keep original, 1 = completely new
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          enable_safety_checker: true,
        },
      }) as FalResult;
    } else {
      // ── text-to-image: no reference photo ────────────────────────────────
      result = await fal.run("fal-ai/flux/schnell", {
        input: {
          prompt: imagePrompt,
          image_size: "landscape_16_9",
          num_inference_steps: 4,
          num_images: 1,
          enable_safety_checker: true,
        },
      }) as FalResult;
    }

    const images = result?.data?.images ?? result?.images;
    const outputUrl = images?.[0]?.url;

    if (!outputUrl) {
      console.error("[generate-design-image] Unexpected result shape:", JSON.stringify(result));
      return NextResponse.json({ error: "No image returned from fal.ai" }, { status: 500 });
    }

    return NextResponse.json({ imageUrl: outputUrl, prompt: imagePrompt });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate-design-image]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
