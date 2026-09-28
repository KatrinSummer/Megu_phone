// The end of the lesson: how it went, what she forgot, and the way back.
//
// Its own file because it is its own screen - the card is one subject and the
// page that comes after the last card is another, and screens.js had grown
// past the 300 lines everything here is held to.
import { $, esc } from './dom.js';
import { progress, settings, today } from './store.js';
import { deck, learnable, reviewable, isOut } from './boards.js';
import { first } from './lesson.js';
import { openBoard, cameFromHome } from './page.js';
// Home, and the button that deals another lesson.  Both only ever run from a
// button here, so neither file waits on the other to load.
import { dash } from './dash.js';
import { begin } from './screens.js';

export function summary() {
  const how = [...first.values()];
  const n = (k) => how.filter((v) => v === k).length;
  const rows = [['Words', how.length], ['Normal', n('good')], ['Easy', n('easy')],
    ['Hard', n('hard')], ['Again', n('again')], ['Skipped', n('skip')]]
    .filter(([, v], i) => !i || v);
  // The ones she did not have at all.  A word she got slowly is not one of
  // them: Hard is an answer, Again is not having the word.
  const missed = [...first].filter(([, v]) => v === 'again').map(([f]) => f);
  // What is left: a review has the words not seen today, a lesson its new words.
  const rev = settings.mode === 'review', wild = settings.mode === 'jungle', id = settings.deck;
  // Where the way back leads: a jungle run belongs to no board, and a lesson
  // started at Home never came through a board's page.
  const toHome = wild || cameFromHome();
  const left = wild ? deck.cards.filter((c) => !isOut(c)).length
    : (rev ? reviewable(id).filter((c) => progress[c.f]?.seen !== today()) : learnable(id)).length;
  const more = wild ? Number(left > 0) : Math.min(settings.perDay, left);
  // The lesson is over, so the bar along the bottom comes back with the summary -
  // and with it the arrow, in place of the Finish that has nothing left to end.
  $('finish').hidden = true;
  $('back').hidden = false;
  $('main').className = 'page';
  $('main').innerHTML = `<div class="done"><h2>${how.length ? 'Lesson done' : 'Done for today'}</h2>
    ${how.length ? `<table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>` : ''}
    ${missed.length ? `<div class="note">Again: ${missed.map(esc).join(' · ')}</div>` : ''}
    <div>${wild ? `${left} words are out there in the jungle.`
      : rev ? `${left} more to review today.` : left ? `${left} new words left on this board.`
      : 'Every word of this board has been started: review them from its page.'}</div>
    <button class="wide" id="boards">${toHome ? 'Back home' : 'Back to the board'}</button>
    ${more ? `<button class="wide" id="more">${wild ? 'Into the jungle again'
      : settings.rand ? (rev ? 'Review more' : 'Show more new words')
      : rev ? `Review ${more} more` : `Show ${more} more new words`}</button>` : ''}</div>`;
  // Back the way she came in: the jungle belongs to no board, and a lesson
  // started at Home never came through a board's page either.
  $('boards').addEventListener('click', () => (toHome ? dash() : openBoard(id)));
  $('more')?.addEventListener('click', begin);
}
