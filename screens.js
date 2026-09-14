// What is on the screen: the list of boards, the two bars, and the card.
import { $, esc } from './dom.js';
import { progress, settings, lifetime, doneToday, countDone, uncountDone,
         saveSettings, saveProgress, flipStar } from './store.js';
import { answer, nextIn, isMemorized } from './schedule.js';
import { deck, boardCards, poolOf, pool, queue, buildQueue, flipKnown, moreNew,
         isNew, isDue } from './boards.js';
import { play, SPEAKER } from './sound.js';
import { yomi, openWord } from './word.js';
import { priButtons, bindPri } from './priority.js';

let current = null, shown = false, revealed = false;
export const currentCard = () => current;

// ---------------------------------------------------------------- boards
// Nothing is reviewed until she picks a board, so the app opens on the list
// rather than dropping her into whichever deck she chose last.
export function home() {
  current = null;
  const rows = [
    ['star', 'Bookmarks'],
    ...deck.decks.map((d) => [d.id, d.name]),
    ...(Object.values(progress).some((p) => p.known) ? [['known', 'Marked as known']] : []),
  ];
  $('star').hidden = $('back').hidden = true;
  $('stats').hidden = true;
  $('counts').innerHTML = `<b>${deck.cards.length}</b> words`;
  $('counts').title = 'pick a board to start';
  $('main').className = 'home';
  $('main').innerHTML = rows.map(([id, name]) => {
    const cards = poolOf(id);
    const due = cards.filter(isDue).length;
    const unseen = cards.filter(isNew).length;
    const note = !cards.length ? 'empty'
      : [due ? `${due} due` : 'nothing due', unseen ? `${unseen} new` : ''].filter(Boolean).join(' · ');
    return `<button class="deck" data-id="${esc(id)}" ${cards.length ? '' : 'disabled'}>
      <span class="n">${esc(name)}</span><span class="s">${note}</span></button>`;
  }).join('');
  for (const b of document.querySelectorAll('.deck')) {
    b.addEventListener('click', () => {
      settings.deck = b.dataset.id;
      saveSettings();
      past.length = 0;                     // a swipe back never leaves the board
      buildQueue();
      render();
    });
  }
}

// ---------------------------------------------------------------- stats
// Learning is what she has started; Memorized is what the schedule has parked
// for over a month, plus whatever she waved off herself.  The circle is about
// the word on screen, not the board: how many times it has come up in all.
export function stats() {
  const cards = boardCards(settings.deck);
  const mem = cards.filter(isMemorized).length;
  const learn = cards.filter((c) => progress[c.f] && !isMemorized(c)).length;
  const pct = (n) => (cards.length ? Math.round((n / cards.length) * 100) : 0);
  const p = current ? progress[current.f] : null;
  // reps goes back to zero on a slip, so counting rounds with it ran backwards.
  const round = current ? lifetime(p ?? {}) + (p?.lapses ?? 0) + 1 : '-';
  $('stats').hidden = false;
  $('stats').innerHTML = `
    <div class="bar"><div class="t"><span>Learning</span><b>${learn}/${cards.length}</b></div>
      <div class="track"><div class="fill" style="width:${pct(learn)}%"></div></div></div>
    <div class="round" title="times this word has come up"><span class="l">round</span><span class="n">${round}</span></div>
    <div class="bar mem"><div class="t"><span>Memorized</span><b>${mem}/${cards.length}</b></div>
      <div class="track"><div class="fill" style="width:${pct(mem)}%"></div></div></div>`;
}

// ---------------------------------------------------------------- card
export function render() {
  const all = pool();
  $('star').hidden = $('back').hidden = false;
  $('main').className = 'study';
  const left = queue.length;
  // Short enough to survive any font: the buttons beside it must not be pushed.
  $('counts').innerHTML = left ? `<b>${left}</b> to go · <b>${doneToday()}</b> ✓` : 'done for today';
  $('counts').title = left ? `${left} left, ${doneToday()} done today` : `${all.length} words in all`;
  $('star').className = 'icon' + (current && progress[current.f]?.star ? ' starred' : '');

  if (!left) {
    current = null;
    stats();
    const later = all.filter((c) => !isNew(c) && !isDue(c)).length;
    const news = all.filter(isNew).length;
    $('main').innerHTML = `<div class="done"><h2>Done for today</h2>
      <div>${later} words are waiting for their day, ${news} have never been shown.</div>
      <button class="wide" id="more">Show ${Math.min(settings.perDay, news)} more new words</button></div>`;
    $('more')?.addEventListener('click', () => { moreNew(); render(); });
    return;
  }

  current = queue.shift();
  shown = false;
  revealed = false;
  stats();
  draw();
  if (settings.autoPlay) play(current);   // the word speaks as soon as it is shown
}

function draw() {
  const c = current;
  const p = progress[c.f];
  const seen = p && (lifetime(p) || p.lapses)
    ? `${lifetime(p)} reviews${p.lapses ? ` · ${p.lapses} slips` : ''}` : 'new word';
  // The word itself is the question, in the kana she reads it in, with the
  // kanji sitting small above it.  The answer is the sound and the meaning.
  // The card scrolls by itself when the back does not fit, above buttons that
  // stay put; the eye sits in its corner and scrolls with it.
  $('main').innerHTML = `
    <div class="card" id="face">
      <button id="hide" class="${p?.known ? 'on' : ''}"
        aria-label="I know this one, stop showing it" title="I know this one, stop showing it">
        <svg viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.7 5.3A9.4 9.4 0 0112 5.2c5 0 9 4.3 9 6.8 0 .9-.5 2-1.4 3.1M6.6 7.4C4.1 8.9 3 10.9 3 12c0 2.5 4 6.8 9 6.8 1.5 0 2.9-.4 4.1-1"/><path d="M9.9 10.1a3 3 0 004.2 4.2"/></svg></button>
      ${c.k ? `<div class="kanji">${esc(c.k)}</div>` : ''}
      <div class="kana${[...c.f].length > 7 ? ' long' : ''}">${esc(c.f)}</div>
      <button id="say" aria-label="Say it" title="Say it">
        <svg viewBox="0 0 24 24"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M15.5 8.6a5 5 0 010 6.8"/><path d="M18.5 5.6a9 9 0 010 12.8"/></svg></button>
      ${shown ? `<div class="back">
          <div class="reading">${esc(c.r)}</div>
          <div class="english">${esc(c.e)}</div>
          ${c.x?.length ? `<div class="ex">${c.x.map((x, i) => `<button data-i="${i}" ${x.a ? '' : 'disabled'}
            aria-label="Say this sentence">${x.a ? SPEAKER : ''}<span class="lines"><span class="jp">${esc(x.t)}</span>${
              // The same sentence in kana, word by word, and her words in it in English.
              x.k ? `<span class="yomi">${yomi(x, c.f)}</span>` : ''}${
              // The word itself is left out: its meaning is right above.
              x.w?.some(([k]) => k !== c.f) ? `<span class="gloss">${x.w.filter(([k]) => k !== c.f)
                .map(([k, e]) => `<span>${esc(k)} <i>${esc(e)}</i></span>`).join('')}</span>` : ''
            }</span></button>`).join('')}</div>` : ''}
        </div>
        <div class="meta">${seen} · tap to flip back</div>
        ${priButtons(c.f)}`
        : '<div class="tap">tap to flip</div>'}
    </div>
    ${revealed ? `<div class="row">
        <button id="again">Forgot<span class="s">again</span></button>
        <button id="good">Knew it<span class="s">${nextIn(c, 'good')}</span></button>
        <button id="easy">Easy<span class="s">${nextIn(c, 'easy')}</span></button>
      </div>`
      : '<button id="reveal">Show</button>'}`;

  // Both ways: once she has seen the back, the card turns over on every tap and
  // the three buttons stay put, so flipping back never costs her the answer.
  const flip = () => { shown = !shown; revealed = true; draw(); };
  $('face').addEventListener('click', flip);
  // It sits on the card, so its tap must not also turn the card over.
  $('say').addEventListener('click', (e) => { e.stopPropagation(); play(c); });
  // A sentence says itself when tapped - she reads kana, not kanji. One of her
  // own words in its kana opens that word instead.
  for (const b of document.querySelectorAll('.ex button')) {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const w = e.target.closest('.w');
      if (w) openWord(w); else play(c.x[b.dataset.i]);
    });
  }
  $('reveal')?.addEventListener('click', flip);
  // The eye is on the card now, so its tap must not also turn it over.
  $('hide').addEventListener('click', (e) => {
    e.stopPropagation();
    const before = snap(c);
    const known = flipKnown(c.f);
    moveOn(c, before, false, !!known);
  });
  for (const g of ['again', 'good', 'easy']) {
    $(g)?.addEventListener('click', () => {
      const before = snap(c);
      const again = answer(c, g);
      moveOn(c, before, again, !again);
    });
  }
  bindPri($('face'), draw);
}

// ---------------------------------------------------------------- swipes
// Every card she moved on from, newest last, with the word as it was before -
// so a swipe back can put the card on screen again and undo what she did to it.
const past = [];
const snap = (c) => progress[c.f] && { ...progress[c.f] };

/** `pushed`: the card went to the back of the round. `counted`: it counted as done. */
function moveOn(c, before, pushed, counted) {
  past.push({ c, before, pushed, counted });
  if (pushed) queue.push(c);
  if (counted) countDone();
  render();
}

const onCards = () => $('main').className === 'study' && !$('pop');

/** A swipe to the right: past this card for now; it comes back later in the round. */
export function skip() {
  if (onCards() && current) moveOn(current, snap(current), true, false);
}

/** A swipe to the left: the card before, back on screen, with whatever she did
 *  to it undone so she can answer it again. */
export function back() {
  const h = onCards() && past.pop();
  if (!h) return;
  const i = queue.lastIndexOf(h.c);
  if (h.pushed && i >= 0) queue.splice(i, 1);
  if (h.before) progress[h.c.f] = h.before; else delete progress[h.c.f];
  saveProgress();
  if (h.counted) uncountDone();
  if (current) queue.unshift(current);
  queue.unshift(h.c);
  render();
}

/** The bookmark button in the header, which must not redraw a revealed card. */
export function toggleStar() {
  if (!current) return;
  $('star').className = 'icon' + (flipStar(current.f) ? ' starred' : '');
}
