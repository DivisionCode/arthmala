// Privacy-first analytics loader.
// Activates when an env var is set — otherwise completely no-ops in dev and prod.
//
//   VITE_PLAUSIBLE_DOMAIN=arthmala.com                   → loads Plausible
//   VITE_PLAUSIBLE_SRC=https://plausible.io/js/script.js  → optional self-host
//   VITE_GA_ID=G-XXXXXXXXXX                               → loads GA4
//
// Set only one. Plausible is preferred for a niche brand (lighter, privacy-friendly,
// cleaner investor-deck screenshots). If both are set, Plausible wins.

let installed = false;

function loadScript(src, attrs = {}) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement('script');
  s.src = src;
  s.defer = true;
  for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
  document.head.appendChild(s);
}

function installPlausible() {
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
  if (!domain) return false;
  const src =
    import.meta.env.VITE_PLAUSIBLE_SRC || 'https://plausible.io/js/script.js';
  loadScript(src, { 'data-domain': domain });
  return true;
}

function installGA4() {
  const id = import.meta.env.VITE_GA_ID;
  if (!id) return false;
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${id}`);
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', id, { anonymize_ip: true });
  return true;
}

export function installAnalytics() {
  if (installed) return;
  if (typeof window === 'undefined') return;
  if (installPlausible()) {
    installed = true;
    return;
  }
  if (installGA4()) {
    installed = true;
  }
}

/**
 * Track a SPA route change. Plausible auto-tracks pageviews; GA4 needs a manual
 * config call on navigation. Safe to call when analytics isn't configured.
 */
export function trackPageView(path) {
  if (typeof window === 'undefined') return;
  const gaId = import.meta.env.VITE_GA_ID;
  if (gaId && typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', { page_path: path });
  }
  // Plausible's default script handles SPA navigation automatically.
}
