"use client";

import { useState, useEffect } from "react";
import { runAudit } from "@/lib/audit-engine";
import { UserToolInput, AuditRecommendation } from "@/types/audit";
import { useRouter } from "next/navigation";

const AVAILABLE_TOOLS = ["ChatGPT", "Claude", "Cursor", "GitHub Copilot", "Gemini", "Windsurf"];

const PLAN_MATRICES: Record<string, string[]> = {
  ChatGPT: ["Go", "Plus", "Team", "Enterprise"],
  Claude: ["Free", "Pro", "Max", "Team", "Enterprise"],
  Cursor: ["Hobby", "Pro", "Business", "Enterprise"],
  "GitHub Copilot": ["Individual", "Business", "Enterprise"],
  Gemini: ["Free", "Pro", "Business", "Enterprise"],
  Windsurf: ["Free", "Pro", "Teams"],
};

const INITIAL_TOOL_STATE = (tool: string): UserToolInput => ({
  toolName: tool as any,
  currentPlan: PLAN_MATRICES[tool][0],
  seats: 1,
  monthlySpend: 20,
  annualBilling: false,
});

export default function AuditForm() {
  const router = useRouter();
  const [activeStack, setActiveStack] = useState<UserToolInput[]>([]);
  const [results, setResults] = useState<AuditRecommendation[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedStack = localStorage.getItem("burnaudit_stack_cache");
    if (savedStack) {
      try {
        setActiveStack(JSON.parse(savedStack));
      } catch (e) {
        setActiveStack([INITIAL_TOOL_STATE("ChatGPT")]);
      }
    } else {
      setActiveStack([INITIAL_TOOL_STATE("ChatGPT")]);
    }
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
    const filterStack = activeStack.filter((_, idx) => idx !== indexToRemove);
    updateStackAndCache(filterStack);
  };

  const handleFieldChange = (index: number, field: keyof UserToolInput, value: any) => {
    const updated = activeStack.map((tool, idx) => {
      if (idx !== index) return tool;
      
      const newTool = { ...tool, [field]: value };
      if (field === "toolName") {
        newTool.currentPlan = PLAN_MATRICES[value as string][0];
      }
      return newTool;
    });
    updateStackAndCache(updated);
  };

  const executeStackAudit = async () => {
    // 1. Run the local math engine instantly
    const engineOutputs = runAudit(activeStack);
    setResults(engineOutputs);
    
    // Calculate totals to forward to backend API proxy
    const totalMonthlySavings = engineOutputs.reduce((sum, item) => sum + item.monthlySavings, 0);
    const totalAnnualSavings = engineOutputs.reduce((sum, item) => sum + item.annualSavings, 0);

    // 2. Fetch the qualitative AI Summary narrative from our backend proxy route
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
          recommendations: engineOutputs
        })
      });
      const data = await response.json();
      if (data.summary) {
        generatedSummary = data.summary;
        setAiSummary(generatedSummary);
      }
    } catch (err) {
      // Use console.warn — console.error triggers the Next.js dev overlay
      console.warn("Failed to load summary narrative:", err);
    } finally {
      setIsLoadingSummary(false);
    }

    // 3. Save Audit payload to Supabase
    try {
      const saveResponse = await fetch("/api/save-audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stack: activeStack,
          recommendations: engineOutputs,
          aiSummary: generatedSummary,
          totalMonthlySavings,
          totalAnnualSavings,
        }),
      });

      const savedAudit = await saveResponse.json();
      
      if (savedAudit.success && savedAudit.auditId) {
        router.push(`/audit/${savedAudit.auditId}`);
      } else {
        // console.warn instead of console.error — avoids Next.js dev overlay
        console.warn("Database persistence warning:", savedAudit.error);
      }
    } catch (saveErr) {
      // console.warn instead of console.error — avoids Next.js dev overlay
      console.warn("Failed to post audit payload to backend storage:", saveErr);
    }
  };

  if (!isHydrated) return <div className="mt-20 text-center text-zinc-500 animate-pulse">Loading Stack Parameters...</div>;

  const overallMonthlySavings = results.reduce((sum, item) => sum + item.monthlySavings, 0);
  const overallAnnualSavings = results.reduce((sum, item) => sum + item.annualSavings, 0);

  return (
    <div className="mt-20 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur-md">
      <header>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">Run Your AI Spend Audit</h2>
        <p className="mt-2 text-zinc-400">Map your operational infrastructure stack to discover overlapping feature redundancies.</p>
      </header>

      <div className="mt-8 space-y-6">
        {activeStack.map((toolInstance, idx) => (
          <fieldset key={idx} className="relative grid gap-4 rounded-2xl border border-zinc-800 bg-black/40 p-6 md:grid-cols-5 items-end">
            <legend className="sr-only">Configuration data for tool instance index {idx}</legend>
            
            <div>
              <label htmlFor={`tool-name-${idx}`} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">AI Tool Platform</label>
              <select
                id={`tool-name-${idx}`}
                value={toolInstance.toolName}
                onChange={(e) => handleFieldChange(idx, "toolName", e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-all text-sm"
              >
                {AVAILABLE_TOOLS.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={`tool-plan-${idx}`} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Current Plan Tier</label>
              <select
                id={`tool-plan-${idx}`}
                value={toolInstance.currentPlan}
                onChange={(e) => handleFieldChange(idx, "currentPlan", e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-all text-sm"
              >
                {PLAN_MATRICES[toolInstance.toolName].map((tierName) => (
                  <option key={tierName} value={tierName}>{tierName}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={`tool-seats-${idx}`} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Seats Deployed</label>
              <input
                id={`tool-seats-${idx}`}
                type="number"
                min="1"
                value={toolInstance.seats}
                onChange={(e) => handleFieldChange(idx, "seats", Math.max(1, Number(e.target.value)))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-all text-sm"
              />
            </div>

            <div>
              <label htmlFor={`tool-spend-${idx}`} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Monthly Bill ($)</label>
              <input
                id={`tool-spend-${idx}`}
                type="number"
                min="0"
                value={toolInstance.monthlySpend}
                onChange={(e) => handleFieldChange(idx, "monthlySpend", Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-all text-sm"
              />
            </div>

            <div className="flex items-center justify-between gap-2 h-[46px]">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={toolInstance.annualBilling}
                  onChange={(e) => handleFieldChange(idx, "annualBilling", e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-950 text-white focus:ring-0 focus:ring-offset-0"
                />
                Annualized
              </label>

              {activeStack.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveTool(idx)}
                  className="rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-400 px-3 py-2 text-xs font-medium transition-all"
                  aria-label={`Remove ${toolInstance.toolName} configuration`}
                >
                  Delete
                </button>
              )}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={handleAddTool}
          className="rounded-xl border border-dashed border-zinc-700 hover:border-zinc-500 px-5 py-3 text-sm font-medium text-zinc-300 transition-all bg-zinc-950/20"
        >
          + Add Tool to Stack
        </button>

        <button
          type="button"
          onClick={executeStackAudit}
          className="rounded-xl bg-gradient-to-r from-zinc-100 to-white hover:opacity-90 px-6 py-3 text-sm font-semibold text-black transition-all shadow-lg"
        >
          Generate Optimization Report
        </button>
      </div>

      {results.length > 0 && (
        <section className="mt-12 space-y-8 border-t border-zinc-800 pt-8 animate-fadeIn">
          <div className="rounded-3xl bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Aggregated Stack Recovery Matrix</h3>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-zinc-400">Total Monthly Redundant Burn</p>
                <p className="mt-2 text-5xl font-black text-white tracking-tight">${overallMonthlySavings.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-400">Projected Annual Savings Captured</p>
                <p className="mt-2 text-5xl font-black text-green-400 tracking-tight">${overallAnnualSavings.toLocaleString()}</p>
              </div>
            </div>

            {overallMonthlySavings >= 500 ? (
              <div className="mt-6 rounded-2xl bg-green-500/10 border border-green-500/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-sm text-green-300 max-w-xl">
                  <strong>High-Yield Optimization Opportunity Detected:</strong> Your enterprise configuration features profound licensing inefficiencies. Sourcing verified platform assets through **Credex infrastructure credits** would clear these overhead lines immediately.
                </p>
                <button className="whitespace-nowrap rounded-xl bg-green-400 hover:bg-green-300 text-black px-4 py-2 text-xs font-bold transition-all">
                  Book Credex Consultation
                </button>
              </div>
            ) : overallMonthlySavings > 0 && overallMonthlySavings < 100 ? (
              <div className="mt-6 rounded-2xl bg-zinc-800/60 p-4 text-xs text-zinc-400">
                <strong>Honest Assessment Asset:</strong> Your platform overhead footprint metrics line up effectively against active developer allocations.
              </div>
            ) : null}
          </div>

          {/* AI Personalized Executive Summary Section */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
            <h4 className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
              AI Executive Analysis
            </h4>
            {isLoadingSummary ? (
              <div className="mt-4 space-y-2 animate-pulse">
                <div className="h-4 bg-zinc-800 rounded w-full" />
                <div className="h-4 bg-zinc-800 rounded w-5/6" />
                <div className="h-4 bg-zinc-800 rounded w-2/3" />
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-300 leading-relaxed italic">
                "{aiSummary || "No narrative evaluation generated for this footprint profile."}"
              </p>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-bold text-zinc-300">Detailed Infrastructure Line-Item Recommendations</h4>
            {results.map((result, index) => (
              <article key={index} className="rounded-2xl border border-zinc-800 bg-black/40 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3">
                    <h5 className="text-xl font-bold text-white">{result.toolName}</h5>
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
        </section>
      )}
    </div>
  );
}

// "use client";

// import { useState, useEffect } from "react";
// import { runAudit } from "@/lib/audit-engine";
// import { UserToolInput, AuditRecommendation } from "@/types/audit";
// import { useRouter } from "next/navigation";

// const AVAILABLE_TOOLS = ["ChatGPT", "Claude", "Cursor", "GitHub Copilot", "Gemini", "Windsurf"];

// const PLAN_MATRICES: Record<string, string[]> = {
//   ChatGPT: ["Go", "Plus", "Team", "Enterprise"],
//   Claude: ["Free", "Pro", "Max", "Team", "Enterprise"],
//   Cursor: ["Hobby", "Pro", "Business", "Enterprise"],
//   "GitHub Copilot": ["Individual", "Business", "Enterprise"],
//   Gemini: ["Free", "Pro", "Business", "Enterprise"],
//   Windsurf: ["Free", "Pro", "Teams"],
// };

// const INITIAL_TOOL_STATE = (tool: string): UserToolInput => ({
//   toolName: tool as any,
//   currentPlan: PLAN_MATRICES[tool][0],
//   seats: 1,
//   monthlySpend: 20,
//   annualBilling: false,
// });

// export default function AuditForm() {
//   const router = useRouter();
//   const [activeStack, setActiveStack] = useState<UserToolInput[]>([]);
//   const [results, setResults] = useState<AuditRecommendation[]>([]);
//   const [aiSummary, setAiSummary] = useState<string>("");
//   const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
//   const [isHydrated, setIsHydrated] = useState(false);

//   useEffect(() => {
//     const savedStack = localStorage.getItem("burnaudit_stack_cache");
//     if (savedStack) {
//       try {
//         setActiveStack(JSON.parse(savedStack));
//       } catch (e) {
//         setActiveStack([INITIAL_TOOL_STATE("ChatGPT")]);
//       }
//     } else {
//       setActiveStack([INITIAL_TOOL_STATE("ChatGPT")]);
//     }
//     setIsHydrated(true);
//   }, []);

//   const updateStackAndCache = (updatedStack: UserToolInput[]) => {
//     setActiveStack(updatedStack);
//     localStorage.setItem("burnaudit_stack_cache", JSON.stringify(updatedStack));
//   };

//   const handleAddTool = () => {
//     const currentSelectedNames = activeStack.map((t) => t.toolName);
//     const unusedTool = AVAILABLE_TOOLS.find((t) => !currentSelectedNames.includes(t)) || AVAILABLE_TOOLS[0];
//     updateStackAndCache([...activeStack, INITIAL_TOOL_STATE(unusedTool)]);
//   };

//   const handleRemoveTool = (indexToRemove: number) => {
//     const filterStack = activeStack.filter((_, idx) => idx !== indexToRemove);
//     updateStackAndCache(filterStack);
//   };

//   const handleFieldChange = (index: number, field: keyof UserToolInput, value: any) => {
//     const updated = activeStack.map((tool, idx) => {
//       if (idx !== index) return tool;
      
//       const newTool = { ...tool, [field]: value };
//       if (field === "toolName") {
//         newTool.currentPlan = PLAN_MATRICES[value as string][0];
//       }
//       return newTool;
//     });
//     updateStackAndCache(updated);
//   };

//   const executeStackAudit = async () => {
//     // 1. Run the local math engine instantly
//     const engineOutputs = runAudit(activeStack);
//     setResults(engineOutputs);
    
//     // Calculate totals to forward to backend API proxy
//     const totalMonthlySavings = engineOutputs.reduce((sum, item) => sum + item.monthlySavings, 0);
//     const totalAnnualSavings = engineOutputs.reduce((sum, item) => sum + item.annualSavings, 0);

//     // 2. Fetch the qualitative AI Summary narrative from our backend proxy route
//     setIsLoadingSummary(true);
//     setAiSummary("");
    
//     let generatedSummary = "No AI summary generated."; // Instantiating safe variable scope
    
//     try {
//       const response = await fetch("/api/summary", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           totalMonthlySavings,
//           totalAnnualSavings,
//           recommendations: engineOutputs
//         })
//       });
//       const data = await response.json();
//       if (data.summary) {
//         generatedSummary = data.summary;
//         setAiSummary(generatedSummary);
//       }
//     } catch (err) {
//       console.error("Failed to load summary narrative:", err);
//     } finally {
//       setIsLoadingSummary(false);
//     }

//     // 3. STEP 3 — Save Audit payload securely to Supabase Database Layer
//     try {
//       const saveResponse = await fetch("/api/save-audit", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           stack: activeStack,
//           recommendations: engineOutputs,
//           aiSummary: generatedSummary, // Using the verified variable directly
//           totalMonthlySavings,
//           totalAnnualSavings,
//         }),
//       });

//       const savedAudit = await saveResponse.json();
      
//       if (savedAudit.success && savedAudit.auditId) {
//         console.log("Saved Audit ID successfully captured:", savedAudit.auditId);
//         router.push(`/audit/${savedAudit.auditId}`);
        
//       } else {
//         console.error("Database persistence warning:", savedAudit.error);
//       }
//     } catch (saveErr) {
//       console.error("Failed to post audit payload to backend storage:", saveErr);
//     }
//   };

//   if (!isHydrated) return <div className="mt-20 text-center text-zinc-500 animate-pulse">Loading Stack Parameters...</div>;

//   const overallMonthlySavings = results.reduce((sum, item) => sum + item.monthlySavings, 0);
//   const overallAnnualSavings = results.reduce((sum, item) => sum + item.annualSavings, 0);

//   return (
//     <div className="mt-20 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur-md">
//       <header>
//         <h2 className="text-3xl font-extrabold tracking-tight text-white">Run Your AI Spend Audit</h2>
//         <p className="mt-2 text-zinc-400">Map your operational infrastructure stack to discover overlapping feature redundancies.</p>
//       </header>

//       <div className="mt-8 space-y-6">
//         {activeStack.map((toolInstance, idx) => (
//           <fieldset key={idx} className="relative grid gap-4 rounded-2xl border border-zinc-800 bg-black/40 p-6 md:grid-cols-5 items-end">
//             <legend className="sr-only">Configuration data for tool instance index {idx}</legend>
            
//             <div>
//               <label htmlFor={`tool-name-${idx}`} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">AI Tool Platform</label>
//               <select
//                 id={`tool-name-${idx}`}
//                 value={toolInstance.toolName}
//                 onChange={(e) => handleFieldChange(idx, "toolName", e.target.value)}
//                 className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-all text-sm"
//               >
//                 {AVAILABLE_TOOLS.map((name) => (
//                   <option key={name} value={name}>{name}</option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label htmlFor={`tool-plan-${idx}`} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Current Plan Tier</label>
//               <select
//                 id={`tool-plan-${idx}`}
//                 value={toolInstance.currentPlan}
//                 onChange={(e) => handleFieldChange(idx, "currentPlan", e.target.value)}
//                 className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-all text-sm"
//               >
//                 {PLAN_MATRICES[toolInstance.toolName].map((tierName) => (
//                   <option key={tierName} value={tierName}>{tierName}</option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label htmlFor={`tool-seats-${idx}`} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Seats Deployed</label>
//               <input
//                 id={`tool-seats-${idx}`}
//                 type="number"
//                 min="1"
//                 value={toolInstance.seats}
//                 onChange={(e) => handleFieldChange(idx, "seats", Math.max(1, Number(e.target.value)))}
//                 className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-all text-sm"
//               />
//             </div>

//             <div>
//               <label htmlFor={`tool-spend-${idx}`} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Monthly Bill ($)</label>
//               <input
//                 id={`tool-spend-${idx}`}
//                 type="number"
//                 min="0"
//                 value={toolInstance.monthlySpend}
//                 onChange={(e) => handleFieldChange(idx, "monthlySpend", Math.max(0, Number(e.target.value)))}
//                 className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-all text-sm"
//               />
//             </div>

//             <div className="flex items-center justify-between gap-2 h-[46px]">
//               <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-400">
//                 <input
//                   type="checkbox"
//                   checked={toolInstance.annualBilling}
//                   onChange={(e) => handleFieldChange(idx, "annualBilling", e.target.checked)}
//                   className="rounded border-zinc-700 bg-zinc-950 text-white focus:ring-0 focus:ring-offset-0"
//                 />
//                 Annualized
//               </label>

//               {activeStack.length > 1 && (
//                 <button
//                   type="button"
//                   onClick={() => handleRemoveTool(idx)}
//                   className="rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-400 px-3 py-2 text-xs font-medium transition-all"
//                   aria-label={`Remove ${toolInstance.toolName} configuration`}
//                 >
//                   Delete
//                 </button>
//               )}
//             </div>
//           </fieldset>
//         ))}
//       </div>

//       <div className="mt-6 flex flex-wrap gap-4">
//         <button
//           type="button"
//           onClick={handleAddTool}
//           className="rounded-xl border border-dashed border-zinc-700 hover:border-zinc-500 px-5 py-3 text-sm font-medium text-zinc-300 transition-all bg-zinc-950/20"
//         >
//           + Add Tool to Stack
//         </button>

//         <button
//           type="button"
//           onClick={executeStackAudit}
//           className="rounded-xl bg-gradient-to-r from-zinc-100 to-white hover:opacity-90 px-6 py-3 text-sm font-semibold text-black transition-all shadow-lg"
//         >
//           Generate Optimization Report
//         </button>
//       </div>

//       {results.length > 0 && (
//         <section className="mt-12 space-y-8 border-t border-zinc-800 pt-8 animate-fadeIn">
//           <div className="rounded-3xl bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 p-8 shadow-2xl relative overflow-hidden">
//             <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
//             <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Aggregated Stack Recovery Matrix</h3>
//             <div className="mt-4 grid gap-6 sm:grid-cols-2">
//               <div>
//                 <p className="text-xs font-medium text-zinc-400">Total Monthly Redundant Burn</p>
//                 <p className="mt-2 text-5xl font-black text-white tracking-tight">${overallMonthlySavings.toLocaleString()}</p>
//               </div>
//               <div>
//                 <p className="text-xs font-medium text-zinc-400">Projected Annual Savings Captured</p>
//                 <p className="mt-2 text-5xl font-black text-green-400 tracking-tight">${overallAnnualSavings.toLocaleString()}</p>
//               </div>
//             </div>

//             {overallMonthlySavings >= 500 ? (
//               <div className="mt-6 rounded-2xl bg-green-500/10 border border-green-500/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//                 <p className="text-sm text-green-300 max-w-xl">
//                   <strong>High-Yield Optimization Opportunity Detected:</strong> Your enterprise configuration features profound licensing inefficiencies. Sourcing verified platform assets through **Credex infrastructure credits** would clear these overhead lines immediately.
//                 </p>
//                 <button className="whitespace-nowrap rounded-xl bg-green-400 hover:bg-green-300 text-black px-4 py-2 text-xs font-bold transition-all">
//                   Book Credex Consultation
//                 </button>
//               </div>
//             ) : overallMonthlySavings > 0 && overallMonthlySavings < 100 ? (
//               <div className="mt-6 rounded-2xl bg-zinc-800/60 p-4 text-xs text-zinc-400">
//                 <strong>Honest Assessment Asset:</strong> Your platform overhead footprint metrics line up effectively against active developer allocations.
//               </div>
//             ) : null}
//           </div>

//           {/* AI Personalized Executive Summary Section */}
//           <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
//             <h4 className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-2">
//               <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
//               AI Executive Analysis
//             </h4>
//             {isLoadingSummary ? (
//               <div className="mt-4 space-y-2 animate-pulse">
//                 <div className="h-4 bg-zinc-800 rounded w-full" />
//                 <div className="h-4 bg-zinc-800 rounded w-5/6" />
//                 <div className="h-4 bg-zinc-800 rounded w-2/3" />
//               </div>
//             ) : (
//               <p className="mt-4 text-sm text-zinc-300 leading-relaxed italic">
//                 "{aiSummary || "No narrative evaluation generated for this footprint profile."}"
//               </p>
//             )}
//           </div>

//           <div className="space-y-4">
//             <h4 className="text-lg font-bold text-zinc-300">Detailed Infrastructure Line-Item Recommendations</h4>
//             {results.map((result, index) => (
//               <article key={index} className="rounded-2xl border border-zinc-800 bg-black/40 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
//                 <div className="max-w-2xl">
//                   <div className="flex items-center gap-3">
//                     <h5 className="text-xl font-bold text-white">{result.toolName}</h5>
//                     <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase ${
//                       result.severity === "high" ? "bg-red-500/10 text-red-400 border border-red-500/20" : 
//                       result.severity === "medium" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" : 
//                       "bg-zinc-800 text-zinc-400"
//                     }`}>
//                       {result.severity} Priority
//                     </span>
//                   </div>
//                   <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{result.reasoning}</p>
//                 </div>

//                 <div className="flex flex-wrap gap-4 items-center bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80 min-w-[280px] justify-between md:justify-end">
//                   <div className="text-left md:text-right">
//                     <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Recommended Action</span>
//                     <span className="mt-1 block text-sm font-semibold text-zinc-200">{result.recommendedPlan}</span>
//                   </div>
//                   <div className="w-[1px] h-8 bg-zinc-800 hidden sm:block" />
//                   <div className="text-left md:text-right">
//                     <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Recaptured Margin</span>
//                     <span className="mt-1 block text-lg font-bold text-green-400">${result.monthlySavings}/mo</span>
//                   </div>
//                 </div>
//               </article>
//             ))}
//           </div>
//         </section>
//       )}
//     </div>
//   );
// }