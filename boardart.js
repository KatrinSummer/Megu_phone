// A board's picture: the one it wears in the list and on its own page, and the
// strip of her drawings she picks it from.
//
// The made-up boards - Review, Bookmarks, Priorities, Known, Hidden - wear a
// picture that says what they are, and it is not hers to change: a board of
// bookmarks with a mushroom on it would only be a board she cannot find.
import { settings, saveSettings } from './store.js';
import { deck } from './boards.js';
import { BOARD_ART, ic } from './icons.js';

const FIXED = { learning: 'learning', star: 'favorite', pri: 'streak',
                known: 'archive', hidden: 'hidden' };
/** What her decks wore before she could choose: the next drawing off her first
 *  sheet, one each, so no two of them were the same flower. */
const MINE = ['category', 'repeat', 'picture', 'streak', 'goal', 'language', 'theme', 'calendar'];

/** Only a deck of her own has a picture to change. */
export const canPick = (id) => !FIXED[id];

/** Once, as soon as the deck has landed: the boards she already had keep what
 *  they were wearing, so this version changes nothing she can see.  A board made
 *  after it starts life with the chalkboard, and any of them can be changed. */
function freeze() {
  if (settings.artSet || !deck.decks.length) return;
  settings.boardArt ??= {};
  deck.decks.forEach((d, i) => { settings.boardArt[d.id] ??= MINE[i % MINE.length]; });
  settings.artSet = 1;
  saveSettings();
}

export function boardIcon(id) {
  freeze();
  return FIXED[id] ?? settings.boardArt?.[id] ?? 'board';
}

/** Her drawings, on the same wooden sign as the word count, dropping out from
 *  under the board's name. */
export const artRow = (id) => `<div class="drop" id="b-art"><div class="cnt art">
  <span class="n">Board icon</span>
  <div class="pics">${BOARD_ART.map((n) => `<button data-a="${n}"${
    n === boardIcon(id) ? ' class="on"' : ''} aria-label="${n}">${ic(n, '38px')}</button>`).join('')}</div>
  </div></div>`;

/** Picking one changes the picture where it is on the screen and nothing else:
 *  the board's page is not drawn again under her finger. */
export function bindArt(id, onPick) {
  const pics = document.querySelectorAll('#b-art .pics button');
  for (const b of pics) {
    b.addEventListener('click', () => {
      settings.boardArt ??= {};
      settings.boardArt[id] = b.dataset.a;
      saveSettings();
      for (const o of pics) o.classList.toggle('on', o === b);
      onPick(b.dataset.a);
    });
  }
}
