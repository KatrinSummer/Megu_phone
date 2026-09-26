// Her character standing on the island, and the way into her story.
//
// Kept apart from dash.js: that file is about how today stands, this one about
// the story, and they will not grow into each other.
import { $ } from './dom.js';
import { startScene, FIRST } from './story.js';

/** What stands in place of the island's rows while she is on the screen. */
export const talkPanel = () => `<div class="talk">
  <div class="speech" id="d-say" hidden></div>
</div>`;

/** Open the story.  Pressing Megu herself is the way in - the button laid over
 *  her is the lesson's, and she asked for one button, not two. */
export function startStory(onEnd) {
  $('main').classList.add('talking');
  // The way out, in the place every other screen keeps it.  Home hides the
  // arrow, so it is only ever here while the story is on, and dash() hides it
  // again on the way back.
  $('back').hidden = false;
  // Where she lands when the scene is over is Home's business, not the story's
  // - and passing it down rather than importing Home here keeps the two files
  // pointing one way.
  startScene(FIRST, onEnd);
}
