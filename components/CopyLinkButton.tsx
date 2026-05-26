"use client";

import { useState } from "react";

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className={`w-full rounded-xl border py-2 text-xs font-bold transition-all ${
        copied
          ? "border-green-500/30 bg-green-500/10 text-green-400"
          : "border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"
      }`}
    >
      {copied ? "✓ Copied!" : "Copy Link"}
    </button>
  );
}
