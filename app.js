// Megu review app. Everything lives on the phone; the network is only ever
// used to back the progress up, never to show a card.

const $ = (id) => document.getElementById(id);
const today = () => Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000);

// ---------------------------------------------------------------- storage
const P_KEY = 'megu.progress.v1';
const S_KEY = 'megu.settings.v1';
const load = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };

let progress = load(P_KEY, {});        // Front -> {due, iv, ease, reps, lapses, star, seen}
let settings = { deck: 'all', perDay: 20, autoPlay: true, cloud: '', key: '', ...load(S_KEY, {}) };
let deck = { cards: [], decks: [] };
let queue = [], current = null, shown = false, doneToday = 0;

const saveProgress = () => { localStorage.setItem(P_KEY, JSON.stringify(progress)); scheduleSync(); };
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

const pool = () => settings.deck === 'all' ? deck.cards
  : settings.deck === 'star' ? deck.cards.filter((c) => progress[c.f]?.star)
  : settings.deck === 'last' ? deck.cards.filter((c) => c.last)
  : deck.cards.filter((c) => c.d === settings.deck);

function buildQueue() {
  const t = today(), all = pool();
  const due = all.filter((c) => progress[c.f] && progress[c.f].due <= t);
  const fresh = all.filter((c) => !progress[c.f]);
  // Newest lesson first, so what she just learned is what she sees first.
  fresh.sort((a, b) => (b.when || '').localeCompare(a.when || ''));
  queue = [...due.sort(() => Math.random() - 0.5), ...fresh.slice(0, settings.perDay)];
  doneToday = 0;
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
  const left = queue.length;
  // Short enough to survive any font: the buttons beside it must not be pushed.
  $('counts').innerHTML = left ? `<b>${left}</b> to go · <b>${doneToday}</b> ✓` : `done for today`;
  $('counts').title = left ? `${left} left, ${doneToday} done today` : `${all.length} words in all`;
  $('star').textContent = current && progress[current.f]?.star ? '★' : '☆';
  $('star').className = 'icon' + (current && progress[current.f]?.star ? ' starred' : '');

  if (!queue.length) {
    current = null;
    const later = all.filter((c) => progress[c.f]?.due > t).length;
    const news = all.filter((c) => !progress[c.f]).length;
    $('main').innerHTML = `<div class="done"><h2>Done for today</h2>
      <div>${later} words are waiting for their day, ${news} have never been shown.</div>
      <button class="wide" id="more">Show ${Math.min(settings.perDay, news)} more new words</button></div>`;
    $('more')?.addEventListener('click', () => {
      queue = all.filter((c) => !progress[c.f])
        .sort((a, b) => (b.when || '').localeCompare(a.when || '')).slice(0, settings.perDay);
      render();
    });
    return;
  }

  current = queue.shift();
  shown = false;
  draw();
  if (settings.autoPlay) play();          // the word speaks as soon as it is shown
}

function draw() {
  const c = current;
  const p = progress[c.f];
  const seen = p ? `${p.reps} reviews${p.lapses ? ` · ${p.lapses} slips` : ''}` : 'new word';
  $('main').innerHTML = `
    <div class="card" id="face">
      <div class="kana">${esc(c.f)}</div>
      <div class="${shown ? '' : 'hidden'}">
        <div class="reading">${esc(c.r)}</div>
        ${c.k ? `<div class="kanji">${esc(c.k)}</div>` : ''}
      </div>
      <div class="english ${shown ? '' : 'hidden'}">${esc(c.e)}</div>
      ${shown ? `<div class="meta">${seen}</div>` : '<div class="tap">tap to see</div>'}
    </div>
    ${shown ? `<div class="row">
        <button id="again">Forgot<span class="s">again</span></button>
        <button id="good">Knew it<span class="s">${nextIn('good')}</span></button>
        <button id="easy">Easy<span class="s">${nextIn('easy')}</span></button>
      </div>`
      : '<button id="reveal">Show</button>'}`;

  const reveal = () => { if (!shown) { shown = true; draw(); } };
  $('face').addEventListener('click', reveal);
  $('reveal')?.addEventListener('click', reveal);
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
let syncTimer = null;
function scheduleSync() {
  if (!settings.cloud) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => sync().catch(() => {}), 4000);   // after she stops tapping
}

/** Newer record per word wins, so two phones never overwrite each other. */
function merge(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (!out[k] || (v.seen ?? 0) > (out[k].seen ?? 0)) out[k] = v;
  }
  return out;
}

async function sync() {
  if (!settings.cloud) return 'no cloud set up yet';
  const url = settings.cloud.replace(/\/$/, '');
  const head = { 'content-type': 'application/json', 'x-megu-key': settings.key };
  const got = await fetch(url, { headers: head });
  if (got.ok) {
    const remote = await got.json().catch(() => ({}));
    progress = merge(progress, remote.progress ?? {});
    localStorage.setItem(P_KEY, JSON.stringify(progress));
  }
  const put = await fetch(url, { method: 'PUT', headers: head, body: JSON.stringify({ progress }) });
  if (!put.ok) throw new Error(`the server said ${put.status}`);
  return `backed up ${Object.keys(progress).length} words`;
}

function saveFile() {
  const blob = new Blob([JSON.stringify({ progress }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `megu-progress-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
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
  ];
  $('sheet').innerHTML = `
    <h3>Megu</h3>
    <table>${rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</table>
    <label>What to review</label>
    <select id="pick">
      <option value="all">Everything</option>
      <option value="star">Bookmarks only</option>
      <option value="last">Newest lesson</option>
      ${deck.decks.map((d) => `<option value="${d.id}">${esc(d.name)}</option>`).join('')}
    </select>
    <label>New words at a time</label>
    <input id="per" type="number" min="0" max="100" value="${settings.perDay}">
    <label>Cloud backup (address and key)</label>
    <input id="cloud" placeholder="https://…workers.dev" value="${esc(settings.cloud)}">
    <input id="key" placeholder="key" value="${esc(settings.key)}" style="margin-top:6px">
    <button class="wide" id="now">Back up to the cloud now</button>
    <button class="wide" id="grab">Download all the sound</button>
    <button class="wide" id="file">Save progress to a file</button>
    <button class="wide" id="pickfile">Restore from a file</button>
    <input id="hidden" type="file" accept="application/json" style="display:none">
    <div class="note" id="note"></div>
    <button class="wide" id="close">Close</button>`;
  $('pick').value = settings.deck;
  const say = (m) => { $('note').textContent = m; };

  $('now').addEventListener('click', async () => {
    say('backing up…');
    try { say(await sync()); } catch (e) { say(`did not work: ${e.message}`); }
  });
  $('grab').addEventListener('click', async () => {
    const files = deck.cards.filter((c) => c.a).map((c) => `audio/${c.a}.m4a`);
    const cache = await caches.open('megu-v1');
    let n = 0;
    for (const f of files) {
      if (!(await cache.match(f))) { try { await cache.add(f); } catch { /* skip a bad one */ } }
      if (++n % 25 === 0) say(`downloaded ${n} of ${files.length}`);
    }
    say(`sound is on the phone: ${files.length} words, no internet needed`);
  });
  $('file').addEventListener('click', saveFile);
  $('pickfile').addEventListener('click', () => $('hidden').click());
  $('hidden').addEventListener('change', (e) => e.target.files[0] && loadFile(e.target.files[0], say));
  $('close').addEventListener('click', () => {
    settings.deck = $('pick').value;
    settings.perDay = Math.max(0, Number($('per').value) || 0);
    settings.cloud = $('cloud').value.trim();
    settings.key = $('key').value.trim();
    saveSettings();
    $('sheet').close();
    buildQueue(); render();
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
  $('star').textContent = p.star ? '★' : '☆';
  $('star').className = 'icon' + (p.star ? ' starred' : '');
});

fetch('deck.json').then((r) => r.json()).then((d) => {
  deck = d;
  buildQueue();
  render();
  if (settings.cloud) sync().then(() => { buildQueue(); render(); }).catch(() => {});
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

// Only on a local machine: lets scripts/check-pwa.mjs test the schedule and the
// merge for real instead of poking at the screen.
if (['127.0.0.1', 'localhost'].includes(location.hostname)) {
  window.megu = { merge, answer, get progress() { return progress; }, get deck() { return deck; },
                  get audioSrc() { return audio?.src ?? ''; } };
}
