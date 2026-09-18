// Her icons. They are drawn on one sheet per theme (img/sprite-day.webp and
// sprite-night.webp), cut from the two sheets she made, 42 icons in cells of
// 96px, 8 across. One file, so the phone fetches one picture instead of forty.
//
// The sheet to use is a CSS variable, so the night set arrives by swapping one
// url and nothing here knows about themes.

/** The order the icons sit in on the sheet. The sheet is built from this list -
 *  moving a name here without cutting the sheet again moves the wrong picture. */
export const NAMES = [
  'home', 'repeat', 'stats', 'settings', 'deck', 'category', 'tag', 'favorite',
  'archive', 'hidden', 'start', 'again2', 'again', 'missed', 'gotit',
  'new', 'learning', 'learned', 'due', 'calendar', 'all',
  'back', 'menu', 'search', 'more',
  'audio', 'example', 'hint', 'shuffle', 'progress',
  'language', 'reminders', 'goal', 'pronunciation', 'theme', 'picture',
  'streak', 'time', 'chart', 'import', 'export', 'backup',
];
export const COLS = 8;

const at = new Map(NAMES.map((n, i) => [n, [i % COLS, (i / COLS) | 0]]));

/** One icon. `size` is a css length: the cell scales to it, and the sheet with it.
 *  A name that is not on the sheet draws nothing rather than a slice of its
 *  neighbour, so a typo is visible instead of quietly wrong. */
export function ic(name, size = '') {
  const cell = at.get(name);
  if (!cell) return '';
  const [x, y] = cell;
  return `<i class="ic" aria-hidden="true" style="--x:${x};--y:${y}${size ? `;--s:${size}` : ''}"></i>`;
}
