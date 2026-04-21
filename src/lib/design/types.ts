export interface BedVertex {
  x: number; // feet
  y: number; // feet
}

export type SunOrientation = "N" | "S" | "E" | "W";

export interface DesignMessage {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  createdAt: string;
}

export interface PlantPlacement {
  plantId: string;
  x: number;
  y: number;
  spreadRadius: number; // feet
  quantity: number;
}

export interface DesignLayout {
  placements: PlantPlacement[];
  notes?: string;
  createdAt: string;
}

export type DesignStatus = "draft" | "generated";
