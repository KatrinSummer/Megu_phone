// Her character standing on the island, and the way into her story.
//
// Kept apart from dash.js: that file is about how today stands, this one about
// the story, and they will not grow into each other.
import { $ } from './dom.js';
import { startScene } from './story.js';

// The scene she opens on.  Its text lives in story/01-beach.txt, not here: she
// writes the story, and a line of it should never mean editing code.
const FIRST = '01-beach';

/** What stands in place of the island's rows while she is on the screen. */
export const talkPanel = () => `<div class="talk">
  <div class="speech" id="d-say" hidden></div>
</div>`;

/** Open the story.  Pressing Megu herself is the way in - the button laid over
 *  her is the lesson's, and she asked for one button, not two. */
export function startStory() {
  $('main').classList.add('talking');
  // The way out, in the place every other screen keeps it.  Home hides the
  // arrow, so it is only ever here while the story is on, and dash() hides it
  // again on the way back.
  $('back').hidden = false;
  startScene(FIRST);
}
