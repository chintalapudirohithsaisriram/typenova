'use client';

import { FINGER_BY_KEY, KEYBOARD_ROWS } from '@/lib/typing-content';

type Props = { targetKey?: string; showFingerGuide?: boolean; onKeySelect?: (key: string) => void };

const fingerLabels = ['pinky', 'ring', 'middle', 'index'];

export default function VirtualKeyboard({ targetKey = '', showFingerGuide = true, onKeySelect }: Props) {
  const target = targetKey.toLowerCase();
  const finger = FINGER_BY_KEY[target] ?? (target === 'shift' ? 'opposite-hand pinky' : target ? 'mapped finger' : '');
  const hand = finger.startsWith('left') ? 'Left hand' : finger.startsWith('right') ? 'Right hand' : target === ' ' ? 'Both thumbs' : 'Both hands';
  const fingerName = finger.replace(/^left |^right |^opposite-hand /, '');

  return <div className="keyboard-wrap" aria-label="Visual keyboard and finger guide">
    {showFingerGuide && target && <div className="finger-coach" aria-live="polite">
      <div className={`coach-hand ${hand.toLowerCase().startsWith('left') ? 'left-hand' : hand.toLowerCase().startsWith('right') ? 'right-hand' : 'both-hands'}`}>
        <div className="hand-palm"><span>✋</span></div>
        <div className="finger-pills">{fingerLabels.map((item) => <span key={item} className={fingerName.includes(item) ? 'finger-pill active' : 'finger-pill'}>{item}</span>)}</div>
      </div>
      <div className="finger-coach-copy"><strong>Press {target === ' ' ? 'Space' : target.toUpperCase()}</strong><span>Use your <b>{finger}</b>.</span><small>Keep the other fingers resting on the home row.</small></div>
      <div className="coach-pulse" aria-hidden="true" />
    </div>}
    <div className="keyboard">
      {KEYBOARD_ROWS.map((row, rowIndex) => <div className={`keyboard-row row-${rowIndex + 1}`} key={row.join('')}>{row.map((key) => {
        const active = key === target;
        const keyFinger = FINGER_BY_KEY[key] ?? '';
        return <button type="button" key={key} className={`key ${active ? 'key-active guide-target' : ''} ${keyFinger.startsWith('left') ? 'key-left' : 'key-right'}`} onMouseDown={(event) => event.preventDefault()} onClick={() => onKeySelect?.(key)} aria-label={`${key.toUpperCase()} key, ${keyFinger}`} title={`${key.toUpperCase()} · ${keyFinger}`}><span>{key}</span>{showFingerGuide && active && <small>{keyFinger}</small>}</button>;
      })}</div>)}
      <button type="button" className={`key space-key ${target === ' ' ? 'key-active guide-target' : ''}`} onMouseDown={(event) => event.preventDefault()} onClick={() => onKeySelect?.(' ')} aria-label="Space key"><span>space</span>{showFingerGuide && target === ' ' && <small>thumbs</small>}</button>
    </div>
    <div className="finger-legend"><span><i className="dot left" />Left hand</span><span><i className="dot right" />Right hand</span><strong>{target ? `Target: ${target === ' ' ? 'Space' : target.toUpperCase()} · ${finger}` : 'Start typing to see finger guidance'}</strong><span className="hand-callout">{target ? `${hand} · ${finger}` : 'Home row: A S D F · J K L ;'}</span></div>
    <style jsx>{`
      .finger-coach{position:relative;display:flex;align-items:center;gap:16px;margin-bottom:16px;padding:14px 16px;border:1px solid var(--line);border-radius:16px;background:var(--surface);overflow:hidden}
      .coach-hand{display:flex;align-items:center;gap:8px;min-width:170px}.hand-palm{width:48px;height:48px;display:grid;place-items:center;border-radius:14px;background:var(--surface-2);font-size:25px}.left-hand .hand-palm{transform:scaleX(-1)}
      .finger-pills{display:grid;gap:3px}.finger-pill{font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}.finger-pill.active{color:var(--ink);font-weight:900;transform:translateX(4px)}
      .finger-coach-copy{display:grid;gap:2px;position:relative;z-index:1}.finger-coach-copy strong{font-family:var(--mono);font-size:15px}.finger-coach-copy span{font-size:13px}.finger-coach-copy small{color:var(--muted);font-size:11px}.coach-pulse{position:absolute;width:90px;height:90px;border-radius:50%;right:10%;border:2px solid color-mix(in srgb,var(--accent-strong) 45%,transparent);animation:guidePulse 1.5s ease-out infinite}
      .guide-target{animation:keyGuidePulse 1s ease-in-out infinite}
      @keyframes guidePulse{0%{transform:scale(.7);opacity:.8}70%{transform:scale(1.35);opacity:0}100%{opacity:0}}
      @keyframes keyGuidePulse{0%,100%{transform:translateY(-2px) scale(1)}50%{transform:translateY(-4px) scale(1.05)}}
      @media(max-width:620px){.finger-coach{align-items:flex-start}.coach-hand{min-width:130px}.finger-coach-copy small{display:none}.coach-pulse{right:-5%}}
    `}</style>
  </div>;
}
