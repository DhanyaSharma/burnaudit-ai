import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Basic rate limiting — in-memory store (resets on server restart)
// For production, use Redis or Upstash. Documented in ARCHITECTURE.md.
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;          // max 5 audits per window
const RATE_WINDOW_MS = 60_000; // per 60 seconds per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT) return true;

  entry.count++;
  return false;
}

export async function POST(req: Request) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute before submitting again." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();

    const {
      stack,
      recommendations,
      aiSummary,
      totalMonthlySavings,
      totalAnnualSavings,
      teamSize,
      useCase,
      // Lead capture fields
      email,
      companyName,
      role,
      notifyEmail,
      // Honeypot field — bots fill this, humans don't
      website,
    } = body;

    // ── Honeypot check ───────────────────────────────────────────────────────
    // The "website" field is hidden from real users via CSS (aria-hidden, opacity-0).
    // Bots that auto-fill forms will populate it. If it has a value, reject silently.
    if (website) {
      // Return fake success so bots don't know they were caught
      return NextResponse.json({ success: true, auditId: "bot-detected" });
    }

    // ── Save to Supabase ─────────────────────────────────────────────────────
    const { data, error } = await supabase
      .from("audits")
      .insert([
        {
          stack,
          recommendations,
          ai_summary: aiSummary,
          total_monthly_savings: totalMonthlySavings,
          total_annual_savings: totalAnnualSavings,
          team_size: teamSize,
          use_case: useCase,
          // Lead fields — stored but stripped from public URL
          email: email || notifyEmail || null,
          company_name: companyName || null,
          role: role || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.warn("Supabase insert failed:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { error: "Failed to save audit", detail: error.message },
        { status: 500 }
      );
    }

    // ── Send confirmation email if email was provided ─────────────────────────
    if ((email || notifyEmail) && process.env.RESEND_API_KEY) {
      const recipientEmail = email || notifyEmail;
      const isHighSavings = totalMonthlySavings >= 500;

      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "BurnAudit AI <audit@burnaudit.ai>",
            to: [recipientEmail],
            subject: `Your AI spend audit — $${totalMonthlySavings.toLocaleString()}/mo in savings identified`,
            html: generateEmailHtml({
              totalMonthlySavings,
              totalAnnualSavings,
              auditId: data.id,
              isHighSavings,
              companyName,
            }),
          }),
        });
      } catch (emailErr) {
        // Email failure is non-blocking — audit still saved successfully
        console.warn("Email send failed (non-blocking):", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      auditId: data.id,
    });

  } catch (error) {
    console.warn("Unexpected error in /api/save-audit:", error);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Transactional email HTML
// ---------------------------------------------------------------------------
function generateEmailHtml({
  totalMonthlySavings,
  totalAnnualSavings,
  auditId,
  isHighSavings,
  companyName,
}: {
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  auditId: string;
  isHighSavings: boolean;
  companyName?: string;
}): string {
  const auditUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://burnaudit.ai"}/audit/${auditId}`;
  const greeting = companyName ? `Hi ${companyName} team,` : "Hi there,";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, sans-serif; background: #0a0a0a; color: #ffffff; padding: 40px 20px; max-width: 600px; margin: 0 auto;">
  <div style="margin-bottom: 32px;">
    <span style="font-size: 14px; font-weight: 900; letter-spacing: -0.5px;">BURNAUDIT<span style="color: #666;">.AI</span></span>
  </div>

  <h1 style="font-size: 28px; font-weight: 900; margin-bottom: 8px; color: #ffffff;">
    Your audit is ready.
  </h1>
  <p style="color: #888; margin-bottom: 32px;">${greeting}</p>

  <div style="background: #111; border: 1px solid #222; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
    <div style="display: flex; gap: 32px; flex-wrap: wrap;">
      <div>
        <p style="color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px;">Monthly savings</p>
        <p style="font-size: 36px; font-weight: 900; color: #ffffff; margin: 0;">$${totalMonthlySavings.toLocaleString()}</p>
      </div>
      <div>
        <p style="color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px;">Annual savings</p>
        <p style="font-size: 36px; font-weight: 900; color: #4ade80; margin: 0;">$${totalAnnualSavings.toLocaleString()}</p>
      </div>
    </div>
  </div>

  <a href="${auditUrl}" style="display: block; background: #ffffff; color: #000000; text-align: center; padding: 14px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none; margin-bottom: 24px;">
    View Full Audit Report →
  </a>

  ${isHighSavings ? `
  <div style="background: rgba(74,222,128,0.06); border: 1px solid rgba(74,222,128,0.2); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
    <p style="color: #4ade80; font-weight: 700; font-size: 13px; margin: 0 0 8px;">Credex will reach out within 24 hours</p>
    <p style="color: #888; font-size: 13px; margin: 0;">
      Your audit shows $${totalMonthlySavings.toLocaleString()}/mo in savings — this qualifies for Credex infrastructure credits.
      We source discounted AI licenses from companies that overforecast. Expect a short message from the Credex team shortly.
    </p>
  </div>
  ` : ""}

  <p style="color: #444; font-size: 12px;">
    You're receiving this because you ran an audit at burnaudit.ai.
    Your shareable audit URL: <a href="${auditUrl}" style="color: #666;">${auditUrl}</a>
  </p>
</body>
</html>`;
}