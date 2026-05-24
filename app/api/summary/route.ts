import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { AuditRecommendation } from "@/types/audit";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function POST(request: Request) {
  let totalMonthlySavings = 0;
  let totalAnnualSavings = 0;
  let recommendations: AuditRecommendation[] = [];
  let useCase = "mixed";
  let teamSize = 1;

  try {
    const body = await request.json();
    totalMonthlySavings = body.totalMonthlySavings ?? 0;
    totalAnnualSavings = body.totalAnnualSavings ?? 0;
    recommendations = body.recommendations ?? [];
    useCase = body.useCase ?? "mixed";
    teamSize = body.teamSize ?? 1;
  } catch {
    return NextResponse.json({
      summary: generateFallbackSummary(totalMonthlySavings, totalAnnualSavings, useCase, teamSize),
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn("Missing GEMINI_API_KEY — using fallback.");
    return NextResponse.json({
      summary: generateFallbackSummary(totalMonthlySavings, totalAnnualSavings, useCase, teamSize),
    });
  }

  try {
    const highSeverityTools = recommendations
      .filter((r) => r.severity === "high")
      .map((r) => r.toolName);

    const lineItems = recommendations
      .map((r) => `- ${r.toolName} (${r.currentPlan}): paying $${r.currentMonthlyCost}/mo, action: "${r.recommendedPlan}", saves $${r.monthlySavings}/mo`)
      .join("\n");

    const prompt = `You are a no-nonsense CFO advisor writing a personalized audit summary for a ${teamSize}-person team whose primary AI use case is ${useCase}.

Audit results:
- Total monthly savings identified: $${totalMonthlySavings}
- Projected annual savings: $${totalAnnualSavings}
- High-priority issues: ${highSeverityTools.length > 0 ? highSeverityTools.join(", ") : "none"}
- Line items:
${lineItems}

Write a single paragraph, exactly 90-110 words, addressed directly to this team. Rules:
1. Open with the most impactful specific finding (name the tool and dollar amount).
2. Reference their use case (${useCase}) and team size (${teamSize} people) naturally as context.
3. Name the one action they should take this week.
4. If savings are $0, be honest — tell them their stack is well-configured and what to watch for.
5. No greeting. No sign-off. No markdown. Plain prose only.
6. Do not manufacture savings. Every claim must match the audit data above.
7. Complete every sentence — do not trail off or stop mid-thought.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        temperature: 0.5,
        maxOutputTokens: 400,
      },
    });

    const summaryText = (response.text || "").trim();

    if (summaryText.length < 50) {
      console.warn("Gemini response too short, using fallback.");
      return NextResponse.json({
        summary: generateFallbackSummary(totalMonthlySavings, totalAnnualSavings, useCase, teamSize),
      });
    }

    return NextResponse.json({ summary: summaryText });

  } catch (error: any) {
    console.warn("Gemini API error — using fallback:", error?.message ?? error);
    return NextResponse.json({
      summary: generateFallbackSummary(totalMonthlySavings, totalAnnualSavings, useCase, teamSize),
    });
  }
}

function generateFallbackSummary(monthly: number, annual: number, useCase: string, teamSize: number): string {
  if (monthly === 0) {
    return `Your ${teamSize}-person ${useCase} team's AI stack is well-configured. Current plan selections match your team size and usage patterns — no redundant tools, no billing inefficiencies detected. Pricing does change; the most common surprise is vendors quietly moving features to higher tiers at renewal. Check your invoices against current published pricing each quarter and re-run this audit when you add or remove tools.`;
  }
  return `This audit identifies $${monthly.toLocaleString()}/month in recoverable spend across your ${teamSize}-person ${useCase} team — $${annual.toLocaleString()} annualized. The primary drivers are seat counts exceeding actual headcount, team-tier plans with admin overhead your team doesn't use, and monthly billing where annual contracts apply. Immediate action: audit your billing statements against active headcount, cancel redundant tools flagged above, and switch to annual billing. These are zero-tradeoff cuts that require one afternoon to execute.`;
}