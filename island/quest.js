// What waits for her on the island once the story has let her go: her note
// over the screen, the mark on Home, and the quests behind it.
//
// Every word in here is hers, out of STORY.md, carried into English the same
// way her scenes are - the island speaks Japanese, Megu does not, and this app
// is public.
//
// What Megu SAYS about the quests is not here: it is a scene of its own
// (story/02-quests.txt), because she drew it as her talking and the island
// answering afterwards, not as one plate with everything on it.
import { $, esc } from '../core/dom.js';
// The scenes the island waits on - named where the story names them, so the
// mark and the plates can never disagree about which scene is which.
import { FIRST, QUESTS as SCENE, played } from './story.js';

/** The island opens when the first scene is FINISHED - the intro seen through
 *  to its last plate and the island come back to.  Not "the scene was
 *  opened", not "a record exists": she has no island until she has earned it,
 *  and a mark standing on Home before that is the app promising her something
 *  that has not happened. */
export const questsOpen = () => played(FIRST);

/** And the quests themselves exist once she has heard her own two lines about
 *  the islanders.  That scene is what hands them over, so before it the corner
 *  is there and holds nothing - which is what she asked for: first she talks,
 *  then there are two quests. */
export const questsGot = () => played(SCENE);

// Her note on the way back to the island.
const NOTE = `Learn the language together with Megu and get to know the
  islanders! Do quests and explore the unknown island! Who knows what treasures
  are buried here~`;

// What the island says once she has said her piece: the quests are open.
const NEW = 'New quests are open to you';

const HINT = `Learn words to open new quests ~ Do quests and get rewards`;

// Nothing to do yet, and it says whose move it is rather than standing empty.
const NONE = 'No quests yet - press Megu and hear what she has to say.';

const QUESTS = [
  ['Thank Lily', 'I must thank Lily for all her help!!! But what does she like???'],
  ['Thank Hanry', 'Mr Hanry helps me so much! I must thank him for all his help!!! '
    + 'But what does he like???'],
];

/** One plate over the island, tapped away.  Not a screen of its own: she is
 *  back home and this is a note laid on top of it, which is where she put it. */
export function over(html) {
  const box = document.createElement('div');
  box.className = 'over';
  box.id = 'over';
  box.innerHTML = `<div class="card">${html}<p class="on">tap to go on</p></div>`;
  box.addEventListener('click', () => box.remove());
  document.body.append(box);
}

/** Her note over the island once the story has let her go, and nothing else.
 *  The level was asked here for as long as the intro ended in a test; her
 *  intro asks it itself now, as its last beat, and asking twice in two screens
 *  reads as the island not having listened the first time.  Settings is where
 *  she changes her mind about it. */
export function noteAfterStory() {
  over(`<p>${esc(NOTE)}</p>`);
}

/** And the island's answer to her two lines: the quests are open now.  It is
 *  the "-info-" beat of her sketch - a plate of its own, after she has spoken
 *  and before the quests are anywhere to be seen. */
export function noteQuests() {
  over(`<h2>${esc(NEW)}</h2><p class="hint">${esc(HINT)}</p>`);
}

/** The mark on her: a "!" where she drew it.  It means SHE HAS SOMETHING TO
 *  SAY, not "here are your quests" - so it stands only between the intro and
 *  the scene where she says it, and goes the moment she has been heard.  The
 *  quests are not behind her at all; they are in the corner, where she put
 *  them. A mark that stays on after there is nothing new is the app calling
 *  her over to hear something she has already heard. */
export const questMark = () => (questsOpen() && !questsGot()
  ? `<button class="quest" id="d-quest" aria-label="Megu has something to say">!</button>` : '');

/** What the island has for her now, and nothing else on the plate: her own
 *  words about it were said in the scene that opened them. */
export function openQuests() {
  if (!questsGot()) return over(`<p>${esc(NONE)}</p>`);
  over(`<h2>Quests</h2>
    ${QUESTS.map(([name, text]) =>
      `<div class="q"><b>${esc(name)}</b>${esc(text)}</div>`).join('')}
    <p class="hint">${esc(HINT)}</p>`);
}

/** The "!" opens whatever pressing Megu opens - it stands on her, and there is
 *  one door, not two.  Home decides what that is and hands it in. */
export function bindQuest(press) {
  $('d-quest')?.addEventListener('click', (e) => {
    e.stopPropagation();                        // it stands on her, and she opens the story
    press();
  });
}
