// Her diary, page by page.
//
// The words are hers, out of STORY.md, carried into English the way the rest
// of Megu's own writing is - she is American and this is her own notebook.
// Her spelling, her emoticons and her screaming are left exactly as she wrote
// them: it is a diary, not a report.
//
// A page turns up when the story has got that far, and not before: the first
// one once the island lets her go, the second together with her first quests,
// which is where she put it.
import { esc } from '../core/dom.js';
import { over, questsOpen, questsGot } from './quest.js';

const PAGES = [
  [questsOpen, `So it happened that I fell off the deck of a cruise liner
    and…woke up in Higashi village! …T___T

    Luckily I am not the only one who speaks English here! There is Mr Hanry
    too… But… What do I do now???AAAAAAAAA`],

  [questsGot, `Mum, dad, how are you??? I want to see you so much!!! T_T

    These few days I have settled in a little. Luckily there is electricity
    here and my phone somehow survived!!! Apparently the sea throws other
    people onto this island from time to time too! Mr Hanry before me, for
    instance…he has lived here for 20 years T_______T AAAAAAAAA

    There is no internet…But at least I can keep a diary T__T

    Oh yes! Today I am meeting Lily! We are learning the village language
    together! She is such a sweetheart T__T

    It seems the first settlers here were once "Japanese" but…in time a
    language of their very own grew up here!…

    OH YES!!! I never said!!! This is - UNEXPLORED ISLAND!

    AAAAAAAAA`],
];

/** One page: her paragraphs, kept apart the way she wrote them. */
const page = (n, text) => `<div class="page"><b>${n}</b>${text.trim()
  .split(/\n\s*\n/)
  .map((p) => `<p>${esc(p.replace(/\s*\n\s*/g, ' ').trim())}</p>`).join('')}</div>`;

/** What she has written so far.  Empty before the island lets her go - she
 *  has not had a minute to write anything down yet, and saying so is better
 *  than an empty book. */
export function openDiary() {
  const pages = PAGES.filter(([when]) => when());
  if (!pages.length) {
    return over(`<h2>Her diary</h2>
      <p>${esc('She has not had a minute to write anything down yet.')}</p>`);
  }
  over(`<h2>Her diary</h2>${pages.map(([, text], i) => page(i + 1, text)).join('')}`);
}
