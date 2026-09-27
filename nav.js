// The bar along the bottom: the four places the app has, the way she drew them.
//
// "Home" is the screen that says how today stands; "Decks" is the list of
// boards, which is what the app used to open on and what screens.js still calls
// home().  The two names are hers, from the concept, and only look swapped here.
import { $ } from './dom.js';
import { ic } from './icons.js';
import { home } from './decks.js';
import { dash } from './dash.js';
import { statsPage } from './statsview.js';
import { settingsPage } from './settings.js';
import { worldPage } from './world.js';
import { questsOpen } from './quest.js';

const TABS = [
  ['home', 'Home', 'home', () => dash()],
  ['decks', 'Decks', 'decks', () => home()],
  ['stats', 'Stats', 'stats', () => statsPage()],
  ['settings', 'Settings', 'gear', () => settingsPage()],
];

/** The island opens to the LEFT of Home, where she drew it, and only once the
 *  intro has been played: it is the place the story lets her out on to, and a
 *  tab to it before that is a door onto somewhere she has not been. */
const WORLD = ['world', 'World', 'world', () => worldPage()];
const tabsNow = () => (questsOpen() ? [WORLD, ...TABS] : TABS);

/** Which tab is lit. A board's page and a lesson belong to Decks, so the bar
 *  keeps saying where she is even when she is two screens deep. */
export function markTab(id) {
  for (const b of document.querySelectorAll('#tabs button')) {
    b.classList.toggle('on', b.dataset.tab === id);
    b.setAttribute('aria-current', b.dataset.tab === id ? 'page' : 'false');
  }
}

export function buildNav() {
  const tabs = tabsNow();
  $('tabs').innerHTML = tabs.map(([id, name, icon]) =>
    `<button data-tab="${id}" aria-label="${name}">${ic(icon)}<span>${name}</span></button>`).join('');
  for (const [id, , , go] of tabs) {
    document.querySelector(`#tabs [data-tab="${id}"]`)
      .addEventListener('click', () => { markTab(id); go(); });
  }
}
