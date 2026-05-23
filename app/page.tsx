import Link from "next/link";
import AuditForm from "@/components/audit-form";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#080808] text-white">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#080808]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-white flex items-center justify-center">
              <div className="h-3 w-3 rounded-sm bg-black" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">
              BURNAUDIT<span className="text-white/30">.AI</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="#audit-section"
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              How it works
            </Link>
            <Link
              href="#audit-section"
              className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-black hover:bg-white/90 transition-all"
            >
              Run Free Audit
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
        {/* Radial glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-white/[0.03] rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 mb-8">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-white/60 tracking-wide">Free AI spend analysis — no account needed</span>
          </div>

          <h1 className="text-6xl sm:text-7xl font-black tracking-tighter text-white leading-[0.95] mb-6">
            Stop burning money<br />
            <span className="text-white/25">on AI tools.</span>
          </h1>

          <p className="text-base text-white/40 max-w-lg mx-auto leading-relaxed mb-10">
            Audit your AI stack in 60 seconds. Find duplicate subscriptions, wrong plans, and hidden savings across every major AI tool.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
            <Link
              href="#audit-section"
              className="rounded-xl bg-white text-black px-7 py-3.5 text-sm font-bold hover:bg-white/90 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]"
            >
              Run Free Audit →
            </Link>
            <Link
              href="#audit-section"
              className="rounded-xl border border-white/10 bg-white/[0.04] text-white/70 px-7 py-3.5 text-sm font-medium hover:bg-white/[0.08] hover:text-white transition-all"
            >
              View Sample Report
            </Link>
          </div>

          {/* Social proof strip */}
          <div className="flex flex-wrap items-center justify-center gap-8">
            {[
              ["$49k+", "recovered last month"],
              ["8 tools", "supported"],
              ["60 sec", "average audit time"],
            ].map(([stat, label]) => (
              <div key={stat} className="text-center">
                <div className="text-xl font-black text-white">{stat}</div>
                <div className="text-xs text-white/30 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-6xl px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Audit Form */}
      <main className="mx-auto max-w-4xl px-6 py-16 pb-32">
        <section id="audit-section" className="scroll-mt-24">
          <AuditForm />
        </section>
      </main>

    </div>
  );
}
