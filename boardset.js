// A board's own settings, opened from inside the board itself: which way round
// its cards stand, and how many words it deals at a time.
//
// Per board on purpose - she asked for them inside each board, not in the one
// Settings screen. A board of verbs she is drilling and a board she is only
// reading through want different answers, and the app's own setting stays the
// fallback for every board that has never been touched.
import { settings, saveSettings, lessonSize } from './store.js';

/** What this board has been given, if anything. Absent means "as the app says". */
const of = (id) => ((settings.boardSet ??= {})[id] ??= {});

/** English on the face of the card, her word as the answer. Off by default:
 *  reading the Japanese is what she is here for, and recalling it from English
 *  is the harder drill she turns on when she wants it. */
export const boardBack = (id) => !!of(id).back;

/** How many words this board deals. Falls back to the app's own number, which
 *  is also where Random lives - a board that has never been set follows it. */
export const boardWords = (id) => of(id).per ?? lessonSize();

/** The panel, on the same sliding shelf as the board's pictures. */
export const boardSetRow = (id) => `<div class="drop" id="b-set"><div><div class="pane">
  <div class="set"><span class="n">English first</span>
    <button class="sw${boardBack(id) ? ' on' : ''}" id="s-back" role="switch"
      aria-checked="${boardBack(id)}" aria-label="English first"></button></div>
  <div class="set"><span class="n">Words at a time</span>
    <input id="s-per" type="number" min="0" max="100" value="${of(id).per ?? ''}"
      placeholder="${lessonSize()}" aria-label="Words at a time on this board"></div>
  </div></div></div>`;

/** Changing one saves it at once - there is no Done button on a shelf.
 *  An empty count is not zero: it is "follow the app", so it is stored as
 *  nothing at all rather than as a number she never chose. */
export function bindBoardSet(id) {
  const sw = document.getElementById('s-back');
  sw?.addEventListener('click', () => {
    const on = !boardBack(id);
    of(id).back = on ? 1 : 0;
    saveSettings();
    sw.classList.toggle('on', on);
    sw.setAttribute('aria-checked', String(on));
  });
  const per = document.getElementById('s-per');
  per?.addEventListener('change', () => {
    const n = Number(per.value);
    if (per.value.trim() === '' || !Number.isFinite(n) || n <= 0) delete of(id).per;
    else of(id).per = Math.min(100, Math.round(n));
    per.value = of(id).per ?? '';
    saveSettings();
  });
}
