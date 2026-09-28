// The bar along the bottom: the four places the app has, the way she drew them.
//
// "Home" is the screen that says how today stands; "Decks" is the list of
// boards, which is what the app used to open on and what screens.js still calls
// home().  The two names are hers, from the concept, and only look swapped here.
import { $ } from '../core/dom.js';
import { ic } from '../core/icons.js';
import { home } from '../boards/decks.js';
import { dash } from './dash.js';
import { statsPage } from '../stats/statsview.js';
import { settingsPage } from '../core/settings.js';
import { worldPage } from './world.js';
import { questsOpen } from './quest.js';

/** The island sits to the LEFT of Home, where she drew it, and it is on the bar
 *  from the start - but it does not answer to a tap until the story has put her
 *  there: washed up, the talk, the question about her language, her note, and
 *  then the island. A tab that appears out of nowhere is a bar that changes
 *  shape under her thumb; one that is there and dim is a place she has not been
 *  yet. */
const TABS = [
  ['world', 'World', 'world', () => worldPage()],
  ['home', 'Home', 'home', () => dash()],
  ['decks', 'Decks', 'decks', () => home()],
  ['stats', 'Stats', 'stats', () => statsPage()],
  ['settings', 'Settings', 'gear', () => settingsPage()],
];
const shut = (id) => id === 'world' && !questsOpen();

/** Which tab is lit. A board's page and a lesson belong to Decks, so the bar
 *  keeps saying where she is even when she is two screens deep. */
export function markTab(id) {
  for (const b of document.querySelectorAll('#tabs button')) {
    b.classList.toggle('on', b.dataset.tab === id);
    b.setAttribute('aria-current', b.dataset.tab === id ? 'page' : 'false');
  }
}

export function buildNav() {
  $('tabs').innerHTML = TABS.map(([id, name, icon]) =>
    `<button data-tab="${id}" aria-label="${name}"${shut(id) ? ' disabled' : ''}
      >${ic(icon)}<span>${name}</span></button>`).join('');
  for (const [id, , , go] of TABS) {
    document.querySelector(`#tabs [data-tab="${id}"]`)
      .addEventListener('click', () => { if (!shut(id)) { markTab(id); go(); } });
  }
}
