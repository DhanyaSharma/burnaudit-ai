import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

// ---------------------------------------------------------------------------
// Open Graph + Twitter Card metadata — required for clean link previews
// Identifying details (email, company) stripped — only tools + savings shown
// ---------------------------------------------------------------------------
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;

  const { data: audit } = await supabase
    .from("audits")
    .select("total_monthly_savings, total_annual_savings, use_case, team_size")
    .eq("id", id)
    .single();

  if (!audit) {
    return {
      title: "Audit Not Found — BurnAudit AI",
    };
  }

  const title = `$${audit.total_monthly_savings?.toLocaleString() ?? 0}/mo in AI savings identified`;
  const description = `This ${audit.team_size}-person ${audit.use_case ?? "team"}'s AI stack audit found $${audit.total_monthly_savings?.toLocaleString() ?? 0}/month ($${audit.total_annual_savings?.toLocaleString() ?? 0}/yr) in recoverable spend. Run your free audit at BurnAudit AI.`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://burnaudit.ai";

  return {
    title: `${title} — BurnAudit AI`,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/audit/${id}`,
      siteName: "BurnAudit AI",
      type: "website",
      images: [
        {
          url: `${siteUrl}/api/og?monthly=${audit.total_monthly_savings}&annual=${audit.total_annual_savings}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${siteUrl}/api/og?monthly=${audit.total_monthly_savings}&annual=${audit.total_annual_savings}`],
    },
  };
}

export default async function AuditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch audit — intentionally exclude email, company_name, role from select
  // These identifying fields are never exposed on the public URL
  const { data: audit, error } = await supabase
    .from("audits")
    .select("id, stack, recommendations, ai_summary, total_monthly_savings, total_annual_savings, team_size, use_case, created_at")
    .eq("id", id)
    .single();

  if (error || !audit) notFound();

  const recommendations = audit.recommendations ?? [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://burnaudit.ai";
  const shareUrl = `${siteUrl}/audit/${id}`;

  return (
    <div className="min-h-screen bg-[#080808] text-white">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#080808]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-white flex items-center justify-center">
              <div className="h-3 w-3 rounded-sm bg-black" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">
              BURNAUDIT<span className="text-white/30">.AI</span>
            </span>
          </Link>
          <Link href="/"
            className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-black hover:bg-white/90 transition-all">
            Run My Audit →
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 pb-24 pt-28">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Shared Audit Report</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            AI Stack Optimization Report
          </h1>
          <div className="flex flex-wrap gap-4 text-xs text-white/30">
            {audit.team_size && <span>{audit.team_size}-person team</span>}
            {audit.use_case && <span className="capitalize">{audit.use_case} use case</span>}
            {audit.created_at && (
              <span>{new Date(audit.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            )}
          </div>
        </div>

        {/* Savings hero */}
        <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-8 relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-6">Stack Optimization Summary</p>
            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <p className="text-xs text-white/40 mb-2">Monthly savings identified</p>
                <p className="text-7xl font-black text-white tracking-tighter leading-none">
                  ${audit.total_monthly_savings?.toLocaleString() ?? 0}
                </p>
                <p className="text-xs text-white/25 mt-2">per month</p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-2">Annual runway recovered</p>
                <p className="text-7xl font-black text-green-400 tracking-tighter leading-none">
                  ${audit.total_annual_savings?.toLocaleString() ?? 0}
                </p>
                <p className="text-xs text-white/25 mt-2">per year</p>
              </div>
            </div>

            {(audit.total_monthly_savings ?? 0) >= 500 && (
              <div className="mt-6 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-white mb-1">Capture more savings with Credex</p>
                  <p className="text-xs text-white/40 max-w-sm">
                    Discounted AI infrastructure credits sourced from companies that overforecast. 20–40% below retail on Claude, Cursor, ChatGPT Enterprise.
                  </p>
                </div>
                <button className="shrink-0 rounded-xl bg-white text-black px-5 py-2.5 text-xs font-bold hover:bg-white/90 transition-all whitespace-nowrap">
                  Book Free Consultation →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* AI Summary */}
        {audit.ai_summary && (
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">AI Executive Analysis</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">{audit.ai_summary}</p>
          </div>
        )}

        {/* Line items */}
        {recommendations.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4">Line-item breakdown</h3>
            <div className="space-y-3">
              {recommendations.map((result: any, index: number) => (
                <div key={index} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-white">{result.toolName}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        result.severity === "high" ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : result.severity === "medium" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        : "bg-white/[0.06] text-white/30 border border-white/10"
                      }`}>{result.severity}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-white/25 line-through">${result.currentMonthlyCost}/mo</span>
                      <span className="text-white/20 mx-1">→</span>
                      <span className="text-sm font-black text-green-400">${result.optimizedMonthlyCost}/mo</span>
                    </div>
                  </div>
                  <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <p className="text-xs text-white/40 leading-relaxed max-w-xl flex-1">{result.reasoning}</p>
                    <div className="shrink-0 flex flex-col items-end gap-1 md:min-w-[140px]">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">Action</p>
                      <p className="text-xs font-semibold text-white/70 text-right">{result.recommendedPlan}</p>
                      <div className="mt-2 rounded-xl bg-green-500/10 border border-green-500/20 px-3 py-1.5 text-center">
                        <p className="text-lg font-black text-green-400 leading-tight">${result.monthlySavings}<span className="text-xs font-medium">/mo</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share + CTA */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-2">Share this report</p>
            <p className="text-xs font-mono text-white/40 break-all mb-3">{shareUrl}</p>
            <button
              onClick={() => navigator.clipboard.writeText(shareUrl)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 text-xs font-bold text-white/60 hover:bg-white/[0.08] hover:text-white transition-all"
            >
              Copy Link
            </button>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-2">Run your own audit</p>
              <p className="text-xs text-white/40 mb-3">Free, instant, no login required.</p>
            </div>
            <Link href="/"
              className="block w-full text-center rounded-xl bg-white text-black py-2.5 text-xs font-bold hover:bg-white/90 transition-all">
              Audit My Stack →
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
