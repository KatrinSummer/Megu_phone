// The four corners of the island, over the top of her drawing on Home.
//
// Her sketch puts three in the right corner - the map, who lives here, what
// she has been asked to do - and her own diary alone in the left one.  The
// pictures in them are placeholders drawn here in line: she is giving me her
// own, and a corner with nothing in it cannot be pointed at and corrected.
import { $, esc } from './dom.js';
import { over, openQuests } from './quest.js';
import { markTab } from './nav.js';
import { worldPage } from './world.js';

// Plain line drawings, on purpose: they are placeholders for hers and should
// not read as finished.  One box each, so swapping one in is one line.
const GLYPH = {
  map: '<path d="M9 4.5L3.5 6.8v12.7L9 17.2l6 2.3 5.5-2.3V4.5L15 6.8z"/><path d="M9 4.5v12.7M15 6.8v12.7"/>',
  people: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/>'
    + '<path d="M16 6.2a3 3 0 010 5.6M17.5 14.9c1.9.6 3 2.4 3 4.6"/>',
  // The "!" in a diamond, which is what her own quest mark on Megu says. A
  // star was tried and is taken: the app draws her favourites with one, and
  // two stars in one corner read as the same button twice.
  quest: '<path d="M12 3.4l8.6 8.6-8.6 8.6L3.4 12z"/><path d="M12 7.8v4.7"/>'
    + '<circle cx="12" cy="16.1" r=".95" fill="currentColor" stroke="none"/>',
  book: '<path d="M5 4.5h9a3 3 0 013 3v12a2.5 2.5 0 00-2.5-2.5H5z"/><path d="M5 4.5v12.5"/>'
    + '<path d="M8.5 9h6M8.5 12.5h6"/>',
};

// id, what it is, which glyph, and what it opens.  The order is hers: in the
// right corner the map sits outermost, so the row reads quests, people, map.
const RIGHT = [
  ['quests', 'Quests', 'quest', () => openQuests()],
  ['people', 'Who lives here', 'people', () => over(`<h2>The islanders</h2>
    <p>${esc('Nobody is written down here yet - she has met Toro, Lily and Hanry so far.')}</p>`)],
  ['map', 'The island', 'map', () => { markTab('world'); worldPage(); }],
];
const LEFT = [
  ['diary', 'Her diary', 'book', () => over(`<h2>Her diary</h2>
    <p>${esc('Her pages are written but not in the app yet.')}</p>`)],
];

const button = ([id, name, glyph]) => `<button id="hud-${id}" aria-label="${esc(name)}"
  title="${esc(name)}"><svg viewBox="0 0 24 24">${GLYPH[glyph]}</svg></button>`;

/** The corners, drawn with the rest of Home.  Only once the intro is behind
 *  her: they are the island's, and the island is what the story hands over. */
export const hudCorners = () => `<div class="hud left">${LEFT.map(button).join('')}</div>
  <div class="hud right">${RIGHT.map(button).join('')}</div>`;

export function bindHud() {
  for (const [id, , , go] of [...LEFT, ...RIGHT]) {
    // They stand on her, and she is the way into the story: a corner must not
    // open the story as well as itself.
    $(`hud-${id}`)?.addEventListener('click', (e) => { e.stopPropagation(); go(); });
  }
}
