import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      stack,
      recommendations,
      aiSummary,
      totalMonthlySavings,
      totalAnnualSavings,
    } = body;

    const { data, error } = await supabase
      .from("audits")
      .insert([
        {
          stack,
          recommendations,
          ai_summary: aiSummary,
          total_monthly_savings: totalMonthlySavings,
          total_annual_savings: totalAnnualSavings,
        },
      ])
      .select()
      .single();

    if (error) {
      // Use console.warn instead of console.error to avoid Next.js dev overlay
      // The full Supabase error details help you diagnose the root cause
      console.warn("Supabase insert failed:", {
        message: error.message,
        code: error.code,       // e.g. "42703" = unknown column, "23505" = unique violation
        details: error.details, // e.g. missing column name
        hint: error.hint,       // Supabase often gives a fix hint here
      });

      return NextResponse.json(
        { error: "Failed to save audit", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      auditId: data.id,
    });

  } catch (err) {
    // Use console.warn here too — avoids the Next.js dev overlay for unexpected errors
    console.warn("Unexpected error in /api/save-audit:", err);

    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}