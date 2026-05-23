import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AuditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: audit, error } = await supabase
    .from("audits")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !audit) {
    notFound();
  }

  const recommendations = audit.recommendations ?? [];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800">

      {/* Nav */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 border-b border-zinc-900">
        <Link href="/" className="text-xl font-black tracking-tighter">
          BURNAUDIT<span className="text-zinc-500">-AI</span>
        </Link>
        <Link
          href="/"
          className="rounded-xl bg-white text-zinc-950 px-5 py-2 text-sm font-semibold hover:opacity-90 transition-all shadow-md"
        >
          New Audit
        </Link>
      </nav>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-12">

        {/* Header */}
        <div className="mb-10">
          <span className="inline-flex items-center rounded-full bg-zinc-900 border border-zinc-800 px-4 py-1.5 text-xs font-medium text-zinc-400">
            Saved Audit Report
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white">
            AI Stack Optimization Report
          </h1>
          <p className="mt-2 text-sm text-zinc-500">Audit ID: {id}</p>
        </div>

        {/* Savings Summary */}
        <div className="rounded-3xl bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 p-8 shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Aggregated Stack Recovery Matrix</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-zinc-400">Total Monthly Redundant Burn</p>
              <p className="mt-2 text-5xl font-black text-white tracking-tight">
                ${audit.total_monthly_savings?.toLocaleString() ?? 0}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400">Projected Annual Savings Captured</p>
              <p className="mt-2 text-5xl font-black text-green-400 tracking-tight">
                ${audit.total_annual_savings?.toLocaleString() ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {audit.ai_summary && (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl mb-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-400" />
              AI Executive Analysis
            </h3>
            <p className="mt-4 text-sm text-zinc-300 leading-relaxed italic">
              "{audit.ai_summary}"
            </p>
          </div>
        )}

        {/* Line Item Recommendations */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-zinc-300">Detailed Infrastructure Line-Item Recommendations</h3>
          {recommendations.map((result: any, index: number) => (
            <article
              key={index}
              className="rounded-2xl border border-zinc-800 bg-black/40 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="max-w-2xl">
                <div className="flex items-center gap-3">
                  <h4 className="text-xl font-bold text-white">{result.toolName}</h4>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase ${
                    result.severity === "high" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                    result.severity === "medium" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                    "bg-zinc-800 text-zinc-400"
                  }`}>
                    {result.severity} Priority
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{result.reasoning}</p>
              </div>

              <div className="flex flex-wrap gap-4 items-center bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80 min-w-[280px] justify-between md:justify-end">
                <div className="text-left md:text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Recommended Action</span>
                  <span className="mt-1 block text-sm font-semibold text-zinc-200">{result.recommendedPlan}</span>
                </div>
                <div className="w-[1px] h-8 bg-zinc-800 hidden sm:block" />
                <div className="text-left md:text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Recaptured Margin</span>
                  <span className="mt-1 block text-lg font-bold text-green-400">${result.monthlySavings}/mo</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Share link */}
        <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Shareable Audit URL</p>
            <p className="mt-1 text-sm text-zinc-300 font-mono break-all">
              {process.env.NEXT_PUBLIC_SITE_URL ?? ""}/audit/{id}
            </p>
          </div>
          <Link
            href="/"            className="whitespace-nowrap rounded-xl bg-white text-black px-5 py-2.5 text-sm font-bold hover:opacity-90 transition-all"
          >
            Run New Audit
          </Link>
        </div>

      </main>
    </div>
  );
}
