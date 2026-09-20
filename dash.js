// Home: how today stands, and the one button that starts it.
//
// Everything here is a way into a screen that already exists - a board's page,
// the board list - so this screen holds no rules of its own about what she is
// shown next.  It only counts.
import { $ } from './dom.js';
import { progress, settings, saveSettings, doneToday } from './store.js';
import { deck, poolOf, learnable, isDue } from './boards.js';
import { isMemorized } from './schedule.js';
import { ic } from './icons.js';
import { ring } from './ring.js';
import { leave, begin, ground } from './screens.js';
import { home } from './decks.js';
import { openBoard } from './page.js';
import { pickBoard } from './pick.js';
import { markTab } from './nav.js';

/** The board the big button starts.  Her last one while it still has new words
 *  in it, otherwise the newest lesson, which is the one she is usually after. */
const studyBoard = () => (learnable(settings.deck).length ? settings.deck
  : learnable('last').length ? 'last' : settings.deck);

export function dash() {
  leave();
  ground(true);                                 // Home is the one screen she keeps on the island
  markTab('home');
  $('star').hidden = $('back').hidden = true;
  $('stats').hidden = true;
  $('counts').innerHTML = '';                   // the heading on the screen says it
  $('counts').title = 'Megu';

  const all = Object.values(progress);
  const learned = deck.cards.filter((c) => isMemorized(c) || progress[c.f]?.known).length;
  const hid = all.filter((p) => p.hide).length;
  const due = poolOf('learning').filter(isDue).length;
  const board = studyBoard();
  const fresh = learnable(board).length;
  const stars = all.filter((p) => p.star).length;
  const pri = all.filter((p) => p.pri === 1).length;
  const done = doneToday();

  $('main').className = 'dash';
  $('main').innerHTML = `
    <div class="ring">
      ${ring(deck.cards, '158px', `<div class="mid"><span class="n">${deck.cards.length}</span>
        <span class="l">words</span>${done ? `<span class="l today">${done} today</span>` : ''}</div>`)}
    </div>
    <div class="duo">
      <button id="d-known">${ic('archive')}<span><b>${learned}</b><span>learned</span></span></button>
      <button id="d-hidden">${ic('hidden')}<span><b>${hid}</b><span>hidden</span></span></button>
    </div>
    <button class="big" id="d-start">${due ? `Repeat ${Math.min(settings.perDay, due)}`
      : 'Start studying'}</button>
    <button class="tile" id="d-jungle">${ic('jungle')}
      <span class="n">Jungle<span class="s">15 to 30 words from every board</span></span>
      <span class="go">›</span></button>
    <button class="tile" id="d-decks">${ic('decks')}
      <span class="n">Decks<span class="s">${deck.decks.length} boards</span></span><span class="go">›</span></button>
    <button class="tile" id="d-star">${ic('favorite')}
      <span class="n">My favourites</span><span class="v">${stars}</span><span class="go">›</span></button>
    <button class="tile" id="d-pri">${ic('streak')}
      <span class="n">Priorities<span class="s">the ones she asked for more often</span></span>
      <span class="v">${pri}</span><span class="go">›</span></button>`;

  // Her one pink button, and it reads the day: anything due is a repeat and
  // needs no button of its own; otherwise it is a lesson where she was last; and
  // with nothing new left there, it asks her which board to open.
  $('d-start').addEventListener('click', () => {
    settings.deck = due ? 'learning' : board;
    settings.mode = due ? 'review' : 'learn';
    saveSettings();
    if (!due && !fresh) return pickBoard();
    begin();
  });
  // A run through the jungle: words from every board, mostly ones she is meeting
  // for the first time.  It belongs to no board, so it leaves her last one alone.
  $('d-jungle').addEventListener('click', () => {
    settings.mode = 'jungle';
    saveSettings();
    begin();
  });
  $('d-known').addEventListener('click', () => openBoard('known'));
  $('d-hidden').addEventListener('click', () => openBoard('hidden'));
  $('d-star').addEventListener('click', () => openBoard('star'));
  $('d-pri').addEventListener('click', () => openBoard('pri'));
  $('d-decks').addEventListener('click', () => { markTab('decks'); home(); });
}
