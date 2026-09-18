// The boards, laid out the way she drew them: the name of the screen, a row of
// filters, and one card per board with an icon of its own.
//
// It knows nothing about what a board *is* - that is boards.js - and opens
// nothing itself: a tap hands the board over to its page.
import { $, esc } from './dom.js';
import { progress, started } from './store.js';
import { deck, poolOf, isOutBoard, isNew, isDue } from './boards.js';
import { isMemorized } from './schedule.js';
import { ic } from './icons.js';
import { ring } from './ring.js';
import { leave } from './screens.js';
import { openBoard, boardName } from './page.js';
import { markTab } from './nav.js';

/** Her icon for a board.  The four made-up ones have their own; a deck of hers
 *  takes the next picture off the list, so no two of them are the same flower. */
const BOARD_ICONS = { learning: 'learning', star: 'favorite', pri: 'streak',
                      known: 'archive', hidden: 'hidden' };
const MINE = ['category', 'repeat', 'picture', 'streak', 'goal', 'language', 'theme', 'calendar'];
const boardIcon = (id) => BOARD_ICONS[id]
  ?? MINE[deck.decks.findIndex((d) => d.id === id) % MINE.length] ?? 'deck';

const FILTERS = [['all', 'All'], ['new', 'New'], ['learn', 'Learning'], ['know', 'Learned'], ['due', 'Due']];
// The filter is remembered while the app is open, the same as a board's own.
let filter = 'all';

/** What a board holds.  The Known and Hidden boards are out of the round, so
 *  nothing on them is new or due - they are where words go to sit. */
function counts(id) {
  const cards = poolOf(id), out = isOutBoard(id);
  return {
    total: cards.length,
    new: out ? 0 : cards.filter(isNew).length,
    due: out ? 0 : cards.filter(isDue).length,
    learn: cards.filter((c) => started(progress[c.f]) && !isMemorized(c)).length,
    know: cards.filter((c) => isMemorized(c) || progress[c.f]?.known).length,
  };
}
const passes = (n) => filter === 'all' || n[filter] > 0;

// She drew one line under a board's name and it is the size of the board.  What
// is new and what is due is what the filters and the ring are for.
const note = (n) => (n.total ? `${n.total} words` : 'empty');

export function home() {
  leave();
  markTab('decks');
  const some = (k) => Object.values(progress).some((p) => p[k]);
  const ids = ['learning', 'star',
    ...(Object.values(progress).some((p) => p.pri === 1) ? ['pri'] : []),
    ...deck.decks.map((d) => d.id),
    ...(some('known') ? ['known'] : []), ...(some('hide') ? ['hidden'] : [])];
  $('star').hidden = $('back').hidden = true;
  $('stats').hidden = true;
  // The name of the screen is on the screen now, in her big heading, so the
  // header keeps quiet: it said "Decks" twice.
  $('counts').innerHTML = '';
  $('counts').title = 'pick a board';

  const rows = ids.map((id) => [id, counts(id)]).filter(([, n]) => passes(n));
  $('main').className = 'home';
  $('main').innerHTML = `
    <div class="head">${ic('category', '44px')}<h1>Decks</h1>
      <span class="s">${deck.decks.length} boards</span></div>
    <div class="chips">${FILTERS.map(([k, name]) =>
      `<button data-k="${k}"${k === filter ? ' class="on"' : ''}>${name}</button>`).join('')}</div>
    ${rows.map(([id, n]) => `<button class="deck" data-id="${esc(id)}" ${n.total ? '' : 'disabled'}>
      ${ic(boardIcon(id))}<span class="n">${esc(boardName(id))}<span class="s">${note(n)}</span></span>
      ${ring(poolOf(id), '42px')}<span class="go">›</span></button>`).join('')
      || '<div class="note">No board has anything under this filter.</div>'}`;

  for (const b of document.querySelectorAll('.chips button')) {
    b.addEventListener('click', () => { filter = b.dataset.k; home(); });
  }
  for (const b of document.querySelectorAll('.deck')) {
    b.addEventListener('click', () => openBoard(b.dataset.id));
  }
}
