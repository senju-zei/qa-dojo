import { useEffect, useRef, useState } from 'react';

export type Route = { name: 'home' } | { name: 'room'; roomId: string; taskIndex: number };

function parseHash(hash: string): Route {
  const m = hash.match(/^#\/room\/([\w-]+)(?:\/(\d+))?/);
  if (m) return { name: 'room', roomId: m[1], taskIndex: Math.max(0, Number(m[2] ?? 1) - 1) };
  return { name: 'home' };
}

export function routeToHash(r: Route) {
  return r.name === 'home' ? '#/' : `#/room/${r.roomId}/${r.taskIndex + 1}`;
}

export function useHashRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const navigate = (r: Route) => {
    const h = routeToHash(r);
    if (window.location.hash !== h) window.location.hash = h;
    else setRoute(r);
  };
  return [route, navigate];
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Animated number that eases from its previous value to the new one. */
export function useCountUp(target: number, ms = 700) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = from.current;
    if (start === target || prefersReducedMotion()) {
      from.current = target;
      setValue(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = Math.round(start + (target - start) * eased);
      setValue(v);
      from.current = v;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

export function isTypingTarget(t: EventTarget | null) {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable) return true;
  if (t instanceof HTMLInputElement) return !['radio', 'checkbox', 'range', 'button'].includes(t.type);
  return t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement;
}

export const safeStorage = (): Storage | undefined => {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

/** Tiny inline formatter: **bold**, *em*, `code`. */
export function richSegments(text: string): { t: 'text' | 'b' | 'em' | 'code'; v: string }[] {
  const out: { t: 'text' | 'b' | 'em' | 'code'; v: string }[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push({ t: 'text', v: text.slice(last, m.index) });
    const s = m[0];
    if (s.startsWith('**')) out.push({ t: 'b', v: s.slice(2, -2) });
    else if (s.startsWith('`')) out.push({ t: 'code', v: s.slice(1, -1) });
    else out.push({ t: 'em', v: s.slice(1, -1) });
    last = m.index! + s.length;
  }
  if (last < text.length) out.push({ t: 'text', v: text.slice(last) });
  return out;
}
