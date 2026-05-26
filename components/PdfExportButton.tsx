"use client";

import { useState } from "react";

interface Recommendation {
  toolName: string;
  currentPlan: string;
  recommendedPlan: string;
  currentMonthlyCost: number;
  optimizedMonthlyCost: number;
  monthlySavings: number;
  annualSavings: number;
  reasoning: string;
  severity: string;
}

interface Props {
  auditId: string;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  recommendations: Recommendation[];
  aiSummary: string;
  teamSize?: number;
  useCase?: string;
}

export default function PdfExportButton({
  auditId,
  totalMonthlySavings,
  totalAnnualSavings,
  recommendations,
  aiSummary,
  teamSize,
  useCase,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      // Dynamically import jsPDF to avoid SSR issues
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // ── Color helpers ──
      const black = () => doc.setTextColor(10, 10, 10);
      const gray = () => doc.setTextColor(100, 100, 100);
      const lightGray = () => doc.setTextColor(150, 150, 150);
      const green = () => doc.setTextColor(34, 197, 94);
      const red = () => doc.setTextColor(239, 68, 68);
      const yellow = () => doc.setTextColor(234, 179, 8);

      const checkNewPage = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // ── Header ──
      doc.setFillColor(8, 8, 8);
      doc.rect(0, 0, pageWidth, 28, "F");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("BURNAUDIT.AI", margin, 12);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text("AI Spend Optimization Report", margin, 20);

      const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      doc.text(dateStr, pageWidth - margin, 20, { align: "right" });
      y = 38;

      // ── Title ──
      black();
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("AI Stack Optimization Report", margin, y);
      y += 8;

      if (teamSize || useCase) {
        lightGray();
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const meta = [teamSize && `${teamSize}-person team`, useCase && `${useCase} use case`].filter(Boolean).join(" · ");
        doc.text(meta, margin, y);
        y += 6;
      }
      y += 4;

      // ── Divider ──
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      // ── Savings hero ──
      doc.setFillColor(248, 250, 248);
      doc.roundedRect(margin, y, contentWidth, 36, 3, 3, "F");

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      gray();
      doc.text("MONTHLY SAVINGS IDENTIFIED", margin + 8, y + 8);
      doc.text("ANNUAL RUNWAY RECOVERED", margin + contentWidth / 2 + 8, y + 8);

      doc.setFontSize(26);
      doc.setFont("helvetica", "bold");
      black();
      doc.text(`$${totalMonthlySavings.toLocaleString()}`, margin + 8, y + 26);
      green();
      doc.text(`$${totalAnnualSavings.toLocaleString()}`, margin + contentWidth / 2 + 8, y + 26);

      // Divider inside box
      doc.setDrawColor(220, 220, 220);
      doc.line(margin + contentWidth / 2, y + 4, margin + contentWidth / 2, y + 32);
      y += 44;

      // ── AI Summary ──
      if (aiSummary) {
        checkNewPage(30);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(139, 92, 246); // purple
        doc.text("AI EXECUTIVE ANALYSIS", margin, y);
        y += 5;

        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        gray();
        const summaryLines = doc.splitTextToSize(`"${aiSummary}"`, contentWidth);
        checkNewPage(summaryLines.length * 5 + 6);
        doc.text(summaryLines, margin, y);
        y += summaryLines.length * 5 + 6;

        doc.setDrawColor(220, 220, 220);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;
      }

      // ── Line items ──
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      black();
      doc.text("Line-Item Breakdown", margin, y);
      y += 8;

      recommendations.forEach((rec) => {
        const reasoningLines = doc.splitTextToSize(rec.reasoning, contentWidth - 32);
        const blockHeight = 28 + reasoningLines.length * 4.5;
        checkNewPage(blockHeight + 4);

        // Card background
        doc.setFillColor(252, 252, 252);
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.2);
        doc.roundedRect(margin, y, contentWidth, blockHeight, 2, 2, "FD");

        // Tool name
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        black();
        doc.text(rec.toolName, margin + 4, y + 8);

        // Severity badge
        const badgeX = margin + 4 + doc.getTextWidth(rec.toolName) + 4;
        if (rec.severity === "high") {
          doc.setFillColor(254, 226, 226);
          red();
        } else if (rec.severity === "medium") {
          doc.setFillColor(254, 249, 195);
          yellow();
        } else {
          doc.setFillColor(243, 244, 246);
          gray();
        }
        doc.roundedRect(badgeX, y + 2, 20, 7, 1, 1, "F");
        doc.setFontSize(6);
        doc.setFont("helvetica", "bold");
        doc.text(rec.severity.toUpperCase(), badgeX + 10, y + 7, { align: "center" });

        // Spend arrow
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        gray();
        doc.text(`$${rec.currentMonthlyCost}/mo`, pageWidth - margin - 48, y + 8);
        lightGray();
        doc.text("→", pageWidth - margin - 28, y + 8);
        green();
        doc.setFont("helvetica", "bold");
        doc.text(`$${rec.optimizedMonthlyCost}/mo`, pageWidth - margin - 22, y + 8);

        // Reasoning
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        gray();
        doc.text(reasoningLines, margin + 4, y + 16);

        // Savings pill
        const pillY = y + blockHeight - 10;
        doc.setFillColor(220, 252, 231);
        doc.roundedRect(pageWidth - margin - 50, pillY - 5, 46, 9, 2, 2, "F");
        green();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(`Saves $${rec.monthlySavings}/mo`, pageWidth - margin - 27, pillY + 1, { align: "center" });

        // Action
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        lightGray();
        doc.text(`Action: ${rec.recommendedPlan}`, margin + 4, pillY + 1);

        y += blockHeight + 4;
      });

      // ── Credex CTA (if high savings) ──
      if (totalMonthlySavings >= 500) {
        checkNewPage(28);
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(134, 239, 172);
        doc.roundedRect(margin, y, contentWidth, 24, 3, 3, "FD");
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        green();
        doc.text("Save more with Credex infrastructure credits", margin + 6, y + 8);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        gray();
        doc.text("Discounted AI licenses sourced from companies that overforecast — 20-40% below retail.", margin + 6, y + 15);
        doc.text("Visit credex.rocks to book a free consultation.", margin + 6, y + 21);
        y += 30;
      }

      // ── Footer ──
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(245, 245, 245);
        doc.rect(0, pageHeight - 12, pageWidth, 12, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        lightGray();
        doc.text("Generated by BurnAudit.AI — Free AI spend auditing", margin, pageHeight - 5);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: "right" });
      }

      doc.save(`burnaudit-report-${auditId.slice(0, 8)}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-white/60 hover:bg-white/[0.08] hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <div className="h-3 w-3 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v7M3 5l3 3 3-3M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Export PDF
        </>
      )}
    </button>
  );
}
