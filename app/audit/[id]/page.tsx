import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface AuditPageProps {
  params: Promise<{ id: string }>;
}

export default async function SharedAuditPage({ params }: AuditPageProps) {
  // 1. Await the dynamic route parameter payload safely
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // 2. Query the exact snapshot row from Supabase
  const { data: audit, error } = await supabase
    .from("audits")
    .select("*")
    .eq("id", id)
    .single();

  // 3. Defensive check: If database errors out or record is missing, throw native 404 page
  if (error || !audit) {
    notFound();
  }

  // Parse total calculations for the metric cards
  const monthlySavings = Number(audit.total_monthly_savings);
  const annualSavings = Number(audit.total_annual_savings);

  return (
    <div className="min-h-screen bg-black text-white px-4 py-16 selection:bg-zinc-800">
      <div className="mx-auto max-w-5xl">
        
        {/* Navigation & Branding Header */}
        <header className="flex items-center justify-between border-b border-zinc-800 pb-8">
          <Link href="/" className="text-xl font-black tracking-tighter text-white hover:opacity-80 transition-all">
            BurnAudit <span className="text-zinc-500">AI</span>
          </Link>
          <span className="rounded-full bg-zinc-900 border border-zinc-800 px-4 py-1.5 text-xs font-medium text-zinc-400">
            Immutable Audit Report Snapshot
          </span>
        </header>

        {/* Aggregated Totals Hero Cards */}
        <section className="mt-12 rounded-3xl bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
          <h1 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Aggregated Stack Recovery Matrix</h1>
          
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-zinc-400">Total Monthly Redundant Burn</p>
              <p className="mt-2 text-5xl font-black text-white tracking-tight">${monthlySavings.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400">Projected Annual Savings Captured</p>
              <p className="mt-2 text-5xl font-black text-green-400 tracking-tight">${annualSavings.toLocaleString()}</p>
            </div>
          </div>
        </section>

        {/* Qualitative AI Summary Paragraph Display */}
        {audit.ai_summary && (
          <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-400" />
              AI Executive Analysis Summary
            </h2>
            <p className="mt-4 text-sm text-zinc-300 leading-relaxed italic">
              "{audit.ai_summary}"
            </p>
          </section>
        )}

        {/* Detailed Recommendations Mapping */}
        <main className="mt-12 space-y-4">
          <h3 className="text-lg font-bold text-zinc-300">Detailed Infrastructure Line-Item Recommendations</h3>
          
          {Array.isArray(audit.recommendations) && audit.recommendations.map((result: any, index: number) => (
            <article key={index} className="rounded-2xl border border-zinc-800 bg-black/40 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
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
        </main>

        {/* Footer Action items */}
        <footer className="mt-16 text-center border-t border-zinc-900 pt-8">
          <Link href="/" className="text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-all">
            ← Run a new configuration infrastructure audit
          </Link>
        </footer>

      </div>
    </div>
  );
}