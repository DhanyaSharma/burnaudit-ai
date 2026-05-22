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

    const { data, error } =
      await supabase
        .from("audits")
        .insert([
          {
            stack,
            recommendations,
            ai_summary: aiSummary,
            total_monthly_savings:
              totalMonthlySavings,
            total_annual_savings:
              totalAnnualSavings,
          },
        ])
        .select()
        .single();

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error: "Failed to save audit",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      auditId: data.id,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Unexpected server error",
      },
      {
        status: 500,
      }
    );
  }
}