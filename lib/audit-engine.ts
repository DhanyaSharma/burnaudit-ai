import { AI_TOOL_PRICING } from "@/data/pricing";
import { UserToolInput, AuditRecommendation } from "@/types/audit";

// ---------------------------------------------------------------------------
// Alternative tool suggestions by use case
// When a user is overpaying, we suggest a cheaper tool that fits their job.
// ---------------------------------------------------------------------------
const USE_CASE_ALTERNATIVES: Record<string, Record<string, { tool: string; plan: string; monthlyCost: number; reason: string }>> = {
  coding: {
    "GitHub Copilot": {
      tool: "Cursor",
      plan: "Pro",
      monthlyCost: 20,
      reason: "Cursor Pro ($20/seat) includes inline completions, chat, and multi-file edits in one IDE — GitHub Copilot Individual ($10/seat) only adds completions to your existing editor with no chat or agent mode. For coding-primary teams, Cursor replaces Copilot entirely.",
    },
    ChatGPT: {
      tool: "Claude",
      plan: "Pro",
      monthlyCost: 20,
      reason: "Claude Pro ($20/seat) benchmarks equal or above GPT-4o on coding tasks (HumanEval, SWE-bench) at the same price. For coding use cases, Claude's longer context window (200k tokens) handles larger codebases without truncation.",
    },
    Gemini: {
      tool: "Cursor",
      plan: "Pro",
      monthlyCost: 20,
      reason: "Gemini is a general-purpose assistant. For coding-primary teams, Cursor Pro ($20/seat) provides a purpose-built coding IDE with AI agents, eliminating the context-switch between a chat tool and your editor.",
    },
  },
  writing: {
    Cursor: {
      tool: "Claude",
      plan: "Pro",
      monthlyCost: 20,
      reason: "Cursor is purpose-built for coding. For writing-primary use cases, Claude Pro ($20/seat) provides superior long-form reasoning, document analysis, and prose generation — you're paying for IDE features you don't use.",
    },
    "GitHub Copilot": {
      tool: "Claude",
      plan: "Pro",
      monthlyCost: 20,
      reason: "GitHub Copilot is optimized for code completion, not writing. Claude Pro ($20/seat) is a better fit for writing-primary workflows at the same price point.",
    },
  },
  data: {
    ChatGPT: {
      tool: "Claude",
      plan: "Pro",
      monthlyCost: 20,
      reason: "Claude Pro's 200k context window handles large datasets, CSVs, and long analytical documents without truncation — a material advantage over ChatGPT Plus for data-heavy workflows at the same $20/seat price.",
    },
    Cursor: {
      tool: "Claude",
      plan: "Pro",
      monthlyCost: 20,
      reason: "For data analysis and research (non-coding), Claude Pro ($20/seat) is more appropriate than Cursor, which is built around code editing. You're paying for an IDE you don't need.",
    },
  },
  research: {
    Cursor: {
      tool: "Claude",
      plan: "Pro",
      monthlyCost: 20,
      reason: "Cursor is a code editor with AI features. For research workflows, Claude Pro ($20/seat) offers superior document analysis, citation handling, and long-context reasoning — purpose-built for what you're doing.",
    },
    "GitHub Copilot": {
      tool: "Claude",
      plan: "Pro",
      monthlyCost: 20,
      reason: "GitHub Copilot has no research or document analysis capability. Claude Pro ($20/seat) handles long documents, PDFs, and structured research queries — better tool fit for your use case.",
    },
  },
};

// High-spend threshold where Credex credits become relevant ($200+/mo per tool)
const CREDEX_THRESHOLD = 200;

export function runAudit(
  tools: UserToolInput[],
  teamSize?: number,
  useCase?: string
): AuditRecommendation[] {
  const recommendations: AuditRecommendation[] = [];

  const hasCursor = tools.some(t => t.toolName === "Cursor" && !["Free", "Hobby"].includes(t.currentPlan));
  const hasWindsurf = tools.some(t => t.toolName === "Windsurf" && !["Free"].includes(t.currentPlan));
  const hasClaude = tools.some(t => t.toolName === "Claude");
  const effectiveTeamSize = teamSize ?? Math.max(...tools.map(t => t.seats), 1);
  const effectiveUseCase = useCase ?? "mixed";

  tools.forEach((tool) => {
    const pricing = AI_TOOL_PRICING[tool.toolName];
    if (!pricing) return;

    const currentPlanPricing = pricing[tool.currentPlan];
    const isApiTier = currentPlanPricing?.isApiTier || ["Anthropic API", "OpenAI API"].includes(tool.toolName);

    let optimizedCost = tool.monthlySpend;
    let recommendedPlan = tool.currentPlan;
    let reasoning = "Your current setup appears efficient for your team size and use case.";
    let severity: "low" | "medium" | "high" = "low";
    let credexNote = "";

    // -------------------------------------------------------------------------
    // RULE 1A: Overspend — paying more than plan × seats
    // e.g. Claude Pro = $20/seat. 15 seats = $300/mo. Entering $2497 flags it.
    // -------------------------------------------------------------------------
    if (
      !isApiTier &&
      currentPlanPricing &&
      typeof currentPlanPricing.monthlyCostPerSeat === "number" &&
      currentPlanPricing.monthlyCostPerSeat > 0
    ) {
      const expectedCost = currentPlanPricing.monthlyCostPerSeat * tool.seats;
      const overspendThreshold = expectedCost * 1.15; // 15% buffer for taxes/fees

      if (tool.monthlySpend > overspendThreshold) {
        optimizedCost = expectedCost;
        recommendedPlan = `${tool.currentPlan} (audit billing)`;
        reasoning = `At ${tool.seats} seat${tool.seats > 1 ? "s" : ""}, ${tool.toolName} ${tool.currentPlan} should cost $${expectedCost.toLocaleString()}/mo ($${currentPlanPricing.monthlyCostPerSeat}/seat × ${tool.seats}). Your reported spend of $${tool.monthlySpend.toLocaleString()}/mo is $${(tool.monthlySpend - expectedCost).toLocaleString()} over — likely caused by unused seats, legacy add-ons, or billing errors. Audit your invoice line items immediately.`;
        severity = "high";
      }
    }

    // -------------------------------------------------------------------------
    // RULE 1B: Seat count vs actual team size
    // e.g. 10 seats purchased but team size is 4 — paying for 6 idle licenses
    // -------------------------------------------------------------------------
    if (
      !isApiTier &&
      effectiveTeamSize > 0 &&
      tool.seats > effectiveTeamSize &&
      currentPlanPricing &&
      typeof currentPlanPricing.monthlyCostPerSeat === "number"
    ) {
      const rightsizedCost = currentPlanPricing.monthlyCostPerSeat * effectiveTeamSize;
      if (rightsizedCost < optimizedCost) {
        optimizedCost = rightsizedCost;
        recommendedPlan = `${tool.currentPlan} (${effectiveTeamSize} seats)`;
        const idleSeats = tool.seats - effectiveTeamSize;
        reasoning = `You have ${tool.seats} seats licensed but only ${effectiveTeamSize} people on your team — ${idleSeats} seat${idleSeats > 1 ? "s" : ""} are idle at $${currentPlanPricing.monthlyCostPerSeat}/seat/mo. Reducing to ${effectiveTeamSize} active seats saves $${(tool.monthlySpend - rightsizedCost).toLocaleString()}/mo with zero capability loss.`;
        severity = "high";
      }
    }

    // -------------------------------------------------------------------------
    // RULE 1C: Team plan for tiny teams (≤2 seats)
    // Team tiers add SSO, audit logs, and admin dashboards — irrelevant at 1-2 seats
    // -------------------------------------------------------------------------
    if (
      !isApiTier &&
      ["Team", "Business", "Enterprise", "Teams"].includes(tool.currentPlan) &&
      tool.seats <= 2 &&
      severity !== "high"
    ) {
      const cheaperPlan = pricing["Plus"] || pricing["Pro"] || pricing["Individual"] || pricing["Hobby"];
      if (cheaperPlan && typeof cheaperPlan.monthlyCostPerSeat === "number" && cheaperPlan.monthlyCostPerSeat > 0) {
        const downgradeCost = cheaperPlan.monthlyCostPerSeat * tool.seats;
        if (downgradeCost < optimizedCost) {
          optimizedCost = downgradeCost;
          recommendedPlan = cheaperPlan.name;
          reasoning = `${tool.currentPlan} tier exists for SSO, centralized billing, and admin provisioning — none of which apply to a ${tool.seats}-person team. ${cheaperPlan.name} at $${cheaperPlan.monthlyCostPerSeat}/seat provides identical AI capabilities. Switching saves $${(tool.monthlySpend - downgradeCost).toLocaleString()}/mo with no functional tradeoff.`;
          severity = "high";
        }
      }
    }

    // -------------------------------------------------------------------------
    // RULE 1D: Plan tier vs use case fit
    // e.g. Claude Max ($100/seat) for a writing team that only needs Pro ($20)
    // -------------------------------------------------------------------------
    if (!isApiTier && effectiveUseCase !== "mixed" && severity === "low") {
      // Claude Max is only justified for heavy agentic/API workloads
      if (tool.toolName === "Claude" && tool.currentPlan === "Max") {
        const proPlan = pricing["Pro"];
        if (proPlan && typeof proPlan.monthlyCostPerSeat === "number") {
          const proCost = proPlan.monthlyCostPerSeat * tool.seats;
          if (proCost < optimizedCost && effectiveUseCase !== "coding") {
            optimizedCost = proCost;
            recommendedPlan = "Claude Pro";
            reasoning = `Claude Max ($100/seat) is designed for high-volume agentic coding workflows. For ${effectiveUseCase} use cases, Claude Pro ($20/seat) provides the same model quality with sufficient rate limits — you're paying 5× more for capacity you're unlikely to hit. Downgrading saves $${(tool.monthlySpend - proCost).toLocaleString()}/mo.`;
            severity = "medium";
          }
        }
      }

      // Gemini Ultra ($249/seat) is rarely justified outside of specific enterprise needs
      if (tool.toolName === "Gemini" && tool.currentPlan === "Ultra") {
        const proPlan = pricing["Pro"];
        if (proPlan && typeof proPlan.monthlyCostPerSeat === "number") {
          const proCost = proPlan.monthlyCostPerSeat * tool.seats;
          if (proCost < optimizedCost) {
            optimizedCost = proCost;
            recommendedPlan = "Gemini Pro";
            reasoning = `Gemini Ultra at $249/seat is positioned for enterprise multimodal workloads. For ${effectiveUseCase} use cases, Gemini Advanced/Pro ($20/seat) covers standard text and reasoning tasks. Downgrading saves $${(tool.monthlySpend - proCost).toLocaleString()}/mo — validate whether Ultra-specific features are actually in use before renewing.`;
            severity = "medium";
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // RULE 2: Annual vs monthly billing
    // Switching to annual is a zero-tradeoff cut — same product, lower price
    // -------------------------------------------------------------------------
    if (
      !isApiTier &&
      currentPlanPricing?.annualCostPerSeat &&
      typeof currentPlanPricing.monthlyCostPerSeat === "number" &&
      !tool.annualBilling
    ) {
      const annualCost = currentPlanPricing.annualCostPerSeat * tool.seats;
      if (annualCost < optimizedCost) {
        const savingsPct = Math.round(
          ((currentPlanPricing.monthlyCostPerSeat - currentPlanPricing.annualCostPerSeat) /
            currentPlanPricing.monthlyCostPerSeat) * 100
        );
        if (severity === "low") {
          optimizedCost = annualCost;
          recommendedPlan = `${tool.currentPlan} (Annual)`;
          reasoning = `Switching from monthly to annual billing saves ${savingsPct}% ($${(currentPlanPricing.monthlyCostPerSeat - currentPlanPricing.annualCostPerSeat).toFixed(0)}/seat/mo) with no feature changes. At ${tool.seats} seat${tool.seats > 1 ? "s" : ""}, that's $${(tool.monthlySpend - annualCost).toLocaleString()}/mo or $${((tool.monthlySpend - annualCost) * 12).toLocaleString()}/year — a zero-tradeoff optimization.`;
          severity = "medium";
        } else {
          reasoning += ` Additionally, switching to annual billing saves a further ${savingsPct}% per seat.`;
        }
      }
    }

    // -------------------------------------------------------------------------
    // RULE 3: Redundant tools — GitHub Copilot + Cursor/Windsurf
    // Cursor and Windsurf both include inline completions — Copilot is 100% duplicate
    // -------------------------------------------------------------------------
    if (tool.toolName === "GitHub Copilot" && (hasCursor || hasWindsurf)) {
      optimizedCost = 0;
      recommendedPlan = "Cancel";
      const competitor = hasCursor ? "Cursor" : "Windsurf";
      reasoning = `Your team already pays for ${competitor}, which includes built-in inline code completions, multi-line suggestions, and chat — everything GitHub Copilot provides. Running both is 100% duplicate spend. GitHub Copilot Individual costs $10/seat/mo, Business $19/seat/mo. Canceling saves $${tool.monthlySpend.toLocaleString()}/mo with zero capability loss since ${competitor} already covers this workflow.`;
      severity = "high";
    }

    // -------------------------------------------------------------------------
    // RULE 3B: Alternative tool suggestion by use case
    // Only trigger if there's a cheaper/better-fit tool for the declared use case
    // -------------------------------------------------------------------------
    const altSuggestion = USE_CASE_ALTERNATIVES[effectiveUseCase]?.[tool.toolName];
    if (altSuggestion && severity === "low" && altSuggestion.monthlyCost * tool.seats < tool.monthlySpend) {
      // Don't suggest Claude if they already have it
      if (!(altSuggestion.tool === "Claude" && hasClaude)) {
        const altTotalCost = altSuggestion.monthlyCost * tool.seats;
        optimizedCost = altTotalCost;
        recommendedPlan = `Switch to ${altSuggestion.tool} ${altSuggestion.plan}`;
        reasoning = altSuggestion.reason;
        severity = "medium";
      }
    }

    // -------------------------------------------------------------------------
    // RULE 4: Credex credits — flag high-spend tools where credits save more
    // Credex sources discounted enterprise credits — relevant at $200+/mo
    // -------------------------------------------------------------------------
    if (tool.monthlySpend >= CREDEX_THRESHOLD) {
      const annualSpend = tool.monthlySpend * 12;
      credexNote = `At $${tool.monthlySpend.toLocaleString()}/mo ($${annualSpend.toLocaleString()}/yr), this line item qualifies for Credex infrastructure credits — discounted ${tool.toolName} licenses sourced from companies that overforecast. Credits typically save 20–40% on top of any plan optimizations above.`;
    }

    // Combine credex note into reasoning if applicable
    if (credexNote) {
      reasoning = reasoning + (reasoning.endsWith(".") ? " " : ". ") + credexNote;
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
