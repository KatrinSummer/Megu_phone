// What is saved, and what happens when saving fails. Nothing else in the app
// touches localStorage.
import { $ } from './dom.js';

export const today = () => Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000);

const P_KEY = 'megu.progress.v1';
const S_KEY = 'megu.settings.v1';
const read = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; }
};

// Front -> {due, iv, ease, reps, total, lapses, star, known, hide, seen}
// known is the tick, "I know it"; hide is the eye, "not important".
export let progress = read(P_KEY, {});
export const setProgress = (p) => { progress = p; };

// mode: what the board's page last started, a lesson of new words or a review.
export const settings = { deck: 'last', mode: 'learn', perDay: 20, rand: false, autoPlay: true,
                          theme: 'light', doneOn: 0, doneCount: 0, ...read(S_KEY, {}) };

/** How many words a lesson deals: the number she set, or - with Random on - a
 *  handful between 15 and 30, the same spread as a run through the jungle.
 *  Asked once, when the lesson is built, so the count cannot change under her. */
const RLOW = 15, RHIGH = 30;
export const lessonSize = () => (settings.rand
  ? RLOW + Math.floor(Math.random() * (RHIGH - RLOW + 1)) : settings.perDay);

/** The eye used to mean "I know it"; now it means "not important". She chose
 *  to have everything she had marked with it hidden, not counted as known. */
export const splitEye = (prog) => {
  for (const p of Object.values(prog)) if (p.known) { p.hide = 1; delete p.known; }
  return prog;
};

// A phone can refuse to write: no room left, or private browsing. Failing in
// silence is the worst thing this app can do, so it says so and keeps saying so
// until a write succeeds - her answers are only in memory until then.
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    $('warn').hidden = true;
    return true;
  } catch (e) {
    $('warn').textContent =
      `Nothing is being saved (${e.name}). Save your progress to a file from the menu.`;
    $('warn').hidden = false;
    return false;
  }
}
export const saveProgress = () => write(P_KEY, progress);
export const saveSettings = () => write(S_KEY, settings);
// Once, on the first start of the version where the eye and the tick parted.
if (!settings.eyeSplit) {
  splitEye(progress);
  settings.eyeSplit = 1;
  if (saveProgress()) saveSettings();
}

/** The lesson she is in, so that a reload finds her where she was. */
const L_KEY = 'megu.lesson.v1';
export const loadLesson = () => read(L_KEY, null);
export const saveLesson = (l) => write(L_KEY, l);

// What she has done today, not what she has done since the queue was last built.
// It used to be a plain variable that buildQueue() reset, so opening the settings
// sheet - or any reload - put the tally back to zero.
export const doneToday = () => (settings.doneOn === today() ? settings.doneCount : 0);

/** The same tally, kept day by day, so Stats can show the last two weeks.
 *  Anything older than two months is dropped: it is a phone, and she never
 *  looks back that far.  It starts the day this version arrives - there is no
 *  history before it, because nothing was ever written down. */
const countDay = (n) => {
  const days = settings.days ??= {};
  days[today()] = Math.max(0, (days[today()] ?? 0) + n);
  for (const d of Object.keys(days)) if (today() - Number(d) > 60) delete days[d];
};
export const daysDone = () => settings.days ?? {};

/** Time on the cards, in minutes, kept day by day beside the tally and dropped
 *  with it.  The clock runs only while a card is on screen: it starts when the
 *  card is drawn and stops the moment she answers it.
 *  A card she sat on for two minutes was a break, not study, so one card can
 *  never add more than that - a phone left face up must not become an hour. */
export const countTime = (sec) => {
  const mins = settings.mins ??= {};
  mins[today()] = Math.round(((mins[today()] ?? 0) + Math.min(sec, 120) / 60) * 10) / 10;
  for (const d of Object.keys(mins)) if (today() - Number(d) > 60) delete mins[d];
  saveSettings();
};
export const daysTime = () => settings.mins ?? {};

export const countDone = () => {
  settings.doneCount = doneToday() + 1;
  settings.doneOn = today();
  countDay(1);
  saveSettings();
};
/** A swipe back took an answer away again. */
export const uncountDone = () => {
  settings.doneCount = Math.max(0, doneToday() - 1);
  settings.doneOn = today();
  countDay(-1);
  saveSettings();
};

/** A word she has never answered. `total` is the count that survives a slip. */
export const fresh = () => ({ due: today(), iv: 0, ease: 2.5, reps: 0, total: 0, lapses: 0, star: 0 });
/** Older saves have no `total`; back then `reps` was the count, so read it. */
export const lifetime = (p) => p.total ?? p.reps ?? 0;
/** She has answered it at least once. A star or a priority alone is not a start. */
export const started = (p) => !!p && (lifetime(p) > 0 || (p.lapses ?? 0) > 0);
/** How often she asked to see this word: 1 more, -1 less, 0 as it comes.
 *  It takes the card rather than the record, because every caller holds a card
 *  and a word with no record yet is simply a word she never asked about. */
export const pri = (c) => progress[c.f]?.pri ?? 0;

/** The bookmark, on this card or a word tapped in a sentence. It is not
 *  progress, so it leaves `seen` alone: a star must not win a backup merge. */
export const flipStar = (front) => {
  const p = progress[front] ??= fresh();
  p.star = p.star ? 0 : 1;
  saveProgress();
  return p.star;
};

// The head applies this too, before the first paint; here it is for the switch.
export const applyTheme = () => {
  const dark = settings.theme === 'dark';
  if (dark) document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;
  document.querySelector('meta[name=theme-color]').content = dark ? '#191b28' : '#ffffff';
};
