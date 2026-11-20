type P = { size?: number };
const base = (size = 16) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true });

export const Mark = ({ size = 16 }: P) => (
  <svg {...base(size)} strokeWidth={3} stroke="var(--accent)"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const Spark = ({ size }: P) => (
  <svg {...base(size)}><path d="M12 3c1 4 3 6 7 7-4 1-6 3-7 8-1-5-3-7-7-8 4-1 6-3 7-7z" fill="currentColor" stroke="none" /></svg>
);
export const Search = ({ size }: P) => (
  <svg {...base(size)}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
);
export const FocusIcon = ({ size }: P) => (
  <svg {...base(size)}><path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4" /></svg>
);
export const Check = ({ size }: P) => (
  <svg {...base(size)} strokeWidth={3}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const Bulb = ({ size }: P) => (
  <svg {...base(size)}><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z" /></svg>
);
export const Arrow = ({ size }: P) => (
  <svg {...base(size)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const Up = ({ size = 14 }: P) => (
  <svg {...base(size)}><path d="M6 15l6-6 6 6" /></svg>
);
export const Down = ({ size = 14 }: P) => (
  <svg {...base(size)}><path d="M6 9l6 6 6-6" /></svg>
);
export const Lock = ({ size = 14 }: P) => (
  <svg {...base(size)}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>
);
export const Reset = ({ size = 14 }: P) => (
  <svg {...base(size)}><path d="M4 4v6h6" /><path d="M5.5 15a7 7 0 101.6-7.3L4 10" /></svg>
);
