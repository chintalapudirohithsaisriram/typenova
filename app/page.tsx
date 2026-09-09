'use client';
import TypingTest from '@/components/TypingTest';

const nav=['Learn','Practice','Test','Games','Challenges','Stats'];
export default function Home(){return <main>
 <header className="nav"><div className="brand"><span className="brand-mark">T</span><span>TypeNova</span></div><nav>{nav.map(x=><a key={x} href={x==='Test'?'#test':'#'}>{x}</a>)}</nav><button className="ghost">Focus mode</button></header>
 <section className="hero"><div className="hero-copy"><span className="eyebrow">A better way to type</span><h1>Master Your <em>Keyboard.</em></h1><p>Learn to type correctly. Build speed. Improve accuracy. Become faster every day.</p><div className="hero-actions"><a className="primary" href="#test">Start learning</a><a className="secondary" href="#test">Take a typing test <span>↗</span></a></div></div><div className="hero-orbit"><div className="orbit-card"><span>Today</span><strong>12 min</strong><small>practice goal</small></div><div className="key-float k1">A</div><div className="key-float k2">F</div><div className="key-float k3">J</div><div className="key-float k4">;</div></div></section>
 <section className="stats-strip"><div><span>Best WPM</span><strong>—</strong></div><div><span>Accuracy</span><strong>—</strong></div><div><span>Daily streak</span><strong>0 days</strong></div><div><span>Level</span><strong>1 · Starter</strong></div><div><span>XP</span><strong>0 / 100</strong></div></section>
 <section id="test" className="section"><TypingTest /></section>
 <section className="learning"><div><span className="eyebrow">Your first steps</span><h2>Build technique before chasing speed.</h2><p>TypeNova starts with proper finger placement, then gradually turns good habits into effortless speed.</p></div><div className="lesson-grid">{[['01','Home row','Find F & J. Learn your home position.'],['02','Reach & return','Train the top row without looking.'],['03','Accuracy loop','Slow down, spot patterns, repeat.']].map(([n,t,d])=><article key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p><button>Preview lesson →</button></article>)}</div></section>
 <footer><div className="brand"><span className="brand-mark">T</span><span>TypeNova</span></div><span>Learn deliberately. Type confidently.</span></footer>
 </main>}
