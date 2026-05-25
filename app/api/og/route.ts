import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const monthly = Number(searchParams.get("monthly") ?? 0);
  const annual = Number(searchParams.get("annual") ?? 0);

  const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#080808"/>
  
  <!-- Grid pattern -->
  <defs>
    <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
      <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#grid)"/>
  
  <!-- Green glow -->
  <ellipse cx="900" cy="200" rx="400" ry="300" fill="rgba(74,222,128,0.04)"/>
  
  <!-- Logo -->
  <rect x="60" y="50" width="32" height="32" rx="8" fill="white"/>
  <rect x="68" y="58" width="16" height="16" rx="4" fill="#080808"/>
  <text x="106" y="73" font-family="-apple-system, sans-serif" font-size="16" font-weight="900" fill="white" letter-spacing="-0.5">BURNAUDIT</text>
  <text x="234" y="73" font-family="-apple-system, sans-serif" font-size="16" font-weight="900" fill="rgba(255,255,255,0.3)">.AI</text>
  
  <!-- Label -->
  <text x="60" y="160" font-family="-apple-system, sans-serif" font-size="13" font-weight="700" fill="rgba(255,255,255,0.3)" letter-spacing="3">AI SPEND AUDIT REPORT</text>
  
  <!-- Monthly savings -->
  <text x="60" y="240" font-family="-apple-system, sans-serif" font-size="14" fill="rgba(255,255,255,0.4)">Monthly savings identified</text>
  <text x="60" y="340" font-family="-apple-system, sans-serif" font-size="120" font-weight="900" fill="white" letter-spacing="-6">$${monthly.toLocaleString()}</text>
  
  <!-- Annual savings -->
  <text x="60" y="410" font-family="-apple-system, sans-serif" font-size="14" fill="rgba(255,255,255,0.4)">Annual runway recovered</text>
  <text x="60" y="500" font-family="-apple-system, sans-serif" font-size="80" font-weight="900" fill="#4ade80" letter-spacing="-4">$${annual.toLocaleString()}/yr</text>
  
  <!-- CTA -->
  <rect x="60" y="545" width="280" height="44" rx="12" fill="white"/>
  <text x="200" y="573" font-family="-apple-system, sans-serif" font-size="14" font-weight="700" fill="black" text-anchor="middle">Run your free audit →</text>
  
  <!-- URL -->
  <text x="1140" y="600" font-family="-apple-system, sans-serif" font-size="13" fill="rgba(255,255,255,0.2)" text-anchor="end">burnaudit.ai</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}