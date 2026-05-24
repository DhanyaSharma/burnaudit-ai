export interface PlanDetails {
  name: string;
  monthlyCostPerSeat: number | null;
  annualCostPerSeat?: number | null;
  isTeamTier: boolean;
  isApiTier?: boolean;
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
      name: "Team",
      monthlyCostPerSeat: 30,
      annualCostPerSeat: 25,
      isTeamTier: true,
      supportsCentralBilling: true,
    },
    Enterprise: {
      name: "Enterprise",
      monthlyCostPerSeat: 150,
      isTeamTier: true,
      supportsCentralBilling: true,
      supportsSSO: true,
      notes: "Expanded context windows and governance",
    },
    "API Direct": {
      name: "API Direct",
      monthlyCostPerSeat: null,
      isTeamTier: false,
      isApiTier: true,
      notes: "Pay per token — claude-sonnet-4: $3/M input, $15/M output",
    },
  },

  ChatGPT: {
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
    "API Direct": {
      name: "API Direct",
      monthlyCostPerSeat: null,
      isTeamTier: false,
      isApiTier: true,
      notes: "Pay per token — gpt-4o: $2.5/M input, $10/M output",
    },
  },

  "Anthropic API": {
    "API Direct": {
      name: "API Direct",
      monthlyCostPerSeat: null,
      isTeamTier: false,
      isApiTier: true,
      notes: "claude-sonnet-4: $3/M input, $15/M output. claude-haiku-4: $0.8/M input, $4/M output",
    },
  },

  "OpenAI API": {
    "API Direct": {
      name: "API Direct",
      monthlyCostPerSeat: null,
      isTeamTier: false,
      isApiTier: true,
      notes: "gpt-4o: $2.5/M input, $10/M output. gpt-4o-mini: $0.15/M input, $0.6/M output",
    },
  },

  Gemini: {
    Pro: {
      name: "Gemini Advanced / Pro",
      monthlyCostPerSeat: 20,
      isTeamTier: false,
      notes: "Google One AI Premium",
    },
    Ultra: {
      name: "Gemini Ultra",
      monthlyCostPerSeat: 249,
      isTeamTier: false,
      notes: "Highest capability tier",
    },
    API: {
      name: "API (Pay-as-you-go)",
      monthlyCostPerSeat: null,
      isTeamTier: false,
      isApiTier: true,
      notes: "gemini-2.0-flash: $0.10/M input, $0.40/M output",
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
      monthlyCostPerSeat: 15,
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

export const PRICING_METADATA = {
  verifiedAt: "2026-05-24",
  sources: {
    cursor: "https://cursor.sh/pricing",
    githubCopilot: "https://github.com/features/copilot#pricing",
    anthropic: "https://www.anthropic.com/pricing",
    anthropicApi: "https://www.anthropic.com/api",
    openai: "https://openai.com/chatgpt/pricing",
    openaiApi: "https://openai.com/api/pricing",
    gemini: "https://gemini.google.com/advanced",
    geminiApi: "https://ai.google.dev/pricing",
    windsurf: "https://windsurf.com/pricing",
  },
};