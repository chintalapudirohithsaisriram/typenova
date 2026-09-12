'use client';

import { FINGER_BY_KEY, KEYBOARD_ROWS } from '@/lib/typing-content';

type Props = { targetKey?: string; showFingerGuide?: boolean; onKeySelect?: (key: string) => void };

export default function VirtualKeyboard({ targetKey = '', showFingerGuide = true, onKeySelect }: Props) {
  const target = targetKey.toLowerCase();
  const finger = FINGER_BY_KEY[target] ?? (target === 'shift' ? 'opposite-hand pinky' : 'mapped finger');
  const hand = finger.startsWith('left') ? 'Left hand' : finger.startsWith('right') ? 'Right hand' : 'Both hands';
  return <div className="keyboard-wrap" aria-label="Visual keyboard and finger guide"><div className="keyboard">
    {KEYBOARD_ROWS.map((row, rowIndex) => <div className={`keyboard-row row-${rowIndex + 1}`} key={row.join('')}>{row.map((key) => { const active = key === target; const keyFinger = FINGER_BY_KEY[key] ?? ''; return <button type="button" key={key} className={`key ${active ? 'key-active' : ''} ${keyFinger.startsWith('left') ? 'key-left' : 'key-right'}`} onMouseDown={(event) => event.preventDefault()} onClick={() => onKeySelect?.(key)} aria-label={`${key.toUpperCase()} key, ${keyFinger}`} title={`${key.toUpperCase()} · ${keyFinger}`}><span>{key}</span>{showFingerGuide && active && <small>{keyFinger}</small>}</button>; })}</div>)}
    <button type="button" className={`key space-key ${target === ' ' ? 'key-active' : ''}`} onMouseDown={(event) => event.preventDefault()} onClick={() => onKeySelect?.(' ')} aria-label="Space key"><span>space</span>{showFingerGuide && target === ' ' && <small>thumbs</small>}</button>
  </div><div className="finger-legend"><span><i className="dot left" />Left hand</span><span><i className="dot right" />Right hand</span><strong>{target ? `Target: ${target === ' ' ? 'Space' : target.toUpperCase()} · ${finger}` : 'Choose a key to see guidance'}</strong><span className="hand-callout">{target ? `${hand} · ${finger}` : 'Physical keyboard first'}</span></div></div>;
}
