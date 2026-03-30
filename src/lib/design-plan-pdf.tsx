import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DesignPlant {
  name: string;
  quantity: number;
  priceEach: string;
  supplier: string;
  placement: string;
  role: string;
}

export interface DesignPlan {
  title: string;
  concept: string;
  totalEstimate: string;
  plants: DesignPlant[];
  installationNotes: string;
  maintenanceLevel: "Low" | "Medium" | "High" | string;
  peakSeason: string;
}

// ── Palette ──────────────────────────────────────────────────────────────────

const JADE = "#4a6b5a";
const GOLD = "#c9a84c";
const CHARCOAL = "#2a2a28";
const STONE = "#6b6960";
const PAPER = "#f5f0e8";
const CARD = "#ffffff";
const BORDER = "#d8d2c4";
const MUTED_BG = "#ece7dc";

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    backgroundColor: PAPER,
    padding: 0,
    fontFamily: "Helvetica",
    color: CHARCOAL,
  },

  // Header band
  header: {
    backgroundColor: JADE,
    paddingHorizontal: 36,
    paddingVertical: 28,
  },
  headerBrand: {
    fontSize: 9,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: CARD,
    marginBottom: 6,
  },
  headerConcept: {
    fontSize: 10,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 1.5,
    maxWidth: 360,
  },
  headerMeta: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 8,
    color: CARD,
  },
  headerCostBlock: {
    position: "absolute",
    right: 36,
    top: 28,
    alignItems: "flex-end",
  },
  headerCostLabel: {
    fontSize: 8,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 2,
  },
  headerCostValue: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: GOLD,
  },

  // Body
  body: {
    paddingHorizontal: 36,
    paddingTop: 24,
    paddingBottom: 36,
  },

  // Section label
  sectionLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: STONE,
    marginBottom: 10,
  },

  // Plant table
  plantRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 12,
  },
  plantDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: JADE,
    marginTop: 4,
    flexShrink: 0,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: CHARCOAL,
    marginBottom: 2,
  },
  plantPlacement: {
    fontSize: 8.5,
    color: STONE,
    lineHeight: 1.4,
  },
  plantTags: {
    flexDirection: "row",
    gap: 5,
    marginTop: 4,
  },
  plantRoleTag: {
    backgroundColor: MUTED_BG,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    fontSize: 7,
    color: STONE,
  },
  plantSupplierTag: {
    backgroundColor: `${JADE}18`,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    fontSize: 7,
    color: JADE,
  },
  plantPricing: {
    alignItems: "flex-end",
    flexShrink: 0,
    minWidth: 60,
  },
  plantLineTotal: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: GOLD,
  },
  plantQtyPrice: {
    fontSize: 7.5,
    color: STONE,
    marginTop: 1,
  },

  // Summary row
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1.5,
    borderTopColor: JADE,
  },
  summaryLeft: {
    fontSize: 9,
    color: STONE,
  },
  summaryRight: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: JADE,
  },

  // Installation notes
  notesBox: {
    backgroundColor: MUTED_BG,
    borderRadius: 8,
    padding: 14,
    marginTop: 22,
  },
  notesText: {
    fontSize: 9,
    color: CHARCOAL,
    lineHeight: 1.55,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7.5,
    color: STONE,
  },
  footerBrand: {
    fontSize: 7.5,
    color: JADE,
    fontFamily: "Helvetica-Bold",
  },
});

// ── PDF Document ─────────────────────────────────────────────────────────────

export function DesignPlanPDF({ plan }: { plan: DesignPlan }) {
  const totalCost = plan.plants.reduce((sum, p) => {
    const price = parseFloat(p.priceEach.replace(/[^0-9.]/g, "")) || 0;
    return sum + price * p.quantity;
  }, 0);

  const totalPlants = plan.plants.reduce((s, p) => s + p.quantity, 0);
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        {/* ── Header ── */}
        <View style={s.header}>
          <Text style={s.headerBrand}>PlantManager · Garden Design Plan</Text>
          <Text style={s.headerTitle}>{plan.title}</Text>
          <Text style={s.headerConcept}>{plan.concept}</Text>

          <View style={s.headerMeta}>
            <Text style={s.headerBadge}>{plan.maintenanceLevel} Maintenance</Text>
            <Text style={s.headerBadge}>Peak: {plan.peakSeason}</Text>
            <Text style={s.headerBadge}>
              {totalPlants} plants · {plan.plants.length} varieties
            </Text>
          </View>

          <View style={s.headerCostBlock}>
            <Text style={s.headerCostLabel}>Estimated Cost</Text>
            <Text style={s.headerCostValue}>
              {totalCost > 0 ? `$${totalCost.toFixed(2)}` : plan.totalEstimate}
            </Text>
          </View>
        </View>

        {/* ── Body ── */}
        <View style={s.body}>
          {/* Plant list */}
          <Text style={s.sectionLabel}>Plant Selection</Text>

          {plan.plants.map((plant, i) => {
            const price =
              parseFloat(plant.priceEach.replace(/[^0-9.]/g, "")) || 0;
            const lineTotal = price * plant.quantity;

            return (
              <View key={i} style={s.plantRow}>
                <View style={s.plantDot} />
                <View style={s.plantInfo}>
                  <Text style={s.plantName}>{plant.name}</Text>
                  <Text style={s.plantPlacement}>{plant.placement}</Text>
                  <View style={s.plantTags}>
                    <Text style={s.plantRoleTag}>{plant.role}</Text>
                    <Text style={s.plantSupplierTag}>{plant.supplier}</Text>
                  </View>
                </View>
                <View style={s.plantPricing}>
                  <Text style={s.plantLineTotal}>
                    {lineTotal > 0 ? `$${lineTotal.toFixed(2)}` : plant.priceEach}
                  </Text>
                  <Text style={s.plantQtyPrice}>
                    {plant.quantity}× {plant.priceEach}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Total */}
          <View style={s.summaryRow}>
            <Text style={s.summaryLeft}>
              {totalPlants} plants from {new Set(plan.plants.map((p) => p.supplier)).size} supplier(s)
            </Text>
            <Text style={s.summaryRight}>
              Total: {totalCost > 0 ? `$${totalCost.toFixed(2)}` : plan.totalEstimate}
            </Text>
          </View>

          {/* Installation notes */}
          {plan.installationNotes && (
            <View style={s.notesBox}>
              <Text style={[s.sectionLabel, { marginBottom: 6 }]}>
                Installation Notes
              </Text>
              <Text style={s.notesText}>{plan.installationNotes}</Text>
            </View>
          )}
        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{dateStr}</Text>
          <Text style={s.footerBrand}>PlantManager</Text>
        </View>
      </Page>
    </Document>
  );
}
