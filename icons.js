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

/** Her board pictures, on a sheet of their own (img/boards.webp, same 96px
 *  cells, 8 across): the chalkboard a new board is given, then the jungle, the
 *  sea and the holiday rows she drew for her to pick from. */
export const BOARD_ART = [
  'board',
  'leaf', 'mushroom', 'stump', 'fern', 'steps', 'map', 'compass', 'lantern', 'binoculars', 'backpack',
  'clownfish', 'bluefish', 'puffer', 'angelfish', 'pinkfish', 'shell', 'starfish', 'coral', 'pearl', 'wave',
  'pineapple', 'melon', 'ice', 'coconut', 'bento', 'lamp', 'clock', 'mug', 'notebook', 'satchel',
];
const bat = new Map(BOARD_ART.map((n, i) => [n, [i % COLS, (i / COLS) | 0]]));

/** A picture of hers that is not on the sheet, and has a file to itself.  The
 *  gear is one: her sheet draws Settings as a flower, but the phone she drew has
 *  a gear down in the bar.  The books for the boards and the jungle for the
 *  random run she drew later, on a sheet of their own. */
const OWN = { gear: 'img/gear.webp', decks: 'img/decks.webp', jungle: 'img/jungle.webp' };
/** Her night sheet draws these worse than her day sheet, so
 *  after dark they are taken off the day one and turned down to suit the night. */
const DAYLIT = new Set(['hidden']);

/** A plain gear, and drawn rather than typed: the ⚙ character comes out of the
 *  phone as its own coloured emoji whatever is asked of it.  It is the handle on
 *  something that has a setting of its own - how many words the big button
 *  deals, which picture a board wears. */
export const COG = (id, label) => `<span class="cog" id="${id}" role="button" tabindex="0"
  aria-label="${label}"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/>
    <path d="M19.4 13.5a7.6 7.6 0 000-3l2-1.6-2-3.4-2.4 1a7.6 7.6 0 00-2.6-1.5L14 2h-4l-.4 2.6a7.6
      7.6 0 00-2.6 1.5l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 000 3l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 002.6
      1.5L10 22h4l.4-2.6a7.6 7.6 0 002.6-1.5l2.4 1 2-3.4z"/></svg></span>`;

/** One icon. `size` is a css length: the cell scales to it, and the sheet with it.
 *  A name that is not on the sheet draws nothing rather than a slice of its
 *  neighbour, so a typo is visible instead of quietly wrong. */
export function ic(name, size = '') {
  const night = document.documentElement.dataset.theme === 'dark';
  const own = OWN[name];
  if (own) {
    return `<i class="ic own" aria-hidden="true"
      style="--own:url(${own})${size ? `;--s:${size}` : ''}"></i>`;
  }
  const board = bat.get(name);
  if (board) {
    return `<i class="ic bd" aria-hidden="true"
      style="--x:${board[0]};--y:${board[1]}${size ? `;--s:${size}` : ''}"></i>`;
  }
  const cell = at.get(name);
  if (!cell) return '';
  const [x, y] = cell;
  const lit = night && DAYLIT.has(name) ? ' day' : '';
  return `<i class="ic${lit}" aria-hidden="true" style="--x:${x};--y:${y}${size ? `;--s:${size}` : ''}"></i>`;
}
