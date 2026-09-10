// Moving progress between her phone and her computer, and putting two copies
// of it back together.
import { progress, setProgress, lifetime, saveProgress } from './store.js';

/** Two phones, one word: keep the further-along schedule and lose nothing else.
 *  Taking the newer record whole used to drop a bookmark the newer side had
 *  never set - and `seen` counts days, so two phones used on the same day were
 *  a tie that the incoming record always lost. */
export function merge(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const mine = out[k];
    if (!mine) { out[k] = v; continue; }
    const seen = (p) => p.seen ?? 0;
    const done = (p) => lifetime(p) + (p.lapses ?? 0);
    // The schedule belongs to whichever was touched last; on the same day, to
    // whichever has been through more. Field by field, so the loser's own
    // fields survive where the winner simply never wrote one.
    const theirs = seen(v) > seen(mine) || (seen(v) === seen(mine) && done(v) > done(mine));
    out[k] = theirs ? { ...mine, ...v } : { ...v, ...mine };
    // These only ever climb, whichever phone did the counting.
    out[k].total = Math.max(lifetime(mine), lifetime(v));
    out[k].lapses = Math.max(mine.lapses ?? 0, v.lapses ?? 0);
    out[k].seen = Math.max(seen(mine), seen(v));
  }
  return out;
}

// On the home screen iOS gives a web app no download bar, so the share sheet is
// the only way the file reaches Files. Everywhere else the link still works.
export async function saveFile(say) {
  const name = `megu-progress-${new Date().toISOString().slice(0, 10)}.json`;
  const body = JSON.stringify({ progress }, null, 1);
  const file = new File([body], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file] }); say('now pick Save to Files'); }
    catch { /* she closed the sheet */ }
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  say(`${Object.keys(progress).length} words saved`);
}

/** `after` runs only when something was actually restored. */
export function loadFile(file, say, after) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      const before = Object.keys(progress).length;
      setProgress(merge(progress, data.progress ?? data));
      saveProgress();
      say(`was ${before} words, now ${Object.keys(progress).length}`);
      after();
    } catch (e) { say(`that is not a progress file: ${e.message}`); }
  };
  r.readAsText(file);
}
