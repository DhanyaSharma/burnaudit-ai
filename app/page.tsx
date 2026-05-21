export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold">BurnAudit AI</h1>

          <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black">
            Run Audit
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Save thousands on AI subscriptions
          </div>

          <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
            Stop Overpaying
            <span className="block text-zinc-400">
              for AI Tools
            </span>
          </h1>

          <p className="mt-8 text-lg leading-8 text-zinc-400">
            Instantly audit your AI stack and uncover hidden savings across
            ChatGPT, Claude, Cursor, GitHub Copilot, Gemini, and more.
          </p>

          <div className="mt-10 flex gap-4">
            <button className="rounded-xl bg-white px-6 py-3 font-medium text-black transition hover:opacity-90">
              Run Free Audit
            </button>

            <button className="rounded-xl border border-zinc-700 px-6 py-3 font-medium text-white">
              View Sample Report
            </button>
          </div>

          <div className="mt-12 flex gap-8 text-sm text-zinc-500">
            <p>✓ No login required</p>
            <p>✓ Instant savings report</p>
            <p>✓ Shareable audit URL</p>
          </div>
        </div>
      </section>
    </main>
  );
}