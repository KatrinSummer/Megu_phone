// How often she wants to see a word: three buttons, on the back of the card and
// in the box of a word tapped in a sentence.
import { esc } from './dom.js';
import { progress } from './store.js';
import { setPri } from './schedule.js';

const LEVELS = [[-1, 'Less often'], [0, 'Normal'], [1, 'More often']];

export const priButtons = (front) => {
  const now = progress[front]?.pri ?? 0;
  return `<div class="pri" data-f="${esc(front)}">${LEVELS.map(([v, name]) =>
    `<button data-v="${v}"${v === now ? ' class="on"' : ''}>${name}</button>`).join('')}</div>`;
};

/** A tap on one sets it and draws again; it must not reach the card under it. */
export const bindPri = (root, redraw) => {
  for (const b of root.querySelectorAll('.pri button')) {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      setPri(b.parentElement.dataset.f, Number(b.dataset.v));
      redraw();
    });
  }
};
