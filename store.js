// What is saved, and what happens when saving fails. Nothing else in the app
// touches localStorage.
import { $ } from './dom.js';

export const today = () => Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000);

const P_KEY = 'megu.progress.v1';
const S_KEY = 'megu.settings.v1';
const read = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; }
};

// Front -> {due, iv, ease, reps, total, lapses, star, known, seen}
export let progress = read(P_KEY, {});
export const setProgress = (p) => { progress = p; };

export const settings = { deck: 'all', perDay: 20, autoPlay: true, theme: 'light',
                          doneOn: 0, doneCount: 0, ...read(S_KEY, {}) };

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

// What she has done today, not what she has done since the queue was last built.
// It used to be a plain variable that buildQueue() reset, so opening the settings
// sheet - or any reload - put the tally back to zero.
export const doneToday = () => (settings.doneOn === today() ? settings.doneCount : 0);
export const countDone = () => {
  settings.doneCount = doneToday() + 1;
  settings.doneOn = today();
  saveSettings();
};

/** A word she has never answered. `total` is the count that survives a slip. */
export const fresh = () => ({ due: today(), iv: 0, ease: 2.5, reps: 0, total: 0, lapses: 0, star: 0 });
/** Older saves have no `total`; back then `reps` was the count, so read it. */
export const lifetime = (p) => p.total ?? p.reps ?? 0;

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
