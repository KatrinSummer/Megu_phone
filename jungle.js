// Her jungle: a run of words from every board at once, mostly ones she has
// never seen.  It is not a board - nothing lives in it - only a way of dealing
// a handful of cards, so it takes the words it may use and gives back a list.
import { progress, started } from './store.js';

/** How long a run is: she asked for a different number every time. */
const LOW = 15, HIGH = 30;
/** What it is made of: mostly new, a few she asked to see more often, and a
 *  handful of ordinary ones she has already started. */
const MIX = { fresh: 0.8, fav: 0.15, seen: 0.05 };

const shuffle = (list) => list.sort(() => Math.random() - 0.5);
const pri = (c) => progress[c.f]?.pri ?? 0;

/** One run, out of the words she is still being shown (`cards`): hidden ones and
 *  ones she has ticked off are not in it.  A pile that is too small is made up
 *  from the others, so a short library still gets a full run. */
export function jungleRun(cards) {
  const isNew = (c) => !started(progress[c.f]);
  const piles = {
    fav: shuffle(cards.filter((c) => pri(c) === 1)),
    fresh: shuffle(cards.filter((c) => pri(c) !== 1 && isNew(c))),
    seen: shuffle(cards.filter((c) => pri(c) !== 1 && !isNew(c))),
  };
  const n = Math.min(cards.length, LOW + Math.floor(Math.random() * (HIGH - LOW + 1)));
  const out = [];
  for (const [k, share] of Object.entries(MIX)) out.push(...piles[k].splice(0, Math.round(n * share)));
  // Short of a full run: whatever is left over, new words first.
  for (const k of ['fresh', 'seen', 'fav']) out.push(...piles[k].splice(0, n - out.length));
  return shuffle(out);
}
