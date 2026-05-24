"use client";

import { useState, useEffect } from "react";
import { runAudit } from "@/lib/audit-engine";
import { UserToolInput, AuditRecommendation } from "@/types/audit";

const AVAILABLE_TOOLS = [
  "ChatGPT",
  "Claude",
  "Cursor",
  "GitHub Copilot",
  "Gemini",
  "Windsurf",
  "Anthropic API",
  "OpenAI API",
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
  ChatGPT: "⬡",
  Claude: "◈",
  Cursor: "⌘",
  "GitHub Copilot": "◎",
  Gemini: "✦",
  Windsurf: "◊",
  "Anthropic API": "◈",
  "OpenAI API": "⬡",
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
    const currentSelectedNames = activeStack.map((t) => t.toolName);
    const unusedTool = AVAILABLE_TOOLS.find((t) => !currentSelectedNames.includes(t)) || AVAILABLE_TOOLS[0];
    updateStackAndCache([...activeStack, INITIAL_TOOL_STATE(unusedTool)]);
  };

  const handleRemoveTool = (indexToRemove: number) => {
    updateStackAndCache(activeStack.filter((_, idx) => idx !== indexToRemove));
  };

  const handleFieldChange = (index: number, field: keyof UserToolInput, value: any) => {
    const updated = activeStack.map((tool, idx) => {
      if (idx !== index) return tool;
      const newTool = { ...tool, [field]: value };
      if (field === "toolName") {
        newTool.currentPlan = PLAN_MATRICES[value as string][0];
        // API tiers don't have seats
        if (["Anthropic API", "OpenAI API"].includes(value as string)) {
          newTool.seats = 1;
        }
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
    const url = `${window.location.origin}/audit/${shareableAuditId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const executeStackAudit = async () => {
    setIsRunning(true);
    setShareableAuditId(null);

    const engineOutputs = runAudit(activeStack);
    setResults(engineOutputs);

    const totalMonthlySavings = engineOutputs.reduce((sum, item) => sum + item.monthlySavings, 0);
    const totalAnnualSavings = engineOutputs.reduce((sum, item) => sum + item.annualSavings, 0);

    setIsLoadingSummary(true);
    setAiSummary("");
    let generatedSummary = "No AI summary generated.";

    try {
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalMonthlySavings,
          totalAnnualSavings,
          recommendations: engineOutputs,
          useCase,
          teamSize,
        }),
      });
      const data = await response.json();
      if (data.summary) {
        generatedSummary = data.summary;
        setAiSummary(generatedSummary);
      }
    } catch (err) {
      console.warn("Failed to load summary:", err);
    } finally {
      setIsLoadingSummary(false);
      setIsRunning(false);
    }

    try {
      const saveResponse = await fetch("/api/save-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stack: activeStack,
          recommendations: engineOutputs,
          aiSummary: generatedSummary,
          totalMonthlySavings,
          totalAnnualSavings,
          teamSize,
          useCase,
        }),
      });
      const savedAudit = await saveResponse.json();
      if (savedAudit.success && savedAudit.auditId) {
        setShareableAuditId(savedAudit.auditId);
      } else {
        console.warn("Database persistence warning:", savedAudit.error);
      }
    } catch (saveErr) {
      console.warn("Failed to save audit:", saveErr);
    }
  };

  if (!isHydrated) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  );

  const overallMonthlySavings = results.reduce((sum, item) => sum + item.monthlySavings, 0);
  const overallAnnualSavings = results.reduce((sum, item) => sum + item.annualSavings, 0);
  const isApiTool = (toolName: string) => ["Anthropic API", "OpenAI API"].includes(toolName) || 
    ["API Direct", "API"].includes(activeStack.find(t => t.toolName === toolName)?.currentPlan || "");

  return (
    <div>
      {/* Form header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Audit Configuration</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white">Build your AI stack</h2>
        <p className="mt-1 text-sm text-white/40">Add every AI tool your team pays for. We&apos;ll find the waste.</p>
      </div>

      {/* Team context row */}
      <div className="mb-5 grid grid-cols-2 gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div>
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-white/30">Team Size</label>
          <input
            type="number"
            min="1"
            value={teamSize}
            onChange={(e) => handleTeamSize(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-xl border border-white/[0.08] bg-black/60 px-3 py-2.5 text-sm font-medium text-white focus:border-white/20 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-white/30">Primary Use Case</label>
          <select
            value={useCase}
            onChange={(e) => handleUseCase(e.target.value)}
            className="w-full rounded-xl border border-white/[0.08] bg-black/60 px-3 py-2.5 text-sm font-medium text-white focus:border-white/20 focus:outline-none transition-colors appearance-none cursor-pointer capitalize"
          >
            {USE_CASES.map((uc) => (
              <option key={uc} value={uc} className="capitalize">{uc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tool rows */}
      <div className="space-y-3">
        {activeStack.map((toolInstance, idx) => {
          const isApi = ["Anthropic API", "OpenAI API"].includes(toolInstance.toolName) ||
            ["API Direct", "API"].includes(toolInstance.currentPlan);

          return (
            <div
              key={idx}
              className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition-all hover:border-white/[0.12] hover:bg-white/[0.05]"
            >
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-white/10 bg-[#080808] flex items-center justify-center">
                <span className="text-[10px] font-bold text-white/30">{idx + 1}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                {/* Tool */}
                <div className="col-span-2 md:col-span-1">
                  <label className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30">
                    <span>{TOOL_ICONS[toolInstance.toolName] || "◆"}</span>
                    Tool
                  </label>
                  <select
                    value={toolInstance.toolName}
                    onChange={(e) => handleFieldChange(idx, "toolName", e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/60 px-3 py-2.5 text-sm font-medium text-white focus:border-white/20 focus:outline-none transition-colors appearance-none cursor-pointer"
                  >
                    {AVAILABLE_TOOLS.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                {/* Plan */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-white/30">Plan</label>
                  <select
                    value={toolInstance.currentPlan}
                    onChange={(e) => handleFieldChange(idx, "currentPlan", e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/60 px-3 py-2.5 text-sm font-medium text-white focus:border-white/20 focus:outline-none transition-colors appearance-none cursor-pointer"
                  >
                    {PLAN_MATRICES[toolInstance.toolName].map((tier) => (
                      <option key={tier} value={tier}>{tier}</option>
                    ))}
                  </select>
                </div>

                {/* Seats — hidden for API tools */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-white/30">
                    {isApi ? "N/A" : "Seats"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={isApi ? "—" : toolInstance.seats}
                    disabled={isApi}
                    onChange={(e) => handleFieldChange(idx, "seats", Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/60 px-3 py-2.5 text-sm font-medium text-white focus:border-white/20 focus:outline-none transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Monthly spend */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-white/30">
                    {isApi ? "Monthly API Bill ($)" : "$/Month"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/30">$</span>
                    <input
                      type="number"
                      min="0"
                      value={toolInstance.monthlySpend}
                      onChange={(e) => handleFieldChange(idx, "monthlySpend", Math.max(0, Number(e.target.value)))}
                      className="w-full rounded-xl border border-white/[0.08] bg-black/60 pl-7 pr-3 py-2.5 text-sm font-medium text-white focus:border-white/20 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Annual toggle + remove */}
                <div className="flex items-center justify-between gap-3">
                  {!isApi ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={toolInstance.annualBilling}
                          onChange={(e) => handleFieldChange(idx, "annualBilling", e.target.checked)}
                          className="sr-only"
                        />
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
                    <button
                      type="button"
                      onClick={() => handleRemoveTool(idx)}
                      className="h-8 w-8 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center text-sm"
                      aria-label={`Remove ${toolInstance.toolName}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* API tier note */}
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
        <button
          type="button"
          onClick={handleAddTool}
          className="rounded-xl border border-dashed border-white/15 px-5 py-2.5 text-sm font-medium text-white/40 hover:border-white/30 hover:text-white/70 transition-all"
        >
          + Add tool
        </button>

        <button
          type="button"
          onClick={executeStackAudit}
          disabled={isRunning}
          className="rounded-xl bg-white px-7 py-2.5 text-sm font-bold text-black hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.08)]"
        >
          {isRunning ? (
            <>
              <div className="h-3.5 w-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
              Analyzing...
            </>
          ) : (
            "Generate Audit Report →"
          )}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-12 space-y-6">

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Audit Results</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Savings hero */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="relative grid sm:grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-2">Monthly savings identified</p>
                <p className="text-6xl font-black text-white tracking-tighter">${overallMonthlySavings.toLocaleString()}</p>
                <p className="text-xs text-white/30 mt-1">per month</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-2">Annual runway recovered</p>
                <p className="text-6xl font-black text-green-400 tracking-tighter">${overallAnnualSavings.toLocaleString()}</p>
                <p className="text-xs text-white/30 mt-1">per year</p>
              </div>
            </div>

            {overallMonthlySavings >= 500 && (
              <div className="mt-6 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-white mb-1">Save even more with Credex</p>
                  <p className="text-xs text-white/40 max-w-sm">
                    Get discounted AI infrastructure credits sourced from companies that overforecast. Real discounts, verified supply.
                  </p>
                </div>
                <button className="whitespace-nowrap rounded-xl bg-white text-black px-5 py-2.5 text-xs font-bold hover:bg-white/90 transition-all">
                  Book Credex Consultation →
                </button>
              </div>
            )}

            {overallMonthlySavings > 0 && overallMonthlySavings < 100 && (
              <div className="mt-6 pt-6 border-t border-white/[0.06]">
                <p className="text-xs text-white/40">
                  <strong className="text-white/60">Honest take:</strong> Your spend is fairly optimized. Small gains available but no major overhaul needed.
                </p>
              </div>
            )}
          </div>

          {/* AI Summary */}
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">AI Executive Analysis</span>
            </div>
            {isLoadingSummary ? (
              <div className="space-y-2">
                {[100, 83, 66].map((w) => (
                  <div key={w} className="h-3.5 rounded-full bg-white/[0.06] animate-pulse" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/60 leading-relaxed">
                {aiSummary || "No narrative evaluation generated for this footprint profile."}
              </p>
            )}
          </div>

          {/* Line items */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/30">Line-item breakdown</h3>
            {results.map((result, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-base font-black text-white">{result.toolName}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      result.severity === "high"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : result.severity === "medium"
                        ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        : "bg-white/[0.06] text-white/30 border border-white/10"
                    }`}>
                      {result.severity}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed max-w-xl">{result.reasoning}</p>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-1">Action</p>
                    <p className="text-sm font-semibold text-white/70">{result.recommendedPlan}</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-right min-w-[80px]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-1">Saves</p>
                    <p className="text-xl font-black text-green-400">${result.monthlySavings}<span className="text-xs font-medium text-green-400/60">/mo</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Share bar */}
          {shareableAuditId ? (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1">Shareable Audit URL</p>
                <p className="text-sm font-mono text-white/50 break-all">
                  {typeof window !== "undefined" ? window.location.origin : ""}/audit/{shareableAuditId}
                </p>
              </div>
              <button
                onClick={copyShareLink}
                className={`shrink-0 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
                  copied
                    ? "bg-green-500/20 border border-green-500/30 text-green-400"
                    : "bg-white text-black hover:bg-white/90"
                }`}
              >
                {copied ? "✓ Copied!" : "Copy Link"}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/[0.08] p-5 flex items-center gap-3">
              <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin shrink-0" />
              <p className="text-xs text-white/30">Generating shareable link...</p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
