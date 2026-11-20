/**
 * Premium UX layer: theme, reveal-on-scroll, section transitions,
 * animated KPI counters, chart polish and loading skeletons.
 * Purely presentational — never calls or alters business logic.
 */
import { animate } from 'motion';
import Chart from 'chart.js/auto';

const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => reduceMQ.matches;
const THEME_KEY = 'se-theme';

/* ---------------- Theme ---------------- */
const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

function isDark() { return document.documentElement.classList.contains('dark'); }

function applyChartTheme() {
  const dark = isDark();
  const ink = dark ? '#b7c3da' : '#3d4a5e';
  const grid = dark ? 'rgba(148,178,230,.10)' : 'rgba(0,24,58,.06)';
  Chart.defaults.color = ink;
  Chart.defaults.borderColor = grid;
  Chart.defaults.font.family = "'IBM Plex Sans Arabic','Cairo',sans-serif";
  Chart.defaults.animation = reduced() ? false : { duration: 900, easing: 'easeOutQuart' };
  if (Chart.defaults.plugins?.tooltip) {
    Object.assign(Chart.defaults.plugins.tooltip, {
      backgroundColor: dark ? 'rgba(13,24,48,.95)' : 'rgba(0,24,58,.92)',
      padding: 10, cornerRadius: 10, titleFont: { weight: 'bold' }, boxPadding: 4,
    });
  }
  Object.values(Chart.instances).forEach((c: any) => {
    try {
      Object.values(c.options.scales || {}).forEach((s: any) => {
        if (s.ticks) s.ticks.color = ink;
        if (s.grid) s.grid.color = grid;
      });
      if (c.options.plugins?.legend?.labels) c.options.plugins.legend.labels.color = ink;
      c.update('none');
    } catch { /* ignore */ }
  });
}

function setTheme(dark: boolean, btn?: HTMLElement) {
  document.documentElement.classList.toggle('dark', dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#060e1f' : '#001F5E');
  try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch { /* */ }
  if (btn) {
    btn.innerHTML = dark ? SUN : MOON;
    btn.setAttribute('aria-label', dark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن');
    btn.title = btn.getAttribute('aria-label')!;
  }
  applyChartTheme();
  window.dispatchEvent(new CustomEvent('se-theme-changed', { detail: { dark } }));
}

function initTheme() {
  let stored: string | null = null;
  try { stored = localStorage.getItem(THEME_KEY); } catch { /* */ }
  const dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  const btn = document.createElement('button');
  btn.id = 'pmThemeToggle';
  btn.type = 'button';
  btn.addEventListener('click', () => {
    setTheme(!isDark(), btn);
  });
  document.body.appendChild(btn);
  setTheme(dark, btn);
}

/* ---------------- Counters ---------------- */
const counted = new WeakMap<Element, string>();
const running = new WeakSet<Element>();
function animateCounter(el: HTMLElement) {
  if (running.has(el)) return;
  const raw = (el.textContent || '').trim();
  if (counted.get(el) === raw) return;
  const m = raw.match(/^([^\d-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/);
  if (!m) return;
  const target = parseFloat(m[2].replace(/,/g, ''));
  counted.set(el, raw);
  if (!isFinite(target) || reduced() || target === 0) return;
  const decimals = (m[2].split('.')[1] || '').length;
  running.add(el);
  const fmt = (v: number) => m[1] + (m[2].includes(',') ? v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : v.toFixed(decimals)) + m[3];
  animate(0, target, {
    duration: Math.min(1.4, 0.6 + Math.log10(Math.abs(target) + 1) * 0.25),
    ease: [0.22, 1, 0.36, 1],
    onUpdate: (v) => { el.textContent = fmt(v); },
    onComplete: () => { el.textContent = raw; counted.set(el, raw); running.delete(el); },
  });
}

/* ---------------- Reveal on scroll ---------------- */
let io: IntersectionObserver | null = null;
function revealTargets(root: ParentNode) {
  if (reduced() || !io) return;
  const els = root.querySelectorAll<HTMLElement>(
    'section .rounded-2xl.bg-white:not(.pm-seen)'
  );
  let i = 0;
  els.forEach((el) => {
    if (
      el.classList.contains('pm-seen') ||
      el.closest('[id$="Modal"]') ||
      el.closest('#dashKpiGrid') ||
      el.closest('#sec_dashboard') ||
      el.tagName === 'CANVAS'
    ) {
      return;
    }
    el.classList.add('pm-seen', 'pm-reveal');
    el.style.setProperty('--pm-delay', `${Math.min(i++, 8) * 45}ms`);
    io!.observe(el);
  });
}

function initReveal() {
  if (reduced() || !('IntersectionObserver' in window)) return;
  io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('pm-in');
      io!.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
}

/* ---------------- Section transitions ---------------- */
function playEnter(el: HTMLElement) {
  if (reduced()) return;
  el.classList.remove('pm-enter');
  void el.offsetWidth;
  el.classList.add('pm-enter');
}

/* ---------------- Card spotlight ---------------- */
function initSpotlight() {
  if (reduced()) return;
  document.addEventListener('pointermove', (e) => {
    const card = (e.target as HTMLElement)?.closest?.('.rounded-2xl.bg-white[onclick]') as HTMLElement | null;
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });
}

/* ---------------- Observers ---------------- */
function scan(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('#dashKpiGrid .text-2xl.font-black, #staffTableCount, #staffTableBannerCount').forEach(animateCounter);
  revealTargets(root);
}

export function initPremiumUX(): () => void {
  initTheme();
  initReveal();
  initSpotlight();

  let raf = 0;
  const pending = new Set<ParentNode>();
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      const t = m.target as HTMLElement;
      if (m.type === 'attributes' && m.attributeName === 'class') {
        const old = m.oldValue || '';
        if (old.split(/\s+/).includes('hidden') && !t.classList.contains('hidden')
            && (/^(sec_|.*View$)/.test(t.id))) playEnter(t);
      } else if (m.type === 'childList' && m.addedNodes.length) {
        pending.add(t);
      } else if (m.type === 'characterData' && t.parentElement) {
        pending.add(t.parentElement);
      }
    }
    if (pending.size && !raf) {
      raf = requestAnimationFrame(() => {
        raf = 0;
        pending.forEach((n) => { if ((n as HTMLElement).isConnected !== false) scan(n.parentNode || n); });
        pending.clear();
      });
    }
  });
  mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  scan(document);

  const onMotion = () => applyChartTheme();
  reduceMQ.addEventListener?.('change', onMotion);

  return () => {
    mo.disconnect();
    io?.disconnect();
    reduceMQ.removeEventListener?.('change', onMotion);
    document.getElementById('pmThemeToggle')?.remove();
  };
}

/* Apply theme ASAP to avoid flash before React mounts */
try {
  const s = localStorage.getItem(THEME_KEY);
  if (s ? s === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark');
} catch { /* */ }
