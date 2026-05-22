import { expect, test, describe } from "vitest";
import { runAudit } from "./audit-engine";
import { AI_TOOL_PRICING } from "@/data/pricing";
import { UserToolInput } from "@/types/audit";

describe("BurnAudit-AI Mathematical Logic Engine Suite", () => {
  
  // Test Case 1: Redundant Autocomplete Stacking
  test("should completely cut GitHub Copilot expenses if Cursor is active in the stack", () => {
    const mockStack: UserToolInput[] = [
      { toolName: "Cursor", currentPlan: "Pro", seats: 1, monthlySpend: 20, annualBilling: false },
      { toolName: "GitHub Copilot", currentPlan: "Business", seats: 1, monthlySpend: 19, annualBilling: false }
    ];

    const results = runAudit(mockStack);
    const copilotRecommendation = results.find(r => r.toolName === "GitHub Copilot");

    expect(copilotRecommendation).toBeDefined();
    expect(copilotRecommendation?.optimizedMonthlyCost).toBe(0);
    expect(copilotRecommendation?.monthlySavings).toBe(19);
    expect(copilotRecommendation?.severity).toBe("high");
  });

  // Test Case 2: Administrative Overkill Catch (Seats <= 2)
  test("should recommend individual plan downgrades for team plans with 2 or fewer seats", () => {
    // Dynamic price lookup to match your exact pricing dictionary structures
    const chatGptPricing = AI_TOOL_PRICING["ChatGPT"];
    const teamCostPerSeat = chatGptPricing?.["Team"]?.monthlyCostPerSeat ?? 30;
    const plusCostPerSeat = chatGptPricing?.["Plus"]?.monthlyCostPerSeat ?? 20;

    const mockStack: UserToolInput[] = [
      { 
        toolName: "ChatGPT", 
        currentPlan: "Team", 
        seats: 2, 
        monthlySpend: teamCostPerSeat * 2, 
        annualBilling: false 
      }
    ];

    const results = runAudit(mockStack);
    const chatGptRec = results.find(r => r.toolName === "ChatGPT");

    expect(chatGptRec).toBeDefined();
    expect(chatGptRec?.optimizedMonthlyCost).toBe(plusCostPerSeat * 2);
    expect(chatGptRec?.monthlySavings).toBe((teamCostPerSeat * 2) - (plusCostPerSeat * 2));
    expect(chatGptRec?.severity).toBe("high");
  });
  
  // Test Case 3: Annualized Billing Optimization Check
  test("should recommend annual billing compression if user is on monthly cycles", () => {
    // 1. Force patch the pricing dictionary with all mandatory fields required by PlanDetails
    AI_TOOL_PRICING["Claude"] = AI_TOOL_PRICING["Claude"] || {};
    AI_TOOL_PRICING["Claude"]["Pro"] = {
      name: "Pro",
      monthlyCostPerSeat: 20,
      annualCostPerSeat: 16, // Strictly lower to trigger optimization path
      isTeamTier: false      // Resolves TS2741 type-safety error
    };

    const mockStack: UserToolInput[] = [
      { 
        toolName: "Claude", 
        currentPlan: "Pro", 
        seats: 1, 
        monthlySpend: 20, 
        annualBilling: false 
      }
    ];

    const results = runAudit(mockStack);
    const claudeRec = results.find(r => r.toolName === "Claude");

    expect(claudeRec).toBeDefined();
    // Use .toLowerCase() to match text safely regardless of string layout mutations
    expect(claudeRec?.reasoning.toLowerCase()).toContain("annual billing");
    expect(claudeRec?.severity).toBe("medium");
  });


  // Test Case 4: Complete Safety Net For Correct/Efficient Stacks
  test("should generate zero savings metrics if the user stack is already optimized", () => {
    const mockStack: UserToolInput[] = [
      { toolName: "Cursor", currentPlan: "Hobby", seats: 1, monthlySpend: 0, annualBilling: true }
    ];

    const results = runAudit(mockStack);
    const cursorRec = results.find(r => r.toolName === "Cursor");

    expect(cursorRec?.monthlySavings).toBe(0);
    expect(cursorRec?.severity).toBe("low");
  });

  // Test Case 5: Cumulative Aggregation Calculation Mapping
  test("should process and return mapping configurations matching input structures accurately", () => {
    const mockStack: UserToolInput[] = [
      { toolName: "Gemini", currentPlan: "Pro", seats: 5, monthlySpend: 100, annualBilling: true }
    ];

    const results = runAudit(mockStack);
    expect(results.length).toBe(1);
    expect(results[0].toolName).toBe("Gemini");
  });
});