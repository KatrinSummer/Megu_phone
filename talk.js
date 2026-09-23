// Her character standing on the island, and what pressing her offers.
//
// Home is a list of boards until she is pressed; then the rows fold away and the
// screen is hers.  Kept apart from dash.js: that file is about how today stands,
// this one about the story, and they will not grow into each other.
import { $, esc } from './dom.js';

// The opening she wrote, in Megu's own English: Megu is American and thinks in
// it, so her lines are English however the scene was drafted.  What anybody says
// in Japanese is written by ChatGPT out of words already in the deck - a line
// invented here would be one she cannot read and never agreed to learn.
const INTRO = [
  'Haaaaah!!! WHERE AM I!!??? Oh no!! Ghhhhhhhyyyyyyyy',
  "It wasn't a dream! I really did fall off that liner yesterday!",
  'So I went over the side of a cruise liner and… woke up in Higashi village!',
];

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
    const box = $('d-say');
    box.hidden = false;
    box.innerHTML = INTRO.map((l) => `<p>${esc(l)}</p>`).join('');
  });
}
