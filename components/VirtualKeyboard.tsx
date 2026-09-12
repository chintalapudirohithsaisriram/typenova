'use client';

import { FINGER_BY_KEY, KEYBOARD_ROWS } from '@/lib/typing-content';

type Props = { targetKey?: string; showFingerGuide?: boolean; onKeySelect?: (key: string) => void };

const fingers = [
  { id: 'pinky', label: 'Pinky' },
  { id: 'ring', label: 'Ring' },
  { id: 'middle', label: 'Middle' },
  { id: 'index', label: 'Index' },
];

function fingerNameFor(key: string) {
  return FINGER_BY_KEY[key.toLowerCase()] ?? '';
}

export default function VirtualKeyboard({ targetKey = '', showFingerGuide = true, onKeySelect }: Props) {
  const target = targetKey;
  const lookupTarget = target.toLowerCase();
  const finger = FINGER_BY_KEY[lookupTarget] ?? '';
  const hand = finger.startsWith('left') ? 'Left hand' : finger.startsWith('right') ? 'Right hand' : target === ' ' ? 'Both thumbs' : 'Both hands';
  const fingerName = finger.replace(/^left |^right /, '');
  const isShiftTarget = target !== target.toLowerCase() && target !== target.toUpperCase();
  const displayTarget = target === ' ' ? 'Space' : target ? target.toUpperCase() : '—';

  const selectKey = (key: string) => {
    // When the expected character is uppercase, clicking its physical key should still
    // advance the lesson instead of silently recording a lowercase mismatch.
    onKeySelect?.(key.toLowerCase() === lookupTarget ? target : key);
  };

  return <div className="keyboard-wrap" aria-label="Visual keyboard and finger guide">
    {showFingerGuide && target && <div className="finger-coach" aria-live="polite">
      <div className="coach-visual" aria-hidden="true">
        <div className={`coach-hand ${hand.startsWith('Left') ? 'left-hand' : hand.startsWith('Right') ? 'right-hand' : 'both-hands'}`}>
          <span className="finger-shape pinky" />
          <span className="finger-shape ring" />
          <span className="finger-shape middle" />
          <span className="finger-shape index" />
          <span className="thumb-shape" />
        </div>
        <span className="move-line" />
      </div>
      <div className="finger-coach-copy">
        <div className="coach-kicker">Next keystroke</div>
        <strong>{displayTarget}</strong>
        <span>Use your <b>{finger || 'mapped finger'}</b>.</span>
        <small>{isShiftTarget ? 'Use the opposite pinky for Shift, then press the target key.' : 'Start from home row, move only the shown finger, then return.'}</small>
      </div>
      <div className="finger-lanes" aria-label="Finger zones">{fingers.map((item) => <span key={item.id} className={fingerName.includes(item.id) ? 'finger-lane active' : 'finger-lane'}><i />{item.label}</span>)}</div>
    </div>}

    <div className="keyboard">
      {KEYBOARD_ROWS.map((row, rowIndex) => <div className={`keyboard-row row-${rowIndex + 1}`} key={row.join('')}>{row.map((key) => {
        const active = key.toLowerCase() === lookupTarget;
        const keyFinger = fingerNameFor(key);
        return <button type="button" key={key} className={`key ${active ? 'key-active guide-target' : ''} ${keyFinger.startsWith('left') ? 'key-left' : 'key-right'}`} onMouseDown={(event) => event.preventDefault()} onClick={() => selectKey(key)} aria-label={`${key.toUpperCase()} key${keyFinger ? `, ${keyFinger}` : ''}`} title={`${key.toUpperCase()}${keyFinger ? ` · ${keyFinger}` : ''}`}><span>{key}</span>{showFingerGuide && active && <small>{keyFinger.replace(/^left |^right /, '')}</small>}</button>;
      })}</div>)}
      <div className="shift-row"><button type="button" className="key shift-key" onMouseDown={(event) => event.preventDefault()} onClick={() => onKeySelect?.('Shift')} aria-label="Left Shift key"><span>shift</span><small>left pinky</small></button><button type="button" className={`key space-key ${target === ' ' ? 'key-active guide-target' : ''}`} onMouseDown={(event) => event.preventDefault()} onClick={() => selectKey(' ')} aria-label="Space key"><span>space</span>{showFingerGuide && target === ' ' && <small>thumbs</small>}</button><button type="button" className="key shift-key" onMouseDown={(event) => event.preventDefault()} onClick={() => onKeySelect?.('Shift')} aria-label="Right Shift key"><span>shift</span><small>right pinky</small></button></div>
    </div>
    <div className="finger-legend"><span><i className="dot left" />Left hand</span><span><i className="dot right" />Right hand</span><strong>{target ? `Target: ${displayTarget} · ${finger || 'special key'}` : 'Start typing to see finger guidance'}</strong><span className="hand-callout">{target ? `${hand} · move and return` : 'Home row: A S D F · J K L ;'}</span></div>
    <style jsx>{`
      .finger-coach{position:relative;display:grid;grid-template-columns:150px minmax(180px,1fr) minmax(190px,.9fr);align-items:center;gap:16px;margin-bottom:16px;padding:16px 18px;border:1px solid var(--line);border-radius:18px;background:var(--surface);overflow:hidden;box-shadow:0 10px 28px color-mix(in srgb,var(--ink) 8%,transparent)}
      .coach-visual{height:74px;position:relative;display:grid;place-items:center}.coach-hand{position:relative;width:76px;height:48px;padding:0 8px 8px;display:flex;align-items:flex-end;justify-content:center;gap:3px;border-radius:14px 14px 20px 20px;background:color-mix(in srgb,var(--accent) 38%,var(--surface));border:1px solid var(--accent-strong);transform:rotate(-5deg)}.right-hand{transform:scaleX(-1) rotate(-5deg)}.both-hands{width:90px}.finger-shape{width:10px;border:1px solid var(--accent-strong);background:var(--accent);border-radius:9px 9px 4px 4px;transform-origin:bottom}.finger-shape.pinky{height:25px}.finger-shape.ring{height:35px}.finger-shape.middle{height:40px}.finger-shape.index{height:37px}.thumb-shape{position:absolute;width:24px;height:12px;bottom:4px;left:7px;border:1px solid var(--accent-strong);background:var(--accent);border-radius:10px;transform:rotate(32deg)}.move-line{position:absolute;width:68px;height:18px;right:0;top:12px;border-top:2px dashed var(--accent-strong);border-radius:50%;animation:moveHint 1.15s ease-in-out infinite}.move-line:after{content:'›';position:absolute;right:-2px;top:-13px;font-size:20px;font-weight:900;color:var(--accent-strong)}
      .finger-coach-copy{display:grid;gap:2px;position:relative;z-index:1}.coach-kicker{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);font-weight:800}.finger-coach-copy strong{font-family:var(--mono);font-size:25px;line-height:1.1}.finger-coach-copy span{font-size:13px}.finger-coach-copy small{color:var(--muted);font-size:11px;line-height:1.4}.finger-lanes{display:grid;grid-template-columns:1fr 1fr;gap:6px}.finger-lane{display:flex;align-items:center;gap:7px;padding:7px 8px;border:1px solid var(--line);border-radius:9px;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.04em}.finger-lane i{width:8px;height:8px;border-radius:50%;background:var(--line);transition:transform .2s ease,background .2s ease}.finger-lane.active{color:var(--ink);font-weight:900;border-color:var(--accent-strong);background:color-mix(in srgb,var(--accent) 13%,var(--surface))}.finger-lane.active i{background:var(--accent-strong);transform:scale(1.5)}
      .guide-target{animation:keyGuidePulse 1s ease-in-out infinite}.shift-row{display:grid;grid-template-columns:1.5fr 3fr 1.5fr;gap:6px}.shift-key{min-height:45px}.space-key{width:100%;margin:0}.keyboard-row .key-left{}.keyboard-row .key-right{}
      @keyframes moveHint{0%,100%{transform:translateX(0);opacity:.45}50%{transform:translateX(12px);opacity:1}}@keyframes keyGuidePulse{0%,100%{transform:translateY(-2px) scale(1)}50%{transform:translateY(-5px) scale(1.05);box-shadow:0 0 0 5px color-mix(in srgb,var(--accent) 24%,transparent),0 6px 0 color-mix(in srgb,var(--accent-strong) 30%,transparent)}}
      @media(max-width:820px){.finger-coach{grid-template-columns:110px 1fr}.finger-lanes{grid-column:1/-1}.coach-visual{height:64px}.finger-coach-copy small{display:none}}
      @media(max-width:620px){.finger-coach{grid-template-columns:82px 1fr;gap:10px;padding:12px}.coach-visual{transform:scale(.82);transform-origin:left center}.finger-lanes{display:none}.finger-coach-copy strong{font-size:20px}.shift-row{grid-template-columns:1fr 2.5fr 1fr}.shift-key small{display:none}}
    `}</style>
  </div>;
}
