// A word of hers tapped inside an example sentence: what it is, which deck it
// lives in and how she is doing with it, in a small box right above it.
import { $, esc } from './dom.js';
import { progress, lifetime, flipStar, started } from './store.js';
import { deck, flipMark, cardOf } from './boards.js';
import { isMemorized } from './schedule.js';
import { play, SPEAKER } from './sound.js';
import { priButtons, bindPri } from './priority.js';

/** The colour of her word in a sentence: green once she knows it, orange while
 *  she is learning it, grey before she has started it. */
export const stateOf = (c) => (isMemorized(c) ? 'know' : started(progress[c.f]) ? 'learn' : 'new');

/** Whether a piece of the kana is her word, not just spelled like it: は the
 *  particle is not は the tooth. It is hers where the sentence writes its kanji,
 *  where ChatGPT glossed it, or where it stands in kana and is longer than the
 *  one-letter particles. */
const inSentence = (c, x) => (!!c.k && x.t.includes(c.k))
  || (x.w ?? []).some(([k]) => k === c.f)
  || ([...c.f].length > 1 && x.t.includes(c.f));

/** A gloss hung on a one-letter particle, carrying the meaning of a card spelled
 *  the same way: は the particle wearing 歯 "tooth", か wearing 蚊 "mosquito".
 *  The card is real - it simply is not the word standing here, and its kanji is
 *  how that shows: 歯 is nowhere in "夏、友達は熱中症です", but は is.
 *  と keeps its gloss: her card for it carries no kanji, because it IS the
 *  particle, and "and" is what it means. */
const homograph = (k, x) => {
  const c = [...k].length === 1 && cardOf(k);
  return !!c && !!c.k && !x.t.includes(c.k);
};

/** ChatGPT's list of words under a sentence, minus the one being shown - its
 *  meaning is right above - and minus the particles wearing someone else's. */
export const glosses = (x, self) =>
  (x.w ?? []).filter(([k]) => k !== self && !homograph(k, x));

/** The kana line of a sentence, with every other word of hers in it tappable.
 *  ChatGPT spaces the kana word by word, so her word is one piece of it; a verb
 *  he wrote bent (およいだ) is not one of her cards and stays plain. */
export const yomi = (x, self) => x.k.split(' ').map((t) => {
  const c = t !== self && cardOf(t);
  return c && inSentence(c, x)
    ? `<span class="w ${stateOf(c)}" data-f="${esc(t)}">${esc(t)}</span>` : esc(t);
}).join(' ');

const deckName = (id) => deck.decks.find((d) => d.id === id)?.name ?? id;

function status(c) {
  const p = progress[c.f];
  if (p?.known) return 'marked as known';
  if (p?.hide) return 'hidden, not important';
  if (isMemorized(c)) return 'memorized';
  if (started(p)) {
    return `learning · ${lifetime(p)} reviews${p.lapses ? ` · ${p.lapses} slips` : ''}`;
  }
  return 'not started yet';
}

const closeWord = () => $('pop')?.remove();

/** `onClose` runs once the box is closed, for a screen that shows what she changed. */
export function openWord(el, onClose) {
  const c = cardOf(el.dataset.f);
  closeWord();
  const pop = document.createElement('div');
  pop.id = 'pop';
  document.body.append(pop);
  // The rest of the screen is a clear sheet: a tap there only closes the box,
  // it does not turn the card or say the sentence.
  pop.addEventListener('click', (e) => { if (e.target === pop) { closeWord(); onClose?.(); } });
  const draw = () => {
    const p = progress[c.f];
    pop.innerHTML = `<div class="box" role="dialog" aria-label="${esc(c.f)}">
      <div class="top"><b>${esc(c.f)}</b>${c.k ? `<span class="k">${esc(c.k)}</span>` : ''}
        <button class="say" aria-label="Say it">${SPEAKER}</button></div>
      <div class="e">${esc(c.e)}</div>
      <div class="m">${esc([deckName(c.d), c.last && deckName(c.last)].filter(Boolean).join(' · '))}</div>
      <div class="m">${status(c)}</div>
      <div class="acts">
        <button class="star${p?.star ? ' on' : ''}">${p?.star ? 'Bookmarked' : 'Bookmark'}</button>
        <button class="known${p?.known ? ' on' : ''}">${p?.known ? 'Known' : 'I know it'}</button>
        <button class="hide${p?.hide ? ' on' : ''}">${p?.hide ? 'Hidden' : 'Hide'}</button>
      </div>${priButtons(c.f)}</div>`;
    pop.querySelector('.say').onclick = () => play(c);
    pop.querySelector('.star').onclick = () => { flipStar(c.f); draw(); };
    pop.querySelector('.known').onclick = () => { flipMark(c.f, 'known'); draw(); };
    pop.querySelector('.hide').onclick = () => { flipMark(c.f, 'hide'); draw(); };
    bindPri(pop, draw);
    // What she changes here shows at once in the sentence under the box.
    for (const w of document.querySelectorAll('.ex .w')) {
      if (w.dataset.f === c.f) w.className = `w ${stateOf(c)}`;
    }
    place(pop.firstElementChild, el.getBoundingClientRect());
  };
  draw();
}

/** Above the word, or below it when there is no room up there; never off the side. */
function place(box, r) {
  const w = box.offsetWidth, h = box.offsetHeight, m = 8;
  box.style.left = `${Math.min(Math.max(m, r.left + r.width / 2 - w / 2), innerWidth - w - m)}px`;
  box.style.top = `${r.top - h - m >= m ? r.top - h - m : r.bottom + m}px`;
}
