export interface PlanDetails {
  name: string;
  monthlyCostPerSeat: number | null;
  annualCostPerSeat?: number | null;
  isTeamTier: boolean;
  supportsSSO?: boolean;
  supportsCentralBilling?: boolean;
  notes?: string;
}

export interface ToolPricingStructure {
  [planName: string]: PlanDetails;
}

export interface MarketPricingData {
  [toolName: string]: ToolPricingStructure;
}

export const AI_TOOL_PRICING: MarketPricingData = {
  Cursor: {
    Hobby: {
      name: "Hobby",
      monthlyCostPerSeat: 0,
      isTeamTier: false,
      notes: "Free personal tier",
    },

    Pro: {
      name: "Pro",
      monthlyCostPerSeat: 20,
      annualCostPerSeat: 16,
      isTeamTier: false,
      notes: "Best for solo developers",
    },

    "Pro+": {
      name: "Pro+",
      monthlyCostPerSeat: 60,
      isTeamTier: false,
      notes: "Higher credit allocations",
    },

    Ultra: {
      name: "Ultra",
      monthlyCostPerSeat: 200,
      isTeamTier: false,
      notes: "Heavy AI generation workloads",
    },

    Business: {
      name: "Business",
      monthlyCostPerSeat: 40,
      isTeamTier: true,
      supportsSSO: true,
      supportsCentralBilling: true,
      notes: "Collaboration and admin controls",
    },

    Enterprise: {
      name: "Enterprise",
      monthlyCostPerSeat: 100,
      isTeamTier: true,
      supportsSSO: true,
      supportsCentralBilling: true,
      notes: "Estimated baseline enterprise contract",
    },
  },

  "GitHub Copilot": {
    Individual: {
      name: "Individual",
      monthlyCostPerSeat: 10,
      isTeamTier: false,
    },

    Pro: {
      name: "Pro",
      monthlyCostPerSeat: 10,
      isTeamTier: false,
      notes: "Token allocation pricing changes in 2026",
    },

    "Pro+": {
      name: "Pro+",
      monthlyCostPerSeat: 39,
      isTeamTier: false,
    },

    Business: {
      name: "Business",
      monthlyCostPerSeat: 19,
      isTeamTier: true,
      supportsCentralBilling: true,
    },

    Enterprise: {
      name: "Enterprise",
      monthlyCostPerSeat: 39,
      isTeamTier: true,
      supportsCentralBilling: true,
      supportsSSO: true,
    },
  },

  Claude: {
    Free: {
      name: "Free",
      monthlyCostPerSeat: 0,
      isTeamTier: false,
    },

    Pro: {
      name: "Pro",
      monthlyCostPerSeat: 20,
      isTeamTier: false,
      notes: "Includes Claude Code CLI access",
    },

    Max: {
      name: "Max",
      monthlyCostPerSeat: 100,
      isTeamTier: false,
      notes: "High agentic runtime usage",
    },

    Team: {
      name: "Team Standard",
      monthlyCostPerSeat: 30,
      annualCostPerSeat: 25,
      isTeamTier: true,
      supportsCentralBilling: true,
    },

    Enterprise: {
      name: "Enterprise Premium",
      monthlyCostPerSeat: 150,
      isTeamTier: true,
      supportsCentralBilling: true,
      supportsSSO: true,
      notes: "Expanded context windows and governance",
    },
  },

  ChatGPT: {
    Go: {
      name: "Go",
      monthlyCostPerSeat: 8,
      isTeamTier: false,
      notes: "Budget access tier",
    },

    Plus: {
      name: "Plus",
      monthlyCostPerSeat: 20,
      isTeamTier: false,
    },

    Team: {
      name: "Team",
      monthlyCostPerSeat: 30,
      annualCostPerSeat: 25,
      isTeamTier: true,
      supportsCentralBilling: true,
    },

    Enterprise: {
      name: "Enterprise",
      monthlyCostPerSeat: 60,
      isTeamTier: true,
      supportsCentralBilling: true,
      supportsSSO: true,
      notes: "Estimated enterprise contract baseline",
    },
  },

  Gemini: {
    Free: {
      name: "Free",
      monthlyCostPerSeat: 0,
      isTeamTier: false,
    },

    Pro: {
      name: "Advanced / Pro",
      monthlyCostPerSeat: 20,
      isTeamTier: false,
    },

    Business: {
      name: "Workspace Business",
      monthlyCostPerSeat: 24,
      isTeamTier: true,
      supportsCentralBilling: true,
    },

    Enterprise: {
      name: "Workspace Enterprise",
      monthlyCostPerSeat: 36,
      isTeamTier: true,
      supportsCentralBilling: true,
      supportsSSO: true,
    },
  },

  v0: {
    Free: {
      name: "Free",
      monthlyCostPerSeat: 0,
      isTeamTier: false,
    },

    Premium: {
      name: "Premium",
      monthlyCostPerSeat: 20,
      isTeamTier: false,
    },

    Team: {
      name: "Team",
      monthlyCostPerSeat: 30,
      isTeamTier: true,
      supportsCentralBilling: true,
    },

    Business: {
      name: "Business",
      monthlyCostPerSeat: 100,
      isTeamTier: true,
      supportsCentralBilling: true,
      supportsSSO: true,
      notes: "Dedicated isolated infrastructure",
    },
  },

  Windsurf: {
    Free: {
      name: "Free",
      monthlyCostPerSeat: 0,
      isTeamTier: false,
    },

    Pro: {
      name: "Pro",
      monthlyCostPerSeat: 20,
      isTeamTier: false,
    },

    Teams: {
      name: "Teams",
      monthlyCostPerSeat: 40,
      isTeamTier: true,
      supportsCentralBilling: true,
    },
  },
};

export const API_TOKEN_PRICING = {
  anthropic: {
    "claude-sonnet-4.6": {
      input: 3.0,
      output: 15.0,
    },

    "claude-opus-4.6": {
      input: 5.0,
      output: 25.0,
    },

    "claude-haiku-4.5": {
      input: 1.0,
      output: 5.0,
    },
  },

  openai: {
    "gpt-4o": {
      input: 2.5,
      output: 10.0,
    },

    "o1-mini": {
      input: 3.0,
      output: 12.0,
    },
  },
};

export const PRICING_METADATA = {
  verifiedAt: "2026-05-21",

  sources: {
    cursor: "https://cursor.sh/pricing",

    githubCopilot: "https://github.com/pricing",

    anthropic: "https://www.anthropic.com/claude/team",

    openai: "https://openai.com/chatgpt/pricing",
  },
};