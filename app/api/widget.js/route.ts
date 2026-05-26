import { NextRequest, NextResponse } from "next/server";

// Embeddable widget script
// Usage: <script src="https://burnaudit.ai/api/widget.js" data-theme="dark"></script>
// This injects a floating "Audit My AI Stack" button that opens the audit in a modal iframe

export async function GET(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://burnaudit.ai";

  const script = `
(function() {
  if (window.__burnauditLoaded) return;
  window.__burnauditLoaded = true;

  var theme = document.currentScript ? document.currentScript.getAttribute('data-theme') : 'dark';
  var isDark = theme !== 'light';

  // Inject styles
  var style = document.createElement('style');
  style.textContent = [
    '#burnaudit-btn{position:fixed;bottom:24px;right:24px;z-index:999999;display:flex;align-items:center;gap:8px;',
    'padding:12px 20px;border-radius:14px;font-family:-apple-system,sans-serif;font-size:13px;font-weight:700;',
    'cursor:pointer;border:none;box-shadow:0 8px 32px rgba(0,0,0,0.3);transition:all 0.2s;',
    isDark ? 'background:#fff;color:#000;' : 'background:#0a0a0a;color:#fff;',
    '}',
    '#burnaudit-btn:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,0,0,0.4);}',
    '#burnaudit-modal{display:none;position:fixed;inset:0;z-index:1000000;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);}',
    '#burnaudit-modal.open{display:flex;align-items:center;justify-content:center;}',
    '#burnaudit-frame-wrap{position:relative;width:min(900px,95vw);height:min(700px,90vh);border-radius:20px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.6);}',
    '#burnaudit-iframe{width:100%;height:100%;border:none;}',
    '#burnaudit-close{position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.1);',
    'color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:10;font-family:sans-serif;}',
    '#burnaudit-close:hover{background:rgba(0,0,0,0.8);}',
  ].join('');
  document.head.appendChild(style);

  // Button
  var btn = document.createElement('button');
  btn.id = 'burnaudit-btn';
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="currentColor" stroke-width="1.5"/><path d="M7 5V7M7 9V9.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> Audit AI Spend';
  document.body.appendChild(btn);

  // Modal
  var modal = document.createElement('div');
  modal.id = 'burnaudit-modal';
  modal.innerHTML = '<div id="burnaudit-frame-wrap"><button id="burnaudit-close">×</button><iframe id="burnaudit-iframe" src="${siteUrl}?embed=1" title="BurnAudit AI — Audit your AI spend"></iframe></div>';
  document.body.appendChild(modal);

  btn.addEventListener('click', function() { modal.classList.add('open'); });
  document.getElementById('burnaudit-close').addEventListener('click', function() { modal.classList.remove('open'); });
  modal.addEventListener('click', function(e) { if (e.target === modal) modal.classList.remove('open'); });

  // Listen for audit completion message from iframe
  window.addEventListener('message', function(e) {
    if (e.origin !== '${siteUrl}') return;
    if (e.data && e.data.type === 'burnaudit:complete') {
      // Widget host can listen for this event
      window.dispatchEvent(new CustomEvent('burnaudit:complete', { detail: e.data.payload }));
    }
  });
})();
`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}