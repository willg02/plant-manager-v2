export const PLANT_TYPES = [
  "Annual",
  "Perennial",
  "Shrub",
  "Tree",
  "Vine",
  "Groundcover",
  "Grass",
  "Fern",
  "Succulent",
  "Bulb",
  "Herb",
  "Aquatic",
] as const;

export const SUN_REQUIREMENTS = [
  "Full Sun",
  "Part Sun",
  "Part Shade",
  "Full Shade",
] as const;

export const WATER_NEEDS = ["Low", "Moderate", "High"] as const;

export const GROWTH_RATES = ["Slow", "Moderate", "Fast"] as const;

export const HARDINESS_ZONES = [
  "1a", "1b", "2a", "2b", "3a", "3b",
  "4a", "4b", "5a", "5b", "6a", "6b",
  "7a", "7b", "8a", "8b", "9a", "9b",
  "10a", "10b", "11a", "11b", "12a", "12b",
  "13a", "13b",
] as const;

export const CONTAINER_SIZES = [
  "Bare Root",
  "Plug",
  "4 inch",
  "1 Quart",
  "1 Gallon",
  "2 Gallon",
  "3 Gallon",
  "5 Gallon",
  "7 Gallon",
  "10 Gallon",
  "15 Gallon",
  "25 Gallon",
  "Balled & Burlapped",
] as const;
