import { AI_TOOL_PRICING } from "@/data/pricing";
import {
  UserToolInput,
  AuditRecommendation,
} from "@/types/audit";

export function runAudit(
  tools: UserToolInput[]
): AuditRecommendation[] {
  const recommendations: AuditRecommendation[] = [];

  // Track tool co-existence across the entire stack for Redundancy checks
  const hasCursor = tools.some(t => t.toolName === "Cursor" && !["Free", "Hobby"].includes(t.currentPlan));
  const hasWindsurf = tools.some(t => t.toolName === "Windsurf" && !["Free"].includes(t.currentPlan));

  tools.forEach((tool) => {
    const pricing = AI_TOOL_PRICING[tool.toolName];

    if (!pricing) return;

    let optimizedCost = tool.monthlySpend;
    let recommendedPlan = tool.currentPlan;
    let reasoning = "Your current setup appears efficient.";
    let severity: "low" | "medium" | "high" = "low";

    // -------------------------------------------------------------------------
    // Rule 1: Team plans for tiny teams (Seats <= 2)
    // -------------------------------------------------------------------------
    if (
      ["Team", "Business", "Enterprise", "Teams"].includes(tool.currentPlan) &&
      tool.seats <= 2
    ) {
      const cheaperPlan =
        pricing["Plus"] ||
        pricing["Pro"] ||
        pricing["Individual"];

      // Defensive Check: Ensure cheaperPlan exists AND its price is a valid number
      if (cheaperPlan && typeof cheaperPlan.monthlyCostPerSeat === "number") {
        optimizedCost = cheaperPlan.monthlyCostPerSeat * tool.seats;
        recommendedPlan = cheaperPlan.name;
        reasoning = "Small teams (2 or fewer seats) typically do not benefit from administrative, compliance, or user provisioning overhead. Downgrading to independent individual accounts provides identical AI capabilities[cite: 59].";
        severity = "high";
      }
    }

    // -------------------------------------------------------------------------
    // Rule 2: Monthly vs annual billing
    // -------------------------------------------------------------------------
    const currentPlanPricing = pricing[tool.currentPlan];

    if (
      currentPlanPricing?.annualCostPerSeat &&
      !tool.annualBilling
    ) {
      const annualOptimized = currentPlanPricing.annualCostPerSeat * tool.seats;

      if (annualOptimized < optimizedCost) {
        optimizedCost = annualOptimized;
        
        // Clean up text concatenation so it doesn't leave trailing placeholder defaults
        if (reasoning === "Your current setup appears efficient.") {
          reasoning = "Commit to annual billing to unlock standard volume platform discounts[cite: 60].";
        } else {
          reasoning += " Switching to annual billing would further compress costs[cite: 60].";
        }
        
        if (severity !== "high") severity = "medium";
      }
    }

    // -------------------------------------------------------------------------
    // Rule 3: Redundant Code-Autocomplete Stacking (Cursor / Windsurf vs. Copilot)
    // -------------------------------------------------------------------------
    if (tool.toolName === "GitHub Copilot" && (hasCursor || hasWindsurf)) {
      optimizedCost = 0;
      recommendedPlan = "None (Cancel)";
      reasoning = `Your engineering team is already utilizing an AI-native IDE (${hasCursor ? "Cursor" : "Windsurf"}) featuring high-performance inline auto-completions. Maintaining distinct standalone Copilot licenses represents 100% duplicate spending[cite: 61].`;
      severity = "high";
    }

    const monthlySavings = tool.monthlySpend - optimizedCost;

    recommendations.push({
      toolName: tool.toolName,
      currentPlan: tool.currentPlan,
      recommendedPlan,
      currentMonthlyCost: tool.monthlySpend,
      optimizedMonthlyCost: optimizedCost,
      monthlySavings: monthlySavings > 0 ? monthlySavings : 0,
      annualSavings: (monthlySavings > 0 ? monthlySavings : 0) * 12,
      reasoning,
      severity,
    });
  });

  return recommendations;
}