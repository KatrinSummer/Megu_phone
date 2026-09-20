// What is on the screen: the list of boards, the two bars, and the card.
import { $, esc } from './dom.js';
import { progress, settings, lifetime, doneToday, countDone, uncountDone, countTime,
         saveProgress, flipStar, today } from './store.js';
import { answer, nextIn, isMemorized } from './schedule.js';
import { deck, boardCards, pool, buildQueue, flipMark, learnable, reviewable, isOut } from './boards.js';
import { queue, again, first, lesson, nextCard, keep, forget } from './lesson.js';
import { play, SPEAKER } from './sound.js';
import { yomi, openWord } from './word.js';
import { priButtons, bindPri } from './priority.js';
import { openBoard } from './page.js';
// Home, for the end of a jungle run.  Home leads here and this leads back; both
// only ever call the other from a button, so neither waits on the other to load.
import { dash } from './dash.js';
import { ic } from './icons.js';

let current = null, shown = false, revealed = false;
// When the card on screen was dealt.  It is the only clock in the app: study
// time is the time cards spend in front of her, nothing else.
let shownAt = 0;
export const currentCard = () => current;

/** Out of the lesson, onto a screen with no card: the boards or a board's page. */
export function leave() {
  current = null;
  forget();                                // so the boards, not a lesson, open next time
  ground(false);                           // plain blue; Home and the card ask for the island
}

/** Her island behind everything, or plain blue.  One switch, so no screen can
 *  end up half on the beach: the header and the bar stand on it too. */
export const ground = (on) => document.body.classList.toggle('island', on);

/** The lesson or review the page's button asked for. */
export function begin() {
  past.length = 0;                         // a swipe back never leaves the lesson
  buildQueue();
  render();
}

// ---------------------------------------------------------------- stats
// Learning is what she has started; Memorized is what the schedule has parked
// for over a month, plus whatever she ticked as known.  A word she hid as not
// important does not count against the board.  The circle is about the word on
// screen, not the board: how many times it has come up in all.
export function stats() {
  const id = settings.deck;
  // A jungle run is dealt from every board at once, so the bars count them all.
  const cards = (settings.mode === 'jungle' ? deck.cards : boardCards(id))
    .filter((c) => id === 'hidden' || !progress[c.f]?.hide);
  const mem = cards.filter(isMemorized).length;
  const learn = cards.filter((c) => progress[c.f] && !isMemorized(c)).length;
  const pct = (n) => (cards.length ? Math.round((n / cards.length) * 100) : 0);
  const p = current ? progress[current.f] : null;
  // reps goes back to zero on a slip, so counting rounds with it ran backwards.
  const round = current ? lifetime(p ?? {}) + (p?.lapses ?? 0) + 1 : '';
  $('stats').hidden = false;
  $('stats').innerHTML = `
    <div class="bar"><div class="t"><span>Learning</span><b>${learn}/${cards.length}</b></div>
      <div class="track"><div class="fill" style="width:${pct(learn)}%"></div></div></div>
    ${current ? `<div class="round" title="times this word has come up"><span class="l">round</span><span class="n">${round}</span></div>` : ''}
    <div class="bar mem"><div class="t"><span>Memorized</span><b>${mem}/${cards.length}</b></div>
      <div class="track"><div class="fill" style="width:${pct(mem)}%"></div></div></div>`;
}

// ---------------------------------------------------------------- card
export function render() {
  const all = pool();
  $('star').hidden = $('back').hidden = false;
  $('main').className = 'study';
  ground(true);                            // a card stands on her island - her call
  current = nextCard();
  // What is left of the lesson, this card included: it goes down at every card,
  // whatever her answer. Short enough to survive any font beside the buttons.
  const left = current ? queue.length + 1 : 0;
  $('counts').innerHTML = left
    ? `<b>${left}</b> ${lesson.repeating ? 'once more' : 'to go'} · <b>${doneToday()}</b> ✓` : 'lesson done';
  $('counts').title = left ? `${left} left, ${doneToday()} done today` : `${all.length} words in all`;
  $('star').className = 'icon' + (current && progress[current.f]?.star ? ' starred' : '');
  stats();
  if (!current) { forget(); summary(); return; }
  keep(settings.deck, current);
  shown = false;
  revealed = false;
  shownAt = Date.now();                   // a flip does not restart it
  draw();
  if (settings.autoPlay) play(current);   // the word speaks as soon as it is shown
}

// The end of the lesson: how it went, what she forgot, and the way back.
function summary() {
  const how = [...first.values()];
  const n = (k) => how.filter((v) => v === k).length;
  const rows = [['Words', how.length], ['Knew it', n('good')], ['Easy', n('easy')],
    ['Forgot', n('again')], ['Skipped', n('skip')]].filter(([, v], i) => !i || v);
  const missed = [...first].filter(([, v]) => v === 'again').map(([f]) => f);
  // What is left: a review has the words not seen today, a lesson its new words.
  const rev = settings.mode === 'review', wild = settings.mode === 'jungle', id = settings.deck;
  const left = wild ? deck.cards.filter((c) => !isOut(c)).length
    : (rev ? reviewable(id).filter((c) => progress[c.f]?.seen !== today()) : learnable(id)).length;
  const more = wild ? Number(left > 0) : Math.min(settings.perDay, left);
  // The lesson is over, so the bar along the bottom comes back with the summary.
  $('main').className = 'page';
  $('main').innerHTML = `<div class="done"><h2>${how.length ? 'Lesson done' : 'Done for today'}</h2>
    ${how.length ? `<table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>` : ''}
    ${missed.length ? `<div class="note">Forgot: ${missed.map(esc).join(' · ')}</div>` : ''}
    <div>${wild ? `${left} words are out there in the jungle.`
      : rev ? `${left} more to review today.` : left ? `${left} new words left on this board.`
      : 'Every word of this board has been started: review them from its page.'}</div>
    <button class="wide" id="boards">${wild ? 'Back home' : 'Back to the board'}</button>
    ${more ? `<button class="wide" id="more">${wild ? 'Into the jungle again'
      : rev ? `Review ${more} more` : `Show ${more} more new words`}</button>` : ''}</div>`;
  // The jungle came from Home and belongs to no board, so that is the way back.
  $('boards').addEventListener('click', () => (wild ? dash() : openBoard(id)));
  $('more')?.addEventListener('click', begin);
}

function draw() {
  const c = current;
  const p = progress[c.f];
  const seen = p && (lifetime(p) || p.lapses)
    ? `${lifetime(p)} reviews${p.lapses ? ` · ${p.lapses} slips` : ''}` : 'new word';
  // The word itself is the question, in the kana she reads it in, with the
  // kanji sitting small above it.  The answer is the sound and the meaning.
  // The card scrolls by itself when the back does not fit, above buttons that
  // stay put; the eye and the tick sit in its corner and scroll with it.
  $('main').innerHTML = `
    <div class="card" id="face">
      <button id="hide" class="${p?.hide ? 'on' : ''}"
        aria-label="Not important, stop showing it" title="Not important, stop showing it">
        <svg viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.7 5.3A9.4 9.4 0 0112 5.2c5 0 9 4.3 9 6.8 0 .9-.5 2-1.4 3.1M6.6 7.4C4.1 8.9 3 10.9 3 12c0 2.5 4 6.8 9 6.8 1.5 0 2.9-.4 4.1-1"/><path d="M9.9 10.1a3 3 0 004.2 4.2"/></svg></button>
      <button id="know" class="${p?.known ? 'on' : ''}" aria-label="I know this one" title="I know this one">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M8.3 12.3l2.5 2.5 5-5.2"/></svg></button>
      ${c.k ? `<div class="kanji">${esc(c.k)}</div>` : ''}
      <div class="kana${[...c.f].length > 7 ? ' long' : ''}">${esc(c.f)}</div>
      <button id="say" aria-label="Say it" title="Say it">${SPEAKER}</button>
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
    <div class="row">
      ${revealed ? `
        <button id="again">${ic('again')}Forgot<span class="s">again</span></button>
        <button id="good">${ic('gotit')}Knew it<span class="s">${nextIn(c, 'good')}</span></button>
        <button id="easy">${ic('hint')}Easy<span class="s">${nextIn(c, 'easy')}</span></button>`
      : `<button id="reveal">${ic('start')}Show</button>`}
      <button id="skip" aria-label="Skip this word" title="Skip: it does not come back in this lesson">
        <svg viewBox="0 0 24 24"><path d="M5 12h13M13 6.5l6 5.5-6 5.5"/></svg><span class="s">skip</span></button>
    </div>`;

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
  // The same as a swipe forward: past this word, and not again in this lesson.
  $('skip').addEventListener('click', skip);
  // The eye and the tick are on the card, so their tap must not also turn it over.
  for (const [btn, key, on, off] of [['hide', 'hide', 'hidden', 'shown'], ['know', 'known', 'known', 'unknown']]) {
    $(btn).addEventListener('click', (e) => {
      e.stopPropagation();
      const before = snap(c);
      moveOn(c, before, flipMark(c.f, key) ? on : off);
    });
  }
  for (const g of ['again', 'good', 'easy']) {
    $(g)?.addEventListener('click', () => {
      const before = snap(c);
      answer(c, g);
      moveOn(c, before, g);
    });
  }
  bindPri($('face'), draw);
}

// ---------------------------------------------------------------- swipes
// Every card she moved on from, newest last, with the word as it was before -
// so a swipe back can put the card on screen again and undo what she did to it.
const past = [];
const snap = (c) => progress[c.f] && { ...progress[c.f] };
/** What adds to "done today": a word she knew, or ticked as known. Hiding one
 *  as not important is not learning it. */
const counted = (how) => how === 'good' || how === 'easy' || how === 'known';
const MARKS = new Set(['known', 'unknown', 'hidden', 'shown']);

/** `how`: her answer (again, good, easy), a skip, the tick (known, unknown) or
 *  the eye (hidden, shown). A forgotten or skipped card waits for the end of the lesson. */
function moveOn(c, before, how) {
  const noted = !MARKS.has(how) && !first.has(c.f);
  past.push({ c, before, how, noted, repeating: lesson.repeating });
  if (noted) first.set(c.f, how);
  // A word she forgot comes round once more; one she skipped is done with for
  // this lesson - she waved it past, and it must not turn up at the end either.
  if (how === 'again') again.push(c);
  if (shownAt) { countTime((Date.now() - shownAt) / 1000); shownAt = 0; }
  if (counted(how)) countDone();
  render();
}

const onCards = () => $('main').className === 'study' && !$('pop');

/** A swipe to the left, or the skip button: past this card, and not again in
 *  this lesson. Nothing about the word itself is saved. */
export function skip() {
  if (onCards() && current) moveOn(current, snap(current), 'skip');
}

/** A swipe to the right: the card before, back on screen, with whatever she did
 *  to it undone so she can answer it again. */
export function back() {
  const h = onCards() && past.pop();
  if (!h) return;
  // A forgotten one waits at the end of the lesson - or is on screen again, when
  // it was the last card. A skipped one is in neither list to take out.
  if (h.how === 'again') {
    if (current === h.c) current = null;
    else for (const list of [again, queue]) {
      const i = list.lastIndexOf(h.c);
      if (i >= 0) { list.splice(i, 1); break; }
    }
  }
  if (h.before) progress[h.c.f] = h.before; else delete progress[h.c.f];
  saveProgress();
  if (counted(h.how)) uncountDone();
  if (h.noted) first.delete(h.c.f);
  lesson.repeating = h.repeating;
  if (current) queue.unshift(current);
  queue.unshift(h.c);
  render();
}

/** The bookmark button in the header, which must not redraw a revealed card. */
export function toggleStar() {
  if (!current) return;
  $('star').className = 'icon' + (flipStar(current.f) ? ' starred' : '');
}
