// Settings: a screen of its own now, not a sheet that slides up.  It holds the
// theme, the sound, how much of their language she has, and the way in and out
// of a backup file.
//
// "New words at a time" is NOT here.  It rides on the big button on Home,
// under the gear beside it, which is where she put it and where it is used -
// two boxes for one number meant typing 20 in one place and reading 30 in the
// other, and she asked what it was doing on this screen.
import { $ } from './dom.js';
import { settings, saveSettings, applyTheme } from './store.js';
import { deck, buildQueue } from './boards.js';
import { saveFile, loadFile } from './backup.js';
import { ic } from './icons.js';
import { LEVELS, level, setLevel } from './level.js';
import { leave, render } from './screens.js';
import { markTab, buildNav } from './nav.js';
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
    <div class="head">${ic('gear')}<h1>Settings</h1></div>
    <div class="grp">Learning</div>
    <div class="pane">
      <div class="set">${ic('pronunciation')}<span class="n">Say the word on its own</span>
        <button class="sw${settings.autoPlay ? ' on' : ''}" id="auto"
          role="switch" aria-checked="${!!settings.autoPlay}" aria-label="Say the word on its own"></button></div>
    </div>

    <div class="grp">Her Japanese</div>
    <div class="pane">
      <div class="set">${ic('learning')}<span class="n">How much she understands</span>
        <div class="chips lv">${LEVELS.map(([k, n]) =>
          `<button class="${k === level() ? 'on' : ''}" data-l="${k}">${n}</button>`).join('')}</div>
      </div>
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
      <div>${ic('deck')}words on the phone<b>${deck.cards.length}</b></div>
      <div>${ic('backup')}version<b>${new Date(document.lastModified)
        .toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</b></div>
    </div>
    <button class="wide" id="close">Done</button>`;

  $('theme').addEventListener('click', () => {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    saveSettings();                       // saved at once, so a force-quit keeps it
    applyTheme();
    buildNav();                           // the bar wears a day icon she drew for it
    settingsPage();                       // her icons and her island change with it
  });
  // The test sets this; she overrules it.
  for (const b of document.querySelectorAll('.lv button')) {
    b.addEventListener('click', () => { setLevel(b.dataset.l); settingsPage(); });
  }
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

  $('close').addEventListener('click', () => { markTab('home'); dash(); });
}
