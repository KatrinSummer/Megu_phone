// A word of hers tapped inside an example sentence: what it is, which deck it
// lives in and how she is doing with it, in a small box right above it.
import { $, esc } from './dom.js';
import { progress, lifetime, flipStar } from './store.js';
import { deck, flipKnown } from './boards.js';
import { isMemorized } from './schedule.js';
import { play, SPEAKER } from './sound.js';

// The deck arrives once, before the first card is drawn.
let byFront = null;
const cardOf = (f) => (byFront ??= new Map(deck.cards.map((c) => [c.f, c]))).get(f);

/** The kana line of a sentence, with every other word of hers in it tappable.
 *  ChatGPT spaces the kana word by word, so her word is one piece of it; a verb
 *  he wrote bent (およいだ) is not one of her cards and stays plain. */
export const yomi = (k, self) => k.split(' ').map((t) => (t !== self && cardOf(t)
  ? `<span class="w" data-f="${esc(t)}">${esc(t)}</span>` : esc(t))).join(' ');

const deckName = (id) => deck.decks.find((d) => d.id === id)?.name ?? id;

function status(c) {
  const p = progress[c.f];
  if (p?.known) return 'marked as known';
  if (isMemorized(c)) return 'memorized';
  if (p && (lifetime(p) || p.lapses)) {
    return `learning · ${lifetime(p)} reviews${p.lapses ? ` · ${p.lapses} slips` : ''}`;
  }
  return 'not started yet';
}

const closeWord = () => $('pop')?.remove();

export function openWord(el) {
  const c = cardOf(el.dataset.f);
  closeWord();
  const pop = document.createElement('div');
  pop.id = 'pop';
  document.body.append(pop);
  // The rest of the screen is a clear sheet: a tap there only closes the box,
  // it does not turn the card or say the sentence.
  pop.addEventListener('click', (e) => { if (e.target === pop) closeWord(); });
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
      </div></div>`;
    pop.querySelector('.say').onclick = () => play(c);
    pop.querySelector('.star').onclick = () => { flipStar(c.f); draw(); };
    pop.querySelector('.known').onclick = () => { flipKnown(c.f); draw(); };
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
