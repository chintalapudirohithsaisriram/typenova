'use client';

import { FINGER_BY_KEY, KEYBOARD_ROWS } from '@/lib/typing-content';

type Props = { targetKey?: string };

export default function VirtualKeyboard({ targetKey = '' }: Props) {
  return (
    <div className="keyboard-wrap" aria-label="Interactive typing keyboard">
      <div className="keyboard">
        {KEYBOARD_ROWS.map((row) => row.map((key) => {
          const active = key === targetKey.toLowerCase();
          return <div key={key} className={`key ${active ? 'key-active' : ''}`} title={`${key.toUpperCase()} · ${FINGER_BY_KEY[key]}`}><span>{key}</span><small>{active ? FINGER_BY_KEY[key] : ''}</small></div>;
        }))}
        <div className={`key space-key ${targetKey === ' ' ? 'key-active' : ''}`}><span>space</span></div>
      </div>
      <div className="finger-legend"><span><i className="dot left" />Left hand</span><span><i className="dot right" />Right hand</span><strong>{targetKey ? `Target: ${targetKey === ' ' ? 'Space' : targetKey.toUpperCase()} · ${FINGER_BY_KEY[targetKey.toLowerCase()] ?? 'mapped finger'}` : 'Select a lesson key to see guidance'}</strong></div>
    </div>
  );
}
