// Her character standing on the island, and what pressing her offers.
//
// Home is a list of boards until she is pressed; then the rows fold away and the
// screen is hers.  Kept apart from dash.js: that file is about how today stands,
// this one about the story, and they will not grow into each other.
import { $ } from './dom.js';
import { startScene } from './story.js';

// The scene she opens on.  Its text lives in story/01-beach.txt, not here: she
// writes the story, and a line of it should never mean editing code.
const FIRST = '01-beach';

/** The way in, laid over her once she is pressed.  Megu is American and the app
 *  speaks English, so the button does too; the story she tells is in Russian. */
export const storyButton = () =>
  `<button class="big story" id="d-talk"><span class="t">Start story</span></button>`;

/** What stands in place of the island's rows while she is on the screen. */
export const talkPanel = () => `<div class="talk">
  <div class="speech" id="d-say" hidden></div>
</div>`;

export function bindTalk() {
  $('d-talk').addEventListener('click', () => {
    // The island's rows fold away here, not on a tap on her: the button is what
    // starts the story, and it is on Home from the start.
    $('main').classList.add('talking');
    // The way out, in the place every other screen keeps it.  Home hides the
    // arrow, so it is only ever here while the story is on, and dash() hides it
    // again on the way back.
    $('back').hidden = false;
    startScene(FIRST);
  });
}
