import { richSegments } from '../hooks';

export function Rich({ text }: { text: string }) {
  return (
    <>
      {richSegments(text).map((s, i) =>
        s.t === 'b' ? <strong key={i}>{s.v}</strong> : s.t === 'em' ? <em key={i}>{s.v}</em> : s.t === 'code' ? <code key={i}>{s.v}</code> : <span key={i}>{s.v}</span>,
      )}
    </>
  );
}
