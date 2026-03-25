"use client";

export function ZenHero() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Mist blob 1 — slow drift */}
      <div
        className="absolute -top-32 left-1/4 h-[500px] w-[600px] rounded-full opacity-30 blur-[120px]"
        style={{
          background: "var(--zen-accent)",
          animation: "zen-drift 22s ease-in-out infinite",
        }}
      />

      {/* Mist blob 2 — counter drift */}
      <div
        className="absolute -bottom-20 right-1/4 h-[400px] w-[500px] rounded-full opacity-20 blur-[100px]"
        style={{
          background: "var(--primary)",
          animation: "zen-drift-reverse 28s ease-in-out infinite",
        }}
      />

      {/* Mist blob 3 — subtle center */}
      <div
        className="absolute left-1/2 top-1/2 h-[300px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-[80px]"
        style={{
          background: "var(--zen-accent)",
          animation: "zen-drift 35s ease-in-out infinite reverse",
        }}
      />

      {/* Landscape SVG silhouette */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full opacity-[0.07]"
        viewBox="0 0 1440 280"
        fill="none"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 280 L0 180 Q80 140 160 160 Q240 180 320 140 Q400 100 480 120 Q560 140 640 100 Q720 60 800 80 Q880 100 960 70 Q1040 40 1120 60 Q1200 80 1280 50 Q1360 20 1440 40 L1440 280 Z"
          fill="currentColor"
        />
        <path
          d="M0 280 L0 220 Q120 190 240 210 Q360 230 480 200 Q600 170 720 185 Q840 200 960 175 Q1080 150 1200 165 Q1320 180 1440 160 L1440 280 Z"
          fill="currentColor"
          opacity="0.5"
        />
      </svg>

      {/* Floating leaf 1 */}
      <svg
        className="absolute left-[12%] top-[20%] h-12 w-12 opacity-[0.12]"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: "zen-leaf-sway 6s ease-in-out infinite" }}
      >
        <path
          d="M24 4 C14 4 4 14 4 28 C4 36 10 42 18 44 C18 44 16 32 24 24 C32 16 44 18 44 18 C44 18 34 4 24 4 Z"
          fill="var(--zen-accent)"
        />
        <line x1="24" y1="44" x2="24" y2="24" stroke="var(--zen-accent)" strokeWidth="1" opacity="0.6" />
      </svg>

      {/* Floating leaf 2 */}
      <svg
        className="absolute right-[15%] top-[35%] h-8 w-8 opacity-[0.10]"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: "zen-leaf-sway 8s ease-in-out infinite reverse" }}
      >
        <path
          d="M24 4 C14 4 4 14 4 28 C4 36 10 42 18 44 C18 44 16 32 24 24 C32 16 44 18 44 18 C44 18 34 4 24 4 Z"
          fill="var(--primary)"
        />
      </svg>

      {/* Floating leaf 3 */}
      <svg
        className="absolute left-[60%] top-[15%] h-6 w-6 opacity-[0.08]"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: "zen-leaf-sway 10s ease-in-out infinite" }}
      >
        <path
          d="M24 4 C14 4 4 14 4 28 C4 36 10 42 18 44 C18 44 16 32 24 24 C32 16 44 18 44 18 C44 18 34 4 24 4 Z"
          fill="var(--zen-accent)"
        />
      </svg>

      {/* Stone dots */}
      <div className="absolute bottom-[15%] left-[8%] h-2 w-2 rounded-full bg-muted-foreground opacity-20" />
      <div className="absolute bottom-[20%] left-[10%] h-3 w-3 rounded-full bg-muted-foreground opacity-15" />
      <div className="absolute bottom-[18%] right-[10%] h-2 w-2 rounded-full bg-muted-foreground opacity-20" />
      <div className="absolute bottom-[22%] right-[12%] h-1.5 w-1.5 rounded-full bg-muted-foreground opacity-15" />
    </div>
  );
}
