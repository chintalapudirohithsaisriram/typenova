'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="empty-state" style={{ maxWidth: 720, margin: '12vh auto' }}><span className="eyebrow">TypeNova hit a snag</span><h1 style={{ fontSize: 'clamp(38px,6vw,64px)' }}>Your progress is safe. This screen can recover.</h1><p>Reload the current experience and try again. If the problem repeats, check the browser console before continuing.</p><button className="primary" onClick={() => reset()}>Try again</button></main>;
}
