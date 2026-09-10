// Saying the word out loud. iOS will not play anything until she has touched
// the screen once, which is the only reason this is not two lines.
let audio = null, unlocked = false;

export function play(card) {
  if (!card?.a) return;
  audio ??= new Audio();               // one element for the whole session: iOS
  audio.src = `audio/${card.a}.m4a`;   // unlocks it once and trusts it after
  audio.play().then(() => { unlocked = true; }).catch(() => {});
}

// The very first card is drawn before she has touched anything. Say it on her
// first tap instead - the Japanese word is still what is on screen at that
// moment, so nothing is given away.
export const sayOnFirstTap = (currentCard) =>
  addEventListener('pointerdown', () => { if (!unlocked) play(currentCard()); }, { capture: true });

export const playing = () => audio?.src ?? '';
