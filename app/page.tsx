import Link from "next/link";
import AuditForm from "@/components/audit-form";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800">
      
      {/* Premium Dark Navigation Header */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 border-b border-zinc-900">
        <div className="text-xl font-black tracking-tighter">
          BURNAUDIT<span className="text-zinc-500">-AI</span>
        </div>
        {/* Top Navbar Button pointing to our anchor section */}
        <Link 
          href="#audit-section" 
          className="rounded-xl bg-white text-zinc-950 px-5 py-2 text-sm font-semibold hover:opacity-90 transition-all shadow-md"
        >
          Run Audit
        </Link>
      </nav>

      {/* Main Hero Marketing Panel Container */}
      <header className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center">
        <span className="inline-flex items-center rounded-full bg-zinc-900 border border-zinc-800 px-4 py-1.5 text-xs font-medium text-zinc-400">
          Save thousands on AI subscriptions
        </span>
        <h1 className="mt-8 text-5xl font-black tracking-tight text-white sm:text-7xl leading-none">
          Stop Overpaying <br />
          <span className="text-zinc-400">for AI Tools</span>
        </h1>
        <p className="mt-6 text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Instantly audit your AI stack and uncover hidden savings across ChatGPT, Claude, Cursor, GitHub Copilot, Gemini, and more.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {/* Main Action Button pointing to our anchor section */}
          <Link 
            href="#audit-section" 
            className="rounded-xl bg-white text-zinc-950 px-6 py-3 font-bold text-sm hover:opacity-90 transition-all shadow-xl"
          >
            Run Free Audit
          </Link>
          <Link 
            href="#audit-section" 
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 text-zinc-300 px-6 py-3 font-semibold text-sm hover:bg-zinc-900/50 transition-all"
          >
            View Sample Report
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs font-medium text-zinc-600">
          <div>✓ No login required</div>
          <div>✓ Instant savings report</div>
          <div>✓ Shareable audit URL</div>
        </div>
      </header>

      {/* --- RENDER AUDIT WORKSPACE WITH MATCHING ANCHOR ID --- */}
      <main className="mx-auto max-w-5xl px-6 pb-24">
        <section id="audit-section" className="scroll-mt-24">
          <AuditForm />
        </section>
      </main>

    </div>
  );
}