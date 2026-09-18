// Settings: a screen of its own now, not a sheet that slides up.  It holds what
// it always held - how many new words at a time, the theme, the sound, and the
// way in and out of a backup file.
import { $ } from './dom.js';
import { settings, saveSettings, applyTheme } from './store.js';
import { deck, buildQueue } from './boards.js';
import { saveFile, loadFile } from './backup.js';
import { ic } from './icons.js';
import { leave, render } from './screens.js';
import { markTab } from './nav.js';
import { dash } from './dash.js';

const say = (m) => { $('note').textContent = m; };

export function settingsPage() {
  leave();
  markTab('settings');
  $('star').hidden = $('back').hidden = true;
  $('stats').hidden = true;
  $('counts').innerHTML = '';                   // the heading on the screen says it
  $('counts').title = 'Settings';

  const dark = settings.theme === 'dark';
  // She asked for this one on plain blue: a screen of switches is no place to
  // read a beach through.
  $('main').className = 'page settings';
  $('main').innerHTML = `
    <div class="head">${ic('settings', '44px')}<h1>Settings</h1></div>
    <div class="grp">Learning</div>
    <div class="pane">
      <div class="set">${ic('goal')}<span class="n">New words at a time</span>
        <input id="per" type="number" min="0" max="100" value="${settings.perDay}"></div>
      <div class="set">${ic('pronunciation')}<span class="n">Say the word on its own</span>
        <button class="sw${settings.autoPlay ? ' on' : ''}" id="auto"
          role="switch" aria-checked="${!!settings.autoPlay}" aria-label="Say the word on its own"></button></div>
    </div>

    <div class="grp">Look</div>
    <div class="pane">
      <div class="set">${ic('theme')}<span class="n">Night theme</span>
        <button class="sw${dark ? ' on' : ''}" id="theme"
          role="switch" aria-checked="${dark}" aria-label="Night theme"></button></div>
    </div>

    <div class="grp">Sound and progress</div>
    <div class="pane">
      <button class="set" id="grab" style="width:100%;text-align:left">${ic('audio')}
        <span class="n">Download all the sound</span><span class="go">›</span></button>
      <button class="set" id="file" style="width:100%;text-align:left">${ic('export')}
        <span class="n">Save progress to a file</span><span class="go">›</span></button>
      <button class="set" id="pickfile" style="width:100%;text-align:left">${ic('import')}
        <span class="n">Restore from a file</span><span class="go">›</span></button>
    </div>
    <input id="hidden" type="file" accept="application/json" style="display:none">
    <div id="note"></div>

    <div class="grp">About</div>
    <div class="pane rows">
      <div>words on the phone<b>${deck.cards.length}</b></div>
      <div>version<b>${new Date(document.lastModified)
        .toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</b></div>
    </div>
    <button class="wide" id="close">Done</button>`;

  $('theme').addEventListener('click', () => {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    saveSettings();                       // saved at once, so a force-quit keeps it
    applyTheme();
    settingsPage();                       // her icons and her island change with it
  });
  $('auto').addEventListener('click', () => {
    settings.autoPlay = !settings.autoPlay;
    saveSettings();
    $('auto').classList.toggle('on', settings.autoPlay);
    $('auto').setAttribute('aria-checked', String(!!settings.autoPlay));
  });

  $('grab').addEventListener('click', async () => {
    // The words and their example sentences: both have to work with no signal.
    const files = deck.cards.flatMap((c) => [c.a, ...(c.x ?? []).map((x) => x.a)])
      .filter(Boolean).map((a) => `audio/${a}.m4a`);
    // Ask the service worker which cache is current instead of naming it here:
    // a version bump in sw.js would otherwise throw away every downloaded word.
    const name = (await caches.keys()).find((k) => k.startsWith('megu-'));
    const cache = await caches.open(name ?? 'megu-v2');
    let n = 0;
    for (const f of files) {
      if (!(await cache.match(f))) { try { await cache.add(f); } catch { /* skip a bad one */ } }
      if (++n % 25 === 0) say(`downloaded ${n} of ${files.length}`);
    }
    say(`sound is on the phone: ${files.length} files, words and sentences, no internet needed`);
  });

  $('file').addEventListener('click', () => saveFile(say));
  $('pickfile').addEventListener('click', () => $('hidden').click());
  $('hidden').addEventListener('change', (e) =>
    e.target.files[0] && loadFile(e.target.files[0], say, () => { buildQueue(); render(); }));

  // The number only shapes the next queue, so it is read when she leaves.
  $('close').addEventListener('click', () => { keepPerDay(); markTab('home'); dash(); });
}

/** What she typed into "new words at a time", saved on the way out. */
export function keepPerDay() {
  const box = $('per');
  if (!box) return;
  const per = Math.max(0, Number(box.value) || 0);
  if (per === settings.perDay) return;
  settings.perDay = per;
  saveSettings();
  buildQueue();
}
