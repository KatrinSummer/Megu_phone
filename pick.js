// "Which board?" - the window the big button opens when there is nothing left
// to repeat and nothing new where she was last.  Her boards in a list, one tap
// to start on one of them.
import { $, esc } from './dom.js';
import { settings, saveSettings } from './store.js';
import { deck, learnable, poolOf } from './boards.js';
import { begin } from './screens.js';
import { openBoard, boardName, boardIcon } from './page.js';
import { ic } from './icons.js';

export function pickBoard() {
  $('pop')?.remove();
  const pop = document.createElement('div');
  pop.id = 'pop';
  pop.className = 'mid';
  // The rest of the screen is a clear sheet: a tap there closes the window.
  pop.addEventListener('click', (e) => { if (e.target === pop) pop.remove(); });
  pop.innerHTML = `<div class="box" role="dialog" aria-label="Pick a board">
    <div class="top"><b>Pick a board</b></div>
    <div class="list">${deck.decks.map((d) => {
      const n = learnable(d.id).length;
      return `<button class="tile" data-id="${esc(d.id)}">${ic(boardIcon(d.id))}
        <span class="n">${esc(boardName(d.id))}<span class="s">${
          n ? `${n} new` : `${poolOf(d.id).length} words, all started`}</span></span>
        <span class="go">›</span></button>`;
    }).join('')}</div></div>`;
  document.body.append(pop);

  for (const b of pop.querySelectorAll('.tile')) {
    b.addEventListener('click', () => {
      const id = b.dataset.id;
      pop.remove();
      settings.deck = id;
      saveSettings();
      // A board with nothing new left opens its own page, where she can review it.
      if (!learnable(id).length) return openBoard(id, 'home');
      settings.mode = 'learn';
      begin();
    });
  }
}
