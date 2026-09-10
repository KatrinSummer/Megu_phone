// The settings sheet: the numbers, the switches, and the way in and out of a
// backup file.
import { $ } from './dom.js';
import { progress, settings, today, doneToday, saveSettings, applyTheme } from './store.js';
import { deck, pool, buildQueue } from './boards.js';
import { saveFile, loadFile } from './backup.js';
import { render } from './screens.js';

export function openMenu() {
  const t = today();
  const all = Object.values(progress);
  const rows = [
    ['words in all', deck.cards.length],
    ['started', all.length],
    ['due today', pool().filter((c) => !progress[c.f] || progress[c.f].due <= t).length],
    ['bookmarked', all.filter((p) => p.star).length],
    ['known over a month', all.filter((p) => p.iv >= 30).length],
    ['done today', doneToday()],
    ['marked as known', all.filter((p) => p.known).length],
  ];
  $('sheet').innerHTML = `
    <h3>Megu</h3>
    <table>${rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</table>
    <label>New words at a time</label>
    <input id="per" type="number" min="0" max="100" value="${settings.perDay}">
    <button class="wide" id="theme">${settings.theme === 'dark' ? 'Day theme' : 'Night theme'}</button>
    <button class="wide" id="grab">Download all the sound</button>
    <button class="wide" id="file">Save progress to a file</button>
    <button class="wide" id="pickfile">Restore from a file</button>
    <input id="hidden" type="file" accept="application/json" style="display:none">
    <div class="note" id="note"></div>
    <button class="wide" id="close">Close</button>`;
  const say = (m) => { $('note').textContent = m; };

  $('theme').addEventListener('click', () => {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    saveSettings();                       // saved at once, so a force-quit keeps it
    applyTheme();
    $('theme').textContent = settings.theme === 'dark' ? 'Day theme' : 'Night theme';
  });

  $('grab').addEventListener('click', async () => {
    const files = deck.cards.filter((c) => c.a).map((c) => `audio/${c.a}.m4a`);
    // Ask the service worker which cache is current instead of naming it here:
    // a version bump in sw.js would otherwise throw away every downloaded word.
    const name = (await caches.keys()).find((k) => k.startsWith('megu-'));
    const cache = await caches.open(name ?? 'megu-v2');
    let n = 0;
    for (const f of files) {
      if (!(await cache.match(f))) { try { await cache.add(f); } catch { /* skip a bad one */ } }
      if (++n % 25 === 0) say(`downloaded ${n} of ${files.length}`);
    }
    say(`sound is on the phone: ${files.length} words, no internet needed`);
  });

  $('file').addEventListener('click', () => saveFile(say));
  $('pickfile').addEventListener('click', () => $('hidden').click());
  $('hidden').addEventListener('change', (e) =>
    e.target.files[0] && loadFile(e.target.files[0], say, () => { buildQueue(); render(); }));

  $('close').addEventListener('click', () => {
    const per = Math.max(0, Number($('per').value) || 0);
    const changed = per !== settings.perDay;
    settings.perDay = per;
    saveSettings();
    $('sheet').close();
    // Rebuilding costs her the card she is on, so only do it if the number that
    // shapes the queue actually changed - and never on the board list.
    if (changed && $('main').className !== 'home') { buildQueue(); render(); }
  });
  $('sheet').showModal();
}
