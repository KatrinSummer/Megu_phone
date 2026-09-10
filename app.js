// Megu review app. Everything lives on the phone; the network is only ever
// used to back the progress up, never to show a card.

const $ = (id) => document.getElementById(id);
const today = () => Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000);

// ---------------------------------------------------------------- storage
const P_KEY = 'megu.progress.v1';
const S_KEY = 'megu.settings.v1';
const load = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };

let progress = load(P_KEY, {});        // Front -> {due, iv, ease, reps, lapses, star, known, seen}
let settings = { deck: 'all', perDay: 20, autoPlay: true, theme: 'light', ...load(S_KEY, {}) };

// The head applies this too, before the first paint; here it is for the switch.
const applyTheme = () => {
  const dark = settings.theme === 'dark';
  if (dark) document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;
  document.querySelector('meta[name=theme-color]').content = dark ? '#191b28' : '#ffffff';
};
let deck = { cards: [], decks: [] };
let queue = [], current = null, shown = false, revealed = false, doneToday = 0;

const saveProgress = () => localStorage.setItem(P_KEY, JSON.stringify(progress));
const saveSettings = () => localStorage.setItem(S_KEY, JSON.stringify(settings));

// ---------------------------------------------------------------- schedule
// SM-2, trimmed to what a vocabulary list actually needs.
function answer(card, grade) {
  const p = progress[card.f] ?? { due: 0, iv: 0, ease: 2.5, reps: 0, lapses: 0, star: 0 };
  if (grade === 'again') {
    p.lapses++; p.reps = 0; p.iv = 0; p.ease = Math.max(1.3, p.ease - 0.2);
    p.due = today();                       // comes back later in this same session
  } else {
    if (grade === 'easy') p.ease += 0.15;
    p.iv = p.reps === 0 ? 1 : p.reps === 1 ? 3 : Math.round(p.iv * p.ease);
    if (grade === 'easy') p.iv = Math.max(2, Math.round(p.iv * 1.5));
    p.reps++;
    p.due = today() + p.iv;
  }
  p.seen = today();
  progress[card.f] = p;
  saveProgress();
  if (grade === 'again') queue.push(card); else doneToday++;
}

// What the board holds, whether or not she has waved a word off.  The bars
// count against this, or marking a word known would shrink the goalpost too.
const boardCards = (id) => id === 'all' ? deck.cards
  : id === 'star' ? deck.cards.filter((c) => progress[c.f]?.star)
  : id === 'last' ? deck.cards.filter((c) => c.last)
  : id === 'known' ? deck.cards.filter((c) => progress[c.f]?.known)
  : deck.cards.filter((c) => c.d === id);

// What she will actually be shown.  The Known board is the way back: open it
// and press the eye again to put a word back into rotation.
const poolOf = (id) => id === 'known' ? boardCards(id)
  : boardCards(id).filter((c) => !progress[c.f]?.known);
const pool = () => poolOf(settings.deck);

const isMemorized = (c) => { const p = progress[c.f]; return !!p && (p.known === 1 || p.iv >= 30); };

function buildQueue() {
  const t = today(), all = pool();
  // The Known board is not a lesson, it is the list she goes through to undo.
  if (settings.deck === 'known') { queue = [...all]; doneToday = 0; return; }
  const due = all.filter((c) => progress[c.f] && progress[c.f].due <= t);
  const fresh = all.filter((c) => !progress[c.f]);
  // Newest lesson first, so what she just learned is what she sees first.
  fresh.sort((a, b) => (b.when || '').localeCompare(a.when || ''));
  queue = [...due.sort(() => Math.random() - 0.5), ...fresh.slice(0, settings.perDay)];
  doneToday = 0;
}

// ---------------------------------------------------------------- home
// Nothing is reviewed until she picks a board, so the app opens on the list
// rather than dropping her into whichever deck she chose last.
function home() {
  current = null;
  const t = today();
  const rows = [
    ['all', 'Everything'],
    ['star', 'Bookmarks'],
    ['last', 'Newest lesson'],
    ...deck.decks.map((d) => [d.id, d.name]),
    ...(Object.values(progress).some((p) => p.known) ? [['known', 'Marked as known']] : []),
  ];
  $('star').hidden = $('sound').hidden = true;
  $('stats').hidden = true;
  $('counts').innerHTML = `<b>${deck.cards.length}</b> words`;
  $('counts').title = 'pick a board to start';
  $('main').className = 'home';
  $('main').innerHTML = rows.map(([id, name]) => {
    const cards = poolOf(id);
    const due = cards.filter((c) => progress[c.f] && progress[c.f].due <= t).length;
    const fresh = cards.filter((c) => !progress[c.f]).length;
    const note = !cards.length ? 'empty'
      : [due ? `${due} due` : 'nothing due', fresh ? `${fresh} new` : ''].filter(Boolean).join(' · ');
    return `<button class="deck" data-id="${esc(id)}" ${cards.length ? '' : 'disabled'}>
      <span class="n">${esc(name)}</span><span class="s">${note}</span></button>`;
  }).join('');
  for (const b of document.querySelectorAll('.deck')) {
    b.addEventListener('click', () => {
      settings.deck = b.dataset.id;
      saveSettings();
      buildQueue();
      render();
    });
  }
}

// ---------------------------------------------------------------- stats
// Learning is what she has started; Memorized is what the schedule has parked
// for over a month, plus whatever she waved off herself.  The circle is about
// the word on screen, not the board: how many times it has come up in all.
function stats() {
  const cards = boardCards(settings.deck);
  const mem = cards.filter(isMemorized).length;
  const learn = cards.filter((c) => progress[c.f] && !isMemorized(c)).length;
  const pct = (n) => (cards.length ? Math.round((n / cards.length) * 100) : 0);
  const p = current ? progress[current.f] : null;
  const round = current ? (p?.reps ?? 0) + (p?.lapses ?? 0) + 1 : '-';
  $('stats').hidden = false;
  $('stats').innerHTML = `
    <div class="bar"><div class="t"><span>Learning</span><b>${learn}/${cards.length}</b></div>
      <div class="track"><div class="fill" style="width:${pct(learn)}%"></div></div></div>
    <div class="round" title="times this word has come up"><span class="l">round</span><span class="n">${round}</span></div>
    <div class="bar mem"><div class="t"><span>Memorized</span><b>${mem}/${cards.length}</b></div>
      <div class="track"><div class="fill" style="width:${pct(mem)}%"></div></div></div>`;
}

// ---------------------------------------------------------------- audio
let audio = null, unlocked = false;
function play() {
  if (!current?.a) return;
  audio ??= new Audio();                 // one element for the whole session: iOS
  audio.src = `audio/${current.a}.m4a`;  // unlocks it once and trusts it after
  audio.play().then(() => { unlocked = true; }).catch(() => {});
}

// The very first card is drawn before she has touched anything, and iOS will not
// speak until she does. Say it on her first tap instead - the Japanese word is
// still what is on screen at that moment.
addEventListener('pointerdown', () => { if (!unlocked) play(); }, { capture: true });

// ---------------------------------------------------------------- render
function render() {
  const t = today(), all = pool();
  $('star').hidden = $('sound').hidden = false;
  $('main').className = '';
  const left = queue.length;
  // Short enough to survive any font: the buttons beside it must not be pushed.
  $('counts').innerHTML = left ? `<b>${left}</b> to go \u00b7 <b>${doneToday}</b> \u2713` : `done for today`;
  $('counts').title = left ? `${left} left, ${doneToday} done today` : `${all.length} words in all`;
  $('star').className = 'icon' + (current && progress[current.f]?.star ? ' starred' : '');

  if (!queue.length) {
    current = null;
    stats();
    const later = all.filter((c) => progress[c.f]?.due > t).length;
    const news = all.filter((c) => !progress[c.f]).length;
    $('main').innerHTML = `<div class="done"><h2>Done for today</h2>
      <div>${later} words are waiting for their day, ${news} have never been shown.</div>
      <button class="wide" id="more">Show ${Math.min(settings.perDay, news)} more new words</button>
      <button class="wide" id="back">Back to the boards</button></div>`;
    $('back').addEventListener('click', home);
    $('more')?.addEventListener('click', () => {
      queue = all.filter((c) => !progress[c.f])
        .sort((a, b) => (b.when || '').localeCompare(a.when || '')).slice(0, settings.perDay);
      render();
    });
    return;
  }

  current = queue.shift();
  shown = false;
  revealed = false;
  stats();
  draw();
  if (settings.autoPlay) play();          // the word speaks as soon as it is shown
}

function draw() {
  const c = current;
  const p = progress[c.f];
  const seen = p?.reps || p?.lapses ? `${p.reps} reviews${p.lapses ? ` \u00b7 ${p.lapses} slips` : ''}` : 'new word';
  // The question is the written word - the kanji when there is one.  The answer
  // is how it is read and what it means.
  const front = c.k || c.f;
  $('main').innerHTML = `
    <div class="tools">
      <button id="toboards" aria-label="Back to the boards">
        <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>boards</button>
      <button id="hide" class="${p?.known ? 'on' : ''}"
        aria-label="I know this one, stop showing it" title="I know this one, stop showing it">
        <svg viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.7 5.3A9.4 9.4 0 0112 5.2c5 0 9 4.3 9 6.8 0 .9-.5 2-1.4 3.1M6.6 7.4C4.1 8.9 3 10.9 3 12c0 2.5 4 6.8 9 6.8 1.5 0 2.9-.4 4.1-1"/><path d="M9.9 10.1a3 3 0 004.2 4.2"/></svg></button>
    </div>
    <div class="card" id="face">
      <div class="kana">${esc(front)}</div>
      ${shown ? `<div class="back">
          ${c.k ? `<div class="jp">${esc(c.f)}</div>` : ''}
          <div class="reading">${esc(c.r)}</div>
          <div class="english">${esc(c.e)}</div>
        </div>
        <div class="meta">${seen} \u00b7 tap to flip back</div>`
        : '<div class="tap">tap to flip</div>'}
    </div>
    ${revealed ? `<div class="row">
        <button id="again">Forgot<span class="s">again</span></button>
        <button id="good">Knew it<span class="s">${nextIn('good')}</span></button>
        <button id="easy">Easy<span class="s">${nextIn('easy')}</span></button>
      </div>`
      : '<button id="reveal">Show</button>'}`;

  // Both ways: once she has seen the back, the card turns over on every tap and
  // the three buttons stay put, so flipping back never costs her the answer.
  const flip = () => { shown = !shown; revealed = true; draw(); };
  $('face').addEventListener('click', flip);
  $('reveal')?.addEventListener('click', flip);
  $('toboards').addEventListener('click', home);
  $('hide').addEventListener('click', () => {
    const q = progress[c.f] ??= { due: today(), iv: 0, ease: 2.5, reps: 0, lapses: 0, star: 0 };
    q.known = q.known ? 0 : 1;
    q.seen = today();
    saveProgress();
    // Either way it no longer belongs in what she is going through right now.
    queue = queue.filter((x) => x.f !== c.f);
    if (q.known) doneToday++;
    render();
  });
  for (const g of ['again', 'good', 'easy']) {
    $(g)?.addEventListener('click', () => { answer(current, g); render(); });
  }
}

/** What the button will cost her, in plain words. */
function nextIn(grade) {
  const p = progress[current.f] ?? { iv: 0, ease: 2.5, reps: 0 };
  let iv = p.reps === 0 ? 1 : p.reps === 1 ? 3 : Math.round(p.iv * (p.ease + (grade === 'easy' ? 0.15 : 0)));
  if (grade === 'easy') iv = Math.max(2, Math.round(iv * 1.5));
  return iv === 1 ? 'tomorrow' : iv < 30 ? `in ${iv} days` : `in ${Math.round(iv / 30)} months`;
}

const esc = (s) => String(s ?? '').replace(/[<>&"]/g, (m) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[m]));

// ---------------------------------------------------------------- backup

/** Newer record per word wins, so two phones never overwrite each other. */
function merge(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (!out[k] || (v.seen ?? 0) > (out[k].seen ?? 0)) out[k] = v;
  }
  return out;
}

// On the home screen iOS gives a web app no download bar, so the share sheet is
// the only way the file reaches Files. Everywhere else the link still works.
async function saveFile(say) {
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

function loadFile(file, say) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      const before = Object.keys(progress).length;
      progress = merge(progress, data.progress ?? data);
      localStorage.setItem(P_KEY, JSON.stringify(progress));
      say(`was ${before} words, now ${Object.keys(progress).length}`);
      buildQueue(); render();
    } catch (e) { say(`that is not a progress file: ${e.message}`); }
  };
  r.readAsText(file);
}

// ---------------------------------------------------------------- menu
function openMenu() {
  const t = today();
  const known = Object.values(progress);
  const rows = [
    ['words in all', deck.cards.length],
    ['started', known.length],
    ['due today', pool().filter((c) => !progress[c.f] || progress[c.f].due <= t).length],
    ['bookmarked', known.filter((p) => p.star).length],
    ['known over a month', known.filter((p) => p.iv >= 30).length],
    ['marked as known', known.filter((p) => p.known).length],
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
  $('hidden').addEventListener('change', (e) => e.target.files[0] && loadFile(e.target.files[0], say));
  $('close').addEventListener('click', () => {
    settings.perDay = Math.max(0, Number($('per').value) || 0);
    saveSettings();
    $('sheet').close();
    // She may be sitting on the board list; do not shove her into a card.
    if ($('main').className !== 'home') { buildQueue(); render(); }
  });
  $('sheet').showModal();
}

// ---------------------------------------------------------------- start
$('menu').addEventListener('click', openMenu);
$('sound').addEventListener('click', play);
$('star').addEventListener('click', () => {
  if (!current) return;
  const p = progress[current.f] ??= { due: today(), iv: 0, ease: 2.5, reps: 0, lapses: 0, star: 0 };
  p.star = p.star ? 0 : 1;
  saveProgress();
  // Only the button changes; redrawing the card would hide a revealed answer.
  $('star').className = 'icon' + (p.star ? ' starred' : '');
});

fetch('deck.json').then((r) => r.json()).then((d) => {
  deck = d;
  home();
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

// Only on a local machine: lets scripts/check-pwa.mjs test the schedule and the
// merge for real instead of poking at the screen.
if (['127.0.0.1', 'localhost'].includes(location.hostname)) {
  window.megu = { merge, answer, get progress() { return progress; }, get deck() { return deck; },
                  get audioSrc() { return audio?.src ?? ''; }, get current() { return current; },
                  stats, home, get queue() { return queue; } };
}
