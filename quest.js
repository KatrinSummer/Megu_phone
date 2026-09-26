// What waits for her on the island once the story has let her go: her note
// over the screen, the mark on Home, and the quests behind it.
//
// Every word in here is hers, out of STORY.md, carried into English the same
// way her scenes are - the island speaks Japanese, Megu does not, and this app
// is public.
import { $, esc } from './dom.js';
import { settings } from './store.js';

/** The quests open when the first scene is FINISHED - the test at the end of
 *  it seen through to its last plate and the island come back to.  Not "the
 *  scene was opened", not "a record exists": she has no quest until she has
 *  earned one, and a mark standing on Home before that is the app promising
 *  her something that has not happened.
 *  It asks for `done` and not merely for the record, because a record written
 *  by any older version of this app was written under the looser rule - and an
 *  app that keeps showing the mark because of what some earlier build saved is
 *  telling her exactly the thing she said was wrong. */
export const questsOpen = () => settings.scenes?.['01-beach']?.done === true;

// Her note on the way back to the island.
const NOTE = `Learn the language together with Megu and get to know the
  islanders! Do quests and explore the unknown island! Who knows what treasures
  are buried here~`;

// What she says when the mark is pressed.
const MEGU = `I've settled in a little~ But without their language it is so hard
  T___T Luckily I have Lily and Mr Henry!!! I don't know what I would do
  without them!! I have to thank them somehow!`;

const HINT = `New quests are open to you. Learn words to open new ones ~ Do
  quests and get rewards`;

const QUESTS = [
  ['Thank Lily', 'I must thank Lily for all her help!!! But what does she like???'],
  ['Thank Henry', 'Mr Henry helps me so much! I must thank him for all his help!!! '
    + 'But what does he like???'],
];

/** One plate over the island, tapped away.  Not a screen of its own: she is
 *  back home and this is a note laid on top of it, which is where she put it. */
function over(html) {
  const box = document.createElement('div');
  box.className = 'over';
  box.id = 'over';
  box.innerHTML = `<div class="card">${html}<p class="on">tap to go on</p></div>`;
  box.addEventListener('click', () => box.remove());
  document.body.append(box);
}

/** The island's welcome, shown once she comes back out of the story. */
export const noteAfterStory = () => over(`<p>${esc(NOTE)}</p>`);

/** The mark on Home: a "!" at her feet, where she drew it. */
export const questMark = () => (questsOpen()
  ? `<button class="quest" id="d-quest" aria-label="Quests">!</button>` : '');

export function bindQuest() {
  $('d-quest')?.addEventListener('click', (e) => {
    e.stopPropagation();                        // it stands on her, and she opens the story
    over(`<h2>Megu</h2><p>${esc(MEGU)}</p>
      ${QUESTS.map(([name, text]) =>
        `<div class="q"><b>${esc(name)}</b>${esc(text)}</div>`).join('')}
      <p class="hint">${esc(HINT)}</p>`);
  });
}
