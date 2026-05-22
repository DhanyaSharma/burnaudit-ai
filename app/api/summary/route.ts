import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { totalMonthlySavings, totalAnnualSavings, recommendations } = body;

    // Defensive check: If key is missing, instantly use local fallback
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Missing GEMINI_API_KEY. Using structural fallback.");
      return NextResponse.json({ summary: generateFallbackSummary(totalMonthlySavings, totalAnnualSavings) });
    }

    const formattedRecommendations = recommendations
      .map((r: any) => `- ${r.toolName}: Current Cost $${r.currentMonthlyCost}/mo -> Recommended Plan: ${r.recommendedPlan} (Savings: $${r.monthlySavings}/mo). Reasoning: ${r.reasoning}`)
      .join("\n");

    const prompt = `You are an elite, cynical B2B SaaS CFO and efficiency expert. Analyze this company's AI tool stack spend audit metrics:
- Total Monthly Waste: $${totalMonthlySavings}
- Projected Annual Savings: $${totalAnnualSavings}
- Line Items:
${formattedRecommendations}

Write a brutal, direct, and action-oriented strategic executive summary for the company founder. 
Strict Guidelines:
1. Explain exactly where the fat is (e.g., duplicate autocomplete seats, paying team premiums for standalone developers, or monthly billing inertia).
2. Do not use corporate fluff or filler words. Be precise and clear.
3. Keep the total length strictly around 100 words.
4. Output your response in clean plain text with no headings or markdown structures.`;

    // Call Gemini 2.5 Flash using the modern 2026 SDK structure
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const summaryText = response.text || "";

    return NextResponse.json({ summary: summaryText });

  } catch (error) {
    console.error("Gemini Route Error, initiating local fallback:", error);
    const fallbackBody = await request.clone().json().catch(() => ({ totalMonthlySavings: 0, totalAnnualSavings: 0 }));
    return NextResponse.json({ 
      summary: generateFallbackSummary(fallbackBody.totalMonthlySavings, fallbackBody.totalAnnualSavings) 
    });
  }
}

function generateFallbackSummary(monthly: number, annual: number): string {
  if (monthly === 0) {
    return "Your AI workspace footprint is highly optimized. Current configurations match modern efficiency guidelines with no immediate software layer consolidation required.";
  }
  return `Your software stack shows significant tooling overlaps representing $${monthly.toLocaleString()}/month in direct capital leakage. Prioritize cutting redundant IDE extensions and consolidating small team administrator permissions immediately. Transitioning remaining unoptimized standalone seats to standard annualized cycles will secure your projected $${annual.toLocaleString()} in immediate annual runway recovery.`;
}