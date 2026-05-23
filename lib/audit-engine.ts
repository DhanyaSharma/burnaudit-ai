import { AI_TOOL_PRICING } from "@/data/pricing";
import {
  UserToolInput,
  AuditRecommendation,
} from "@/types/audit";

export function runAudit(
  tools: UserToolInput[]
): AuditRecommendation[] {
  const recommendations: AuditRecommendation[] = [];

  // Track tool co-existence for redundancy checks
  const hasCursor = tools.some(t => t.toolName === "Cursor" && !["Free", "Hobby"].includes(t.currentPlan));
  const hasWindsurf = tools.some(t => t.toolName === "Windsurf" && !["Free"].includes(t.currentPlan));

  tools.forEach((tool) => {
    const pricing = AI_TOOL_PRICING[tool.toolName];
    if (!pricing) return;

    let optimizedCost = tool.monthlySpend;
    let recommendedPlan = tool.currentPlan;
    let reasoning = "Your current setup appears efficient.";
    let severity: "low" | "medium" | "high" = "low";

    const currentPlanPricing = pricing[tool.currentPlan];

    // -------------------------------------------------------------------------
    // Rule 0: Overspend detection — user is paying more than plan × seats
    // e.g. Claude Pro = $20/seat. 15 seats = $300/mo. If they enter $2497, flag it.
    // -------------------------------------------------------------------------
    if (
      currentPlanPricing &&
      typeof currentPlanPricing.monthlyCostPerSeat === "number" &&
      currentPlanPricing.monthlyCostPerSeat > 0
    ) {
      const expectedCost = currentPlanPricing.monthlyCostPerSeat * tool.seats;
      const overspendThreshold = expectedCost * 1.2; // Allow 20% buffer for taxes/fees

      if (tool.monthlySpend > overspendThreshold) {
        optimizedCost = expectedCost;
        recommendedPlan = `${tool.currentPlan} (correct seat count)`;
        reasoning = `At ${tool.seats} seat${tool.seats > 1 ? "s" : ""}, ${tool.toolName} ${tool.currentPlan} should cost $${expectedCost.toLocaleString()}/mo ($${currentPlanPricing.monthlyCostPerSeat}/seat). Your reported spend of $${tool.monthlySpend.toLocaleString()}/mo suggests billing errors, unused seats, or untracked add-ons worth auditing immediately.`;
        severity = "high";
      }
    }

    // -------------------------------------------------------------------------
    // Rule 1: Team plans for tiny teams (seats <= 2)
    // -------------------------------------------------------------------------
    if (
      ["Team", "Business", "Enterprise", "Teams"].includes(tool.currentPlan) &&
      tool.seats <= 2
    ) {
      const cheaperPlan =
        pricing["Plus"] ||
        pricing["Pro"] ||
        pricing["Individual"];

      if (cheaperPlan && typeof cheaperPlan.monthlyCostPerSeat === "number") {
        const teamDowngradeCost = cheaperPlan.monthlyCostPerSeat * tool.seats;
        if (teamDowngradeCost < optimizedCost) {
          optimizedCost = teamDowngradeCost;
          recommendedPlan = cheaperPlan.name;
          reasoning = `Small teams of ${tool.seats} seat${tool.seats > 1 ? "s" : ""} don't benefit from the SSO, audit logs, or provisioning overhead in ${tool.currentPlan} tier. Individual ${cheaperPlan.name} accounts at $${cheaperPlan.monthlyCostPerSeat}/seat provide identical AI capabilities at $${teamDowngradeCost}/mo vs your current $${tool.monthlySpend}/mo.`;
          severity = "high";
        }
      }
    }

    // -------------------------------------------------------------------------
    // Rule 2: Monthly vs annual billing savings
    // -------------------------------------------------------------------------
    if (currentPlanPricing?.annualCostPerSeat && !tool.annualBilling) {
      const annualOptimized = currentPlanPricing.annualCostPerSeat * tool.seats;
      if (annualOptimized < optimizedCost) {
        optimizedCost = annualOptimized;
        const savingsPct = Math.round(
          ((currentPlanPricing.monthlyCostPerSeat! - currentPlanPricing.annualCostPerSeat) /
            currentPlanPricing.monthlyCostPerSeat!) * 100
        );
        if (reasoning === "Your current setup appears efficient.") {
          reasoning = `Switching to annual billing saves ${savingsPct}% ($${(currentPlanPricing.monthlyCostPerSeat! - currentPlanPricing.annualCostPerSeat).toFixed(0)}/seat/mo) with no feature changes — standard vendor discount for upfront commitment.`;
        } else {
          reasoning += ` Annual billing would save an additional ${savingsPct}% per seat.`;
        }
        if (severity !== "high") severity = "medium";
      }
    }

    // -------------------------------------------------------------------------
    // Rule 3: Redundant code-autocomplete tools (Cursor/Windsurf + Copilot)
    // -------------------------------------------------------------------------
    if (tool.toolName === "GitHub Copilot" && (hasCursor || hasWindsurf)) {
      optimizedCost = 0;
      recommendedPlan = "Cancel";
      reasoning = `Your team already pays for ${hasCursor ? "Cursor" : "Windsurf"}, an AI-native IDE with built-in inline completions. GitHub Copilot adds zero net capability — this is 100% duplicate spend. Cancel Copilot and redirect the budget.`;
      severity = "high";
    }

    // -------------------------------------------------------------------------
    // Rule 4: Seat count sanity — paying for more seats than team size warrants
    // -------------------------------------------------------------------------
    if (
      currentPlanPricing &&
      typeof currentPlanPricing.monthlyCostPerSeat === "number" &&
      tool.seats > 10 &&
      !currentPlanPricing.isTeamTier
    ) {
      const enterprisePlan = pricing["Enterprise"] || pricing["Business"];
      if (enterprisePlan && typeof enterprisePlan.monthlyCostPerSeat === "number") {
        const enterpriseCost = enterprisePlan.monthlyCostPerSeat * tool.seats;
        if (enterpriseCost < optimizedCost) {
          optimizedCost = enterpriseCost;
          recommendedPlan = enterprisePlan.name;
          reasoning = `With ${tool.seats} seats on a non-team plan, you're missing volume pricing and central billing. Upgrading to ${enterprisePlan.name} at $${enterprisePlan.monthlyCostPerSeat}/seat reduces per-seat cost and adds admin controls your team size requires.`;
          if (severity !== "high") severity = "medium";
        }
      }
    }

    const monthlySavings = Math.max(0, tool.monthlySpend - optimizedCost);

    recommendations.push({
      toolName: tool.toolName,
      currentPlan: tool.currentPlan,
      recommendedPlan,
      currentMonthlyCost: tool.monthlySpend,
      optimizedMonthlyCost: optimizedCost,
      monthlySavings,
      annualSavings: monthlySavings * 12,
      reasoning,
      severity,
    });
  });

  return recommendations;
}