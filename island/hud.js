// The four corners of the island, over the top of her drawing on Home.
//
// Her sketch puts three in the right corner - the map, who lives here, what
// she has been asked to do - and her own diary alone in the left one.  The
// pictures are hers, drawn on one sheet and cut off it by
// scripts/cut-icons.mjs; there is a file each, so a redrawn icon is one file
// replaced and nothing else.
import { $, esc } from '../core/dom.js';
import { over, openQuests } from './quest.js';
import { openDiary } from './diary.js';
import { markTab } from './nav.js';
import { worldPage } from './world.js';

// id, what it is, her picture, and what it opens.  The order is hers: in the
// right corner the map sits outermost, so the row reads quests, people, map.
const RIGHT = [
  ['quests', 'Quests', () => openQuests()],
  ['people', 'Who lives here', () => over(`<h2>The islanders</h2>
    <p>${esc('Nobody is written down here yet - she has met Toro, Lily and Hanry so far.')}</p>`)],
  ['map', 'The island', () => { markTab('world'); worldPage(); }],
];
const LEFT = [
  ['diary', 'Her diary', () => openDiary()],
];

const button = ([id, name]) => `<button id="hud-${id}" aria-label="${esc(name)}"
  title="${esc(name)}"><img src="img/hud-${id}.webp" alt=""></button>`;

/** The corners, drawn with the rest of Home.  Only once the intro is behind
 *  her: they are the island's, and the island is what the story hands over. */
export const hudCorners = () => `<div class="hud left">${LEFT.map(button).join('')}</div>
  <div class="hud right">${RIGHT.map(button).join('')}</div>`;

export function bindHud() {
  for (const [id, , go] of [...LEFT, ...RIGHT]) {
    // They stand on her, and she is the way into the story: a corner must not
    // open the story as well as itself.
    $(`hud-${id}`)?.addEventListener('click', (e) => { e.stopPropagation(); go(); });
  }
}
