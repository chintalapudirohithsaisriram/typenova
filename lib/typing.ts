export type TypingStats = { elapsedMs:number; correct:number; incorrect:number; typed:number; grossWpm:number; netWpm:number; accuracy:number; errors:number };
export function calculateWpm(correct:number, elapsedMs:number):number { if (elapsedMs<=0) return 0; return (correct/5)/(elapsedMs/60000); }
export function calculateStats(correct:number, incorrect:number, elapsedMs:number):TypingStats {
  const typed=correct+incorrect; const grossWpm=calculateWpm(typed,elapsedMs); const netWpm=Math.max(0,grossWpm-(incorrect/5)/(elapsedMs/60000||1));
  return {elapsedMs,correct,incorrect,typed,grossWpm,netWpm,accuracy:typed?correct/typed*100:100,errors:incorrect};
}
