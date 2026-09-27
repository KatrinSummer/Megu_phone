// The island: her map, and the tab that opens it.
//
// It appears only once the intro has been played - the island is what she is
// let out on to at the end of it, and a door to it before that opens on a
// place the story has not taken her yet.
//
// There is nothing on the map to press yet.  It is the place the quests will
// stand on, and it is here now because she asked for the tab to exist.
import { $ } from './dom.js';
import { leave } from './screens.js';
import { markTab } from './nav.js';

export function worldPage() {
  leave();
  markTab('world');
  $('star').hidden = $('back').hidden = true;
  $('stats').hidden = true;
  $('counts').innerHTML = '';
  $('counts').title = 'World';

  $('main').className = 'page world';
  $('main').innerHTML = `
    <div class="head"><h1>The island</h1></div>
    <div class="map"><img src="img/world.webp" alt="The island"></div>
    <p class="note">Higashi village, and everything around it she has not seen
      yet. The quests will stand here.</p>`;
}
