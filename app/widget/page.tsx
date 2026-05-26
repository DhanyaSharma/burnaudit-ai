import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Embeddable Widget — BurnAudit AI",
  description: "Add the BurnAudit AI widget to your blog or site with one script tag.",
};

export default function WidgetPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://burnaudit.ai";
  const scriptTag = `<script src="${siteUrl}/api/widget.js" data-theme="dark"></script>`;

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <nav className="border-b border-white/[0.06] px-6 py-4">
        <a href="/" className="text-sm font-bold tracking-tight">
          BURNAUDIT<span className="text-white/30">.AI</span>
        </a>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-20">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Bonus Feature</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white mb-4">
          Embeddable Widget
        </h1>
        <p className="text-sm text-white/40 mb-12 max-w-lg">
          Add a floating "Audit AI Spend" button to any blog, docs site, or landing page with one script tag. Opens a modal with the full audit tool — no redirect needed.
        </p>

        {/* Install */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/30 mb-4">Installation</h2>
          <p className="text-sm text-white/50 mb-4">
            Paste this script tag anywhere in your HTML — before the closing <code className="text-white/70">&lt;/body&gt;</code> tag.
          </p>
          <div className="rounded-xl bg-black border border-white/[0.08] p-4">
            <code className="text-sm text-green-400 font-mono break-all">{scriptTag}</code>
          </div>
        </div>

        {/* Options */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/30 mb-4">Options</h2>
          <div className="space-y-3 text-sm">
            {[
              ["data-theme", '"dark" | "light"', "Button color scheme to match your site"],
            ].map(([attr, type, desc]) => (
              <div key={attr} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <code className="text-white/70 font-mono text-xs shrink-0">{attr}</code>
                <code className="text-purple-400 font-mono text-xs shrink-0">{type}</code>
                <span className="text-white/30 text-xs">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Events */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/30 mb-4">JavaScript Events</h2>
          <p className="text-sm text-white/40 mb-4">Listen for audit completion on the host page:</p>
          <div className="rounded-xl bg-black border border-white/[0.08] p-4 font-mono text-sm text-white/60">
            <div><span className="text-white/30">{"// Fires when user completes an audit"}</span></div>
            <div>window.addEventListener(<span className="text-green-400">'burnaudit:complete'</span>, (e) {"=>"} {"{"}</div>
            <div className="pl-4">console.log(e.detail); <span className="text-white/30">{"// { auditId, monthlySavings, annualSavings }"}</span></div>
            <div>{"}"});</div>
          </div>
        </div>

        {/* Preview note */}
        <div className="rounded-2xl border border-dashed border-white/[0.08] p-6 text-center">
          <p className="text-xs text-white/30">
            The floating button is live on this page — look bottom-right ↘
          </p>
        </div>
      </main>

      {/* Live demo — the actual widget script */}
      <script src="/api/widget.js" data-theme="dark" async />
    </div>
  );
}
