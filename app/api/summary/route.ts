import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { AuditRecommendation } from "@/types/audit";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function POST(request: Request) {
  // Parse body ONCE upfront so it's available in both try and catch
  let totalMonthlySavings = 0;
  let totalAnnualSavings = 0;
  let recommendations: AuditRecommendation[] = [];

  try {
    const body = await request.json();
    totalMonthlySavings = body.totalMonthlySavings ?? 0;
    totalAnnualSavings = body.totalAnnualSavings ?? 0;
    recommendations = body.recommendations ?? [];
  } catch {
    return NextResponse.json({
      summary: generateFallbackSummary(0, 0),
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn("Missing GEMINI_API_KEY — using fallback.");
    return NextResponse.json({
      summary: generateFallbackSummary(totalMonthlySavings, totalAnnualSavings),
    });
  }

  try {
    const formattedRecommendations = recommendations
      .map(
        (r: AuditRecommendation) =>
          `- ${r.toolName} (${r.currentPlan}): $${r.currentMonthlyCost}/mo → ${r.recommendedPlan}, saves $${r.monthlySavings}/mo. ${r.reasoning}`
      )
      .join("\n");

    const prompt = `You are a direct, numbers-driven CFO reviewing an AI tool spend audit.

Audit data:
- Total monthly savings identified: $${totalMonthlySavings}
- Projected annual savings: $${totalAnnualSavings}
- Line items:
${formattedRecommendations}

Write a complete executive summary. Rules:
1. Start directly with the key finding — no greeting, no "Founder," prefix.
2. Name specific tools and dollar amounts from the audit data above.
3. End with one clear action the founder should take this week.
4. Be blunt and specific. No filler words.
5. Write exactly 80-100 words. Complete every sentence — do not stop mid-thought.
6. Plain text only. No markdown, no bullet points, no headings.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.5,
        maxOutputTokens: 400,
      },
    });

    const summaryText = (response.text || "").trim();

    if (summaryText.length < 50) {
      console.warn("Gemini response too short, using fallback. Got:", summaryText);
      return NextResponse.json({
        summary: generateFallbackSummary(totalMonthlySavings, totalAnnualSavings),
      });
    }

    return NextResponse.json({ summary: summaryText });

  } catch (error) {
    console.warn("Gemini API error — using fallback:", error);
    return NextResponse.json({
      summary: generateFallbackSummary(totalMonthlySavings, totalAnnualSavings),
    });
  }
}

function generateFallbackSummary(monthly: number, annual: number): string {
  if (monthly === 0) {
    return "Your AI tool stack is well-optimized. Current plan selections match your team size and usage patterns with no immediate consolidation required. Monitor seat utilization quarterly as your team scales.";
  }
  return `This audit identifies $${monthly.toLocaleString()}/month in recoverable AI tool spend — $${annual.toLocaleString()} annualized. The primary drivers are billing mismatches between reported spend and expected plan costs, team-tier plans for undersized teams, and monthly billing where annual contracts apply. Immediate action: audit your billing statements against actual seat counts, cancel redundant tools, and switch to annual billing. These are zero-tradeoff cuts that require one afternoon to execute.`;
}