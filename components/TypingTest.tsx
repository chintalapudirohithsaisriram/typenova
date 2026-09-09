'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { calculateStats } from '@/lib/typing';

const TEXT='Build calm confidence one keystroke at a time. Accuracy comes first, then speed follows naturally.';
const DURATIONS=[15,30,60,120,300];
export default function TypingTest(){
 const [duration,setDuration]=useState(30),[value,setValue]=useState(''),[running,setRunning]=useState(false),[startedAt,setStartedAt]=useState<number|null>(null),[elapsed,setElapsed]=useState(0),[done,setDone]=useState(false);
 const inputRef=useRef<HTMLInputElement>(null);
 const stats=useMemo(()=>calculateStats([...value].filter((c,i)=>c===TEXT[i]).length,[...value].filter((c,i)=>c!==TEXT[i]).length,Math.max(elapsed,1)),[value,elapsed]);
 useEffect(()=>{ if(!running)return; const id=setInterval(()=>{const ms=Date.now()-(startedAt??Date.now());setElapsed(ms);if(ms>=duration*1000){setRunning(false);setDone(true);}},100);return()=>clearInterval(id)},[running,startedAt,duration]);
 function start(){setValue('');setElapsed(0);setDone(false);setStartedAt(Date.now());setRunning(true);requestAnimationFrame(()=>inputRef.current?.focus())}
 function onChange(next:string){if(done)return; if(!running){setStartedAt(Date.now());setRunning(true)} setValue(next.slice(0,TEXT.length)); if(next.length>=TEXT.length){setRunning(false);setDone(true)}}
 return <section className="test-card">
  <div className="test-top"><div><span className="eyebrow">Typing test</span><h2>Find your flow.</h2></div><div className="duration-row">{DURATIONS.map(d=><button key={d} className={duration===d?'chip active':'chip'} onClick={()=>{setDuration(d);start()}}>{d<60?`${d}s`:`${d/60}m`}</button>)}</div></div>
  <div className="metrics"><div><strong>{Math.round(stats.netWpm)}</strong><span>WPM</span></div><div><strong>{Math.round(stats.accuracy)}%</strong><span>Accuracy</span></div><div><strong>{stats.errors}</strong><span>Errors</span></div><div><strong>{(elapsed/1000).toFixed(1)}s</strong><span>Time</span></div></div>
  <div className="prompt" aria-label="Typing text">{[...TEXT].map((c,i)=><span key={i} className={i<value.length?(value[i]===c?'correct':'incorrect'):i===value.length?'current':''}>{c}</span>)}</div>
  <input ref={inputRef} className="typing-input" value={value} onChange={e=>onChange(e.target.value)} aria-label="Type the text above" autoComplete="off" spellCheck={false} />
  <div className="test-actions"><button className="primary" onClick={start}>{done?'Retry test':'Start typing'}</button><span>{running?'Live scoring':'Click start or begin typing'}</span></div>
 </section>
}
