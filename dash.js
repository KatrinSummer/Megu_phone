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
import { leave, begin, home } from './screens.js';
import { openBoard } from './page.js';
import { markTab } from './nav.js';

/** The board the big button starts.  Her last one while it still has new words
 *  in it, otherwise the newest lesson, which is the one she is usually after. */
const studyBoard = () => (learnable(settings.deck).length ? settings.deck
  : learnable('last').length ? 'last' : settings.deck);

export function dash() {
  leave();
  markTab('home');
  $('star').hidden = $('back').hidden = true;
  $('stats').hidden = true;
  $('counts').innerHTML = '<b>Megu</b>';
  $('counts').title = 'Megu';

  const all = Object.values(progress);
  const learned = deck.cards.filter((c) => isMemorized(c) || progress[c.f]?.known).length;
  const hid = all.filter((p) => p.hide).length;
  const due = poolOf('learning').filter(isDue).length;
  const started = poolOf('learning').length;
  const board = studyBoard();
  const fresh = learnable(board).length;
  const stars = all.filter((p) => p.star).length;
  const done = doneToday();

  $('main').className = 'dash';
  $('main').innerHTML = `
    <div class="pane ring">
      <span class="n">${deck.cards.length}</span><span class="l">words</span>
      ${done ? `<span class="l" style="letter-spacing:0;text-transform:none">${done} done today</span>` : ''}
    </div>
    <div class="duo">
      <button id="d-known">${ic('archive')}<span><b>${learned}</b><span>learned</span></span></button>
      <button id="d-hidden">${ic('hidden')}<span><b>${hid}</b><span>hidden</span></span></button>
    </div>
    <button class="tile" id="d-repeat">${ic('learning')}
      <span class="n">Repeat<span class="s">${started} started</span></span>
      <span class="v">${due || 'none'} due</span><span class="go">›</span></button>
    <button class="big" id="d-start">${ic('start')}${fresh ? 'Start studying' : 'Open the board'}</button>
    <button class="tile" id="d-decks">${ic('deck')}
      <span class="n">Decks<span class="s">${deck.decks.length} boards</span></span><span class="go">›</span></button>
    <button class="tile" id="d-star">${ic('favorite')}
      <span class="n">My favourites</span><span class="v">${stars}</span><span class="go">›</span></button>`;

  // The big button starts the lesson itself; everything else opens a page.
  $('d-start').addEventListener('click', () => {
    settings.deck = board;
    if (!fresh) return openBoard(board);
    settings.mode = 'learn';
    saveSettings();
    begin();
  });
  $('d-repeat').addEventListener('click', () => openBoard('learning'));
  $('d-known').addEventListener('click', () => openBoard('known'));
  $('d-hidden').addEventListener('click', () => openBoard('hidden'));
  $('d-star').addEventListener('click', () => openBoard('star'));
  $('d-decks').addEventListener('click', () => { markTab('decks'); home(); });
}
