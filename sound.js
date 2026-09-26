// Saying the word out loud. iOS will not play anything until she has touched
// the screen once, which is the only reason this is not two lines.
import { ic } from './icons.js';

let audio = null, unlocked = false;
// Whether the tap being handled right now has already asked for a sound of its
// own. There is one <audio> element, so the last src to be set is the one she
// hears, and two plays in one gesture are a race.
let asked = false;

/** Her speaker, the same one everywhere something can be said out loud. */
export const SPEAKER = ic('audio');

export function play(card) {
  if (!card?.a) return;
  asked = true;
  audio ??= new Audio();               // one element for the whole session: iOS
  audio.src = `audio/${card.a}.m4a`;   // unlocks it once and trusts it after
  audio.play().then(() => { unlocked = true; }).catch(() => {});
}

// The very first card is drawn before she has touched anything. Say it on her
// first tap instead - the Japanese word is still what is on screen at that
// moment, so nothing is given away.
// After the tap has been dealt with, though, not before it. This listener is on
// the capture phase, so on the first tap of the session it ran BEFORE the button
// she actually pressed: tapping the speaker on an example sentence sent the WORD
// to the audio element a moment before the sentence did, and which of the two
// she heard was a race between them - the sound then did not match the line she
// had pressed. A tap that asks for something itself wins.
export const sayOnFirstTap = (currentCard) =>
  addEventListener('pointerdown', () => {
    if (unlocked) return;
    asked = false;
    setTimeout(() => { if (!asked) play(currentCard()); });
  }, { capture: true });

export const playing = () => audio?.src ?? '';
