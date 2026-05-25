"use client";

import { useState, useEffect } from "react";
import { runAudit } from "@/lib/audit-engine";
import { UserToolInput, AuditRecommendation } from "@/types/audit";

const AVAILABLE_TOOLS = [
  "ChatGPT", "Claude", "Cursor", "GitHub Copilot",
  "Gemini", "Windsurf", "Anthropic API", "OpenAI API",
];

const PLAN_MATRICES: Record<string, string[]> = {
  ChatGPT: ["Plus", "Team", "Enterprise", "API Direct"],
  Claude: ["Free", "Pro", "Max", "Team", "Enterprise", "API Direct"],
  Cursor: ["Hobby", "Pro", "Business", "Enterprise"],
  "GitHub Copilot": ["Individual", "Business", "Enterprise"],
  Gemini: ["Pro", "Ultra", "API"],
  Windsurf: ["Free", "Pro", "Teams"],
  "Anthropic API": ["API Direct"],
  "OpenAI API": ["API Direct"],
};

const USE_CASES = ["coding", "writing", "data", "research", "mixed"];

const TOOL_ICONS: Record<string, string> = {
  ChatGPT: "⬡", Claude: "◈", Cursor: "⌘",
  "GitHub Copilot": "◎", Gemini: "✦", Windsurf: "◊",
  "Anthropic API": "◈", "OpenAI API": "⬡",
};

const INITIAL_TOOL_STATE = (tool: string): UserToolInput => ({
  toolName: tool as any,
  currentPlan: PLAN_MATRICES[tool][0],
  seats: 1,
  monthlySpend: 20,
  annualBilling: false,
});

export default function AuditForm() {
  const [activeStack, setActiveStack] = useState<UserToolInput[]>([]);
  const [teamSize, setTeamSize] = useState<number>(1);
  const [useCase, setUseCase] = useState<string>("mixed");
  const [results, setResults] = useState<AuditRecommendation[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [shareableAuditId, setShareableAuditId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySubmitted, setNotifySubmitted] = useState(false);
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadRole, setLeadRole] = useState("");
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    const savedStack = localStorage.getItem("burnaudit_stack_cache");
    const savedTeamSize = localStorage.getItem("burnaudit_team_size");
    const savedUseCase = localStorage.getItem("burnaudit_use_case");
    if (savedStack) {
      try { setActiveStack(JSON.parse(savedStack)); }
      catch { setActiveStack([INITIAL_TOOL_STATE("ChatGPT")]); }
    } else {
      setActiveStack([INITIAL_TOOL_STATE("ChatGPT")]);
    }
    if (savedTeamSize) setTeamSize(Number(savedTeamSize));
    if (savedUseCase) setUseCase(savedUseCase);
    setIsHydrated(true);
  }, []);

  const updateStackAndCache = (updatedStack: UserToolInput[]) => {
    setActiveStack(updatedStack);
    localStorage.setItem("burnaudit_stack_cache", JSON.stringify(updatedStack));
  };

  const handleAddTool = () => {
    const names = activeStack.map((t) => t.toolName);
    const unused = AVAILABLE_TOOLS.find((t) => !names.includes(t)) || AVAILABLE_TOOLS[0];
    updateStackAndCache([...activeStack, INITIAL_TOOL_STATE(unused)]);
  };

  const handleRemoveTool = (i: number) => {
    updateStackAndCache(activeStack.filter((_, idx) => idx !== i));
  };

  const handleFieldChange = (index: number, field: keyof UserToolInput, value: any) => {
    const updated = activeStack.map((tool, idx) => {
      if (idx !== index) return tool;
      const newTool = { ...tool, [field]: value };
      if (field === "toolName") {
        newTool.currentPlan = PLAN_MATRICES[value as string][0];
        if (["Anthropic API", "OpenAI API"].includes(value as string)) newTool.seats = 1;
      }
      return newTool;
    });
    updateStackAndCache(updated);
  };

  const handleTeamSize = (val: number) => {
    setTeamSize(val);
    localStorage.setItem("burnaudit_team_size", String(val));
  };

  const handleUseCase = (val: string) => {
    setUseCase(val);
    localStorage.setItem("burnaudit_use_case", val);
  };

  const copyShareLink = () => {
    if (!shareableAuditId) return;
    navigator.clipboard.writeText(`${window.location.origin}/audit/${shareableAuditId}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleNotifySubmit = async () => {
    if (!notifyEmail) return;
    // Store email for future optimization alerts
    try {
      await fetch("/api/save-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stack: activeStack,
          recommendations: results,
          aiSummary,
          totalMonthlySavings: overallMonthlySavings,
          totalAnnualSavings: overallAnnualSavings,
          notifyEmail,
          teamSize,
          useCase,
        }),
      });
    } catch {}
    setNotifySubmitted(true);
  };

  const handleLeadSubmit = async () => {
    if (!leadEmail) return;
    try {
      await fetch("/api/save-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stack: activeStack,
          recommendations: results,
          aiSummary,
          totalMonthlySavings: overallMonthlySavings,
          totalAnnualSavings: overallAnnualSavings,
          teamSize,
          useCase,
          email: leadEmail,
          companyName: leadCompany,
          role: leadRole,
          website: honeypot, // honeypot
        }),
      });
    } catch {}
    setLeadSubmitted(true);
  };

  const executeStackAudit = async () => {
    setIsRunning(true);
    setShareableAuditId(null);
    setResults([]);
    setAiSummary("");

    const engineOutputs = runAudit(activeStack, teamSize, useCase);
    setResults(engineOutputs);

    const totalMonthlySavings = engineOutputs.reduce((s, i) => s + i.monthlySavings, 0);
    const totalAnnualSavings = engineOutputs.reduce((s, i) => s + i.annualSavings, 0);

    setIsLoadingSummary(true);
    let generatedSummary = "No AI summary generated.";

    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalMonthlySavings, totalAnnualSavings, recommendations: engineOutputs, useCase, teamSize }),
      });
      const data = await res.json();
      if (data.summary) { generatedSummary = data.summary; setAiSummary(generatedSummary); }
    } catch (err) {
      console.warn("Summary failed:", err);
    } finally {
      setIsLoadingSummary(false);
      setIsRunning(false);
      // Show lead capture after results are visible
      setTimeout(() => setShowLeadCapture(true), 1500);
    }

    try {
      const saveRes = await fetch("/api/save-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stack: activeStack, recommendations: engineOutputs, aiSummary: generatedSummary, totalMonthlySavings, totalAnnualSavings, teamSize, useCase }),
      });
      const saved = await saveRes.json();
      if (saved.success && saved.auditId) setShareableAuditId(saved.auditId);
      else console.warn("Save warning:", saved.error);
    } catch (e) {
      console.warn("Save failed:", e);
    }
  };

  if (!isHydrated) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  );

  const overallMonthlySavings = results.reduce((s, i) => s + i.monthlySavings, 0);
  const overallAnnualSavings = results.reduce((s, i) => s + i.annualSavings, 0);

  return (
    <div>
      {/* Section label */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Audit Configuration</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white">Build your AI stack</h2>
        <p className="mt-1 text-sm text-white/40">Add every AI tool your team pays for. We&apos;ll find the waste.</p>
      </div>

      {/* Team context */}
      <div className="mb-5 grid grid-cols-2 gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div>
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-white/30">Team Size</label>
          <input type="number" min="1" value={teamSize}
            onChange={(e) => handleTeamSize(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-xl border border-white/[0.08] bg-black/60 px-3 py-2.5 text-sm font-medium text-white focus:border-white/20 focus:outline-none transition-colors" />
        </div>
        <div>
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-white/30">Primary Use Case</label>
          <select value={useCase} onChange={(e) => handleUseCase(e.target.value)}
            className="w-full rounded-xl border border-white/[0.08] bg-black/60 px-3 py-2.5 text-sm font-medium text-white focus:border-white/20 focus:outline-none transition-colors appearance-none cursor-pointer capitalize">
            {USE_CASES.map((uc) => <option key={uc} value={uc} className="capitalize">{uc}</option>)}
          </select>
        </div>
      </div>

      {/* Tool rows */}
      <div className="space-y-3">
        {activeStack.map((toolInstance, idx) => {
          const isApi = ["Anthropic API", "OpenAI API"].includes(toolInstance.toolName) ||
            ["API Direct", "API"].includes(toolInstance.currentPlan);
          return (
            <div key={idx} className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition-all hover:border-white/[0.12] hover:bg-white/[0.05]">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-white/10 bg-[#080808] flex items-center justify-center">
                <span className="text-[10px] font-bold text-white/30">{idx + 1}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                <div className="col-span-2 md:col-span-1">
                  <label className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30">
                    <span>{TOOL_ICONS[toolInstance.toolName] || "◆"}</span> Tool
                  </label>
                  <select value={toolInstance.toolName} onChange={(e) => handleFieldChange(idx, "toolName", e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/60 px-3 py-2.5 text-sm font-medium text-white focus:border-white/20 focus:outline-none transition-colors appearance-none cursor-pointer">
                    {AVAILABLE_TOOLS.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-white/30">Plan</label>
                  <select value={toolInstance.currentPlan} onChange={(e) => handleFieldChange(idx, "currentPlan", e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/60 px-3 py-2.5 text-sm font-medium text-white focus:border-white/20 focus:outline-none transition-colors appearance-none cursor-pointer">
                    {PLAN_MATRICES[toolInstance.toolName].map((tier) => <option key={tier} value={tier}>{tier}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-white/30">{isApi ? "N/A" : "Seats"}</label>
                  <input type="number" min="1" value={isApi ? "" : toolInstance.seats} disabled={isApi}
                    onChange={(e) => handleFieldChange(idx, "seats", Math.max(1, Number(e.target.value)))}
                    placeholder={isApi ? "—" : ""}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/60 px-3 py-2.5 text-sm font-medium text-white focus:border-white/20 focus:outline-none transition-colors disabled:opacity-30 disabled:cursor-not-allowed" />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-white/30">{isApi ? "Monthly API Bill" : "$/Month"}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/30">$</span>
                    <input type="number" min="0" value={toolInstance.monthlySpend}
                      onChange={(e) => handleFieldChange(idx, "monthlySpend", Math.max(0, Number(e.target.value)))}
                      className="w-full rounded-xl border border-white/[0.08] bg-black/60 pl-7 pr-3 py-2.5 text-sm font-medium text-white focus:border-white/20 focus:outline-none transition-colors" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  {!isApi ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" checked={toolInstance.annualBilling}
                          onChange={(e) => handleFieldChange(idx, "annualBilling", e.target.checked)} className="sr-only" />
                        <div className={`h-5 w-9 rounded-full border transition-colors ${toolInstance.annualBilling ? "bg-white border-white" : "bg-transparent border-white/20"}`}>
                          <div className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${toolInstance.annualBilling ? "left-4 bg-black" : "left-0.5 bg-white/30"}`} />
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-white/40">Annual</span>
                    </label>
                  ) : (
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-1">
                      <span className="text-[10px] font-bold text-blue-400">API</span>
                    </div>
                  )}
                  {activeStack.length > 1 && (
                    <button type="button" onClick={() => handleRemoveTool(idx)}
                      className="h-8 w-8 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center text-sm">×</button>
                  )}
                </div>
              </div>
              {isApi && (
                <p className="mt-3 text-[11px] text-white/25 border-t border-white/[0.05] pt-3">
                  API billing is usage-based. Enter your actual last monthly invoice amount above.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={handleAddTool}
          className="rounded-xl border border-dashed border-white/15 px-5 py-2.5 text-sm font-medium text-white/40 hover:border-white/30 hover:text-white/70 transition-all">
          + Add tool
        </button>
        <button type="button" onClick={executeStackAudit} disabled={isRunning}
          className="rounded-xl bg-white px-7 py-2.5 text-sm font-bold text-black hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.08)]">
          {isRunning ? (
            <><div className="h-3.5 w-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />Analyzing...</>
          ) : "Generate Audit Report →"}
        </button>
      </div>

      {/* ===================== RESULTS ===================== */}
      {results.length > 0 && (
        <div className="mt-16 space-y-6">

          {/* Section divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Audit Results</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* ── HERO savings card ── */}
          <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-6">Stack Optimization Summary</p>
              <div className="grid sm:grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-xs text-white/40 mb-2">Monthly savings identified</p>
                  <p className="text-7xl font-black text-white tracking-tighter leading-none">
                    ${overallMonthlySavings.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/25 mt-2">per month</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-2">Annual runway recovered</p>
                  <p className="text-7xl font-black text-green-400 tracking-tighter leading-none">
                    ${overallAnnualSavings.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/25 mt-2">per year</p>
                </div>
              </div>

              {/* >$500 Credex CTA */}
              {overallMonthlySavings >= 500 && (
                <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.06] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      <p className="text-xs font-bold text-green-300 uppercase tracking-wider">High-Value Opportunity</p>
                    </div>
                    <p className="text-sm text-white font-semibold mb-1">Capture more savings with Credex</p>
                    <p className="text-xs text-white/50 max-w-md">
                      Credex sources discounted AI infrastructure credits from companies that overforecast — Claude, Cursor, ChatGPT Enterprise at 20–40% below retail. Your ${overallMonthlySavings.toLocaleString()}/mo savings is the floor, not the ceiling.
                    </p>
                  </div>
                  <button className="shrink-0 rounded-xl bg-green-400 hover:bg-green-300 text-black px-5 py-3 text-xs font-black transition-all whitespace-nowrap">
                    Book Free Consultation →
                  </button>
                </div>
              )}

              {/* <$100 honest message + notify capture */}
              {overallMonthlySavings === 0 && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                  <p className="text-sm font-bold text-white mb-1">You&apos;re spending well.</p>
                  <p className="text-xs text-white/50 mb-4">
                    Your AI stack is well-optimized for your team size and use case. No significant savings identified — this is a good result.
                    We&apos;ll monitor pricing changes and new plan options and alert you when optimizations appear.
                  </p>
                  {!notifySubmitted ? (
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="you@company.com"
                        value={notifyEmail}
                        onChange={(e) => setNotifyEmail(e.target.value)}
                        className="flex-1 rounded-xl border border-white/[0.08] bg-black/60 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-white/20 focus:outline-none"
                      />
                      <button onClick={handleNotifySubmit}
                        className="rounded-xl bg-white text-black px-5 py-2.5 text-xs font-bold hover:bg-white/90 transition-all whitespace-nowrap">
                        Notify me
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                      <span>✓</span> Got it — we&apos;ll alert you when pricing changes affect your stack.
                    </div>
                  )}
                </div>
              )}

              {overallMonthlySavings > 0 && overallMonthlySavings < 100 && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                  <p className="text-sm font-bold text-white mb-1">Mostly optimized.</p>
                  <p className="text-xs text-white/50 mb-4">
                    Small savings available but no major overhaul needed. We&apos;ll notify you when new optimizations apply to your stack.
                  </p>
                  {!notifySubmitted ? (
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="you@company.com"
                        value={notifyEmail}
                        onChange={(e) => setNotifyEmail(e.target.value)}
                        className="flex-1 rounded-xl border border-white/[0.08] bg-black/60 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-white/20 focus:outline-none"
                      />
                      <button onClick={handleNotifySubmit}
                        className="rounded-xl bg-white text-black px-5 py-2.5 text-xs font-bold hover:bg-white/90 transition-all whitespace-nowrap">
                        Notify me
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                      <span>✓</span> Got it — we&apos;ll alert you when pricing changes affect your stack.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── AI Summary ── */}
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">AI Executive Analysis</span>
            </div>
            {isLoadingSummary ? (
              <div className="space-y-2.5">
                {[100, 85, 65].map((w) => (
                  <div key={w} className="h-3 rounded-full bg-white/[0.06] animate-pulse" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/60 leading-relaxed">
                {aiSummary || "No narrative evaluation generated for this footprint profile."}
              </p>
            )}
          </div>

          {/* ── Per-tool breakdown ── */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4">Line-item breakdown</h3>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                  {/* Top bar */}
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

                  {/* Body */}
                  <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <p className="text-xs text-white/40 leading-relaxed max-w-xl flex-1">{result.reasoning}</p>
                    <div className="shrink-0 flex flex-col items-end gap-1 md:min-w-[160px]">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">Recommended action</p>
                      <p className="text-xs font-semibold text-white/70 text-right">{result.recommendedPlan}</p>
                      <div className="mt-2 rounded-xl bg-green-500/10 border border-green-500/20 px-3 py-1.5 text-center">
                        <p className="text-[10px] text-green-400/60 font-bold uppercase tracking-wider">Saves</p>
                        <p className="text-lg font-black text-green-400 leading-tight">${result.monthlySavings}<span className="text-xs font-medium">/mo</span></p>
                        <p className="text-[10px] text-green-400/50">${result.annualSavings.toLocaleString()}/yr</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Share bar ── */}
          {shareableAuditId ? (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1">Shareable Audit URL</p>
                <p className="text-sm font-mono text-white/50 break-all">
                  {typeof window !== "undefined" ? window.location.origin : ""}/audit/{shareableAuditId}
                </p>
              </div>
              <button onClick={copyShareLink}
                className={`shrink-0 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
                  copied ? "bg-green-500/20 border border-green-500/30 text-green-400" : "bg-white text-black hover:bg-white/90"
                }`}>
                {copied ? "✓ Copied!" : "Copy Link"}
              </button>
            </div>
          ) : results.length > 0 && (
            <div className="rounded-2xl border border-dashed border-white/[0.08] p-5 flex items-center gap-3">
              <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin shrink-0" />
              <p className="text-xs text-white/30">Generating shareable link...</p>
            </div>
          )}

        </div>
      )}

      {/* ── Lead capture modal ── */}
      {showLeadCapture && !leadSubmitted && overallMonthlySavings > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/[0.1] bg-[#0e0e0e] p-8 shadow-2xl">
            <button onClick={() => setShowLeadCapture(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/60 text-xl">×</button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 mb-4">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">
                  ${overallMonthlySavings.toLocaleString()}/mo identified
                </span>
              </div>
              <h3 className="text-xl font-black text-white mb-2">Get your full report</h3>
              <p className="text-sm text-white/40">
                We&apos;ll email you the complete audit and alert you when new optimizations apply to your stack.
                {overallMonthlySavings >= 500 && " The Credex team will also reach out about infrastructure credits."}
              </p>
            </div>

            <div className="space-y-3">
              {/* Honeypot — hidden from real users, bots fill it */}
              <input
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                aria-hidden="true"
                tabIndex={-1}
                style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0 }}
                autoComplete="off"
              />

              <input type="email" placeholder="Work email *" value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)} required
                className="w-full rounded-xl border border-white/[0.08] bg-black/60 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none" />
              <input type="text" placeholder="Company name (optional)" value={leadCompany}
                onChange={(e) => setLeadCompany(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-black/60 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none" />
              <input type="text" placeholder="Your role (optional)" value={leadRole}
                onChange={(e) => setLeadRole(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-black/60 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none" />

              <button onClick={handleLeadSubmit} disabled={!leadEmail}
                className="w-full rounded-xl bg-white text-black py-3 text-sm font-bold hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                Send My Report →
              </button>

              <button onClick={() => setShowLeadCapture(false)}
                className="w-full text-xs text-white/25 hover:text-white/50 transition-colors py-1">
                Skip — just show the results
              </button>
            </div>
          </div>
        </div>
      )}

      {leadSubmitted && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4 flex items-center gap-3 shadow-xl">
          <span className="text-green-400 text-lg">✓</span>
          <div>
            <p className="text-sm font-bold text-white">Report sent to {leadEmail}</p>
            <p className="text-xs text-white/40">Check your inbox in a few minutes.</p>
          </div>
          <button onClick={() => setLeadSubmitted(false)} className="ml-2 text-white/30 hover:text-white/60">×</button>
        </div>
      )}
    </div>
  );
}
