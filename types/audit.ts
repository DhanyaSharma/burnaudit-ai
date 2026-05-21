export interface UserToolInput {
  toolName: string;
  currentPlan: string;
  seats: number;
  monthlySpend: number;
  annualBilling?: boolean;
}

export interface AuditRecommendation {
  toolName: string;
  currentPlan: string;
  recommendedPlan: string;
  currentMonthlyCost: number;
  optimizedMonthlyCost: number;
  monthlySavings: number;
  annualSavings: number;
  reasoning: string;
  severity: "low" | "medium" | "high";
}