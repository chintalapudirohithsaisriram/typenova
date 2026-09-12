'use client';

import type { SessionPoint } from '@/lib/profile';

type Props = { sessions: SessionPoint[]; metric: 'wpm' | 'accuracy' | 'consistency' | 'time'; label: string; unit?: string };

export default function StatsChart({ sessions, metric, label, unit = '' }: Props) {
  const values = sessions.map((item) => metric === 'wpm' ? item.wpm : metric === 'accuracy' ? item.accuracy : metric === 'consistency' ? item.consistency : item.durationMs / 60_000);
  if (!values.length) return <div className="chart-empty">Complete a test to build your {label.toLowerCase()} history.</div>;
  const width = 720;
  const height = 220;
  const min = metric === 'accuracy' || metric === 'consistency' ? Math.max(0, Math.floor(Math.min(...values) - 2)) : Math.max(0, Math.floor(Math.min(...values) * 0.85));
  const max = metric === 'accuracy' || metric === 'consistency' ? 100 : Math.max(min + 1, Math.ceil(Math.max(...values) * 1.1));
  const range = Math.max(1, max - min);
  const points = values.map((value, index) => `${(index / Math.max(1, values.length - 1)) * width},${height - 24 - ((value - min) / range) * (height - 48)}`).join(' ');
  const latest = values[values.length - 1];
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return <div className="chart" role="img" aria-label={`${label} history. Latest ${latest.toFixed(1)}${unit}. Average ${average.toFixed(1)}${unit}.`}>
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" y1="196" x2="720" y2="196" className="chart-axis" />
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <div className="chart-labels"><span>Older</span><strong>{latest.toFixed(1)}{unit} latest · {average.toFixed(1)}{unit} avg</strong><span>Recent</span></div>
  </div>;
}
