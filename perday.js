// "How many words" - the panel the little gear on Home's big button slides up
// from the bottom edge.  It is the same number as *New words at a time* in the
// settings: one lesson's worth of words.
import { $ } from './dom.js';
import { settings, saveSettings } from './store.js';

const LOW = 5, HIGH = 50, STEP = 5;

/** `after` is what to do once it closes - Home redraws, so its button counts again. */
export function pickCount(after) {
  $('pop')?.remove();
  const pop = document.createElement('div');
  pop.id = 'pop';
  pop.className = 'low';
  const close = () => { pop.remove(); after?.(); };
  // The rest of the screen is a clear sheet: a tap there closes the panel.
  pop.addEventListener('click', (e) => { if (e.target === pop) close(); });
  pop.innerHTML = `<div class="box" role="dialog" aria-label="How many words">
    <div class="top"><b>Word count</b></div>
    <div class="m">how many words one lesson deals</div>
    <div class="step">
      <button id="c-less" aria-label="Fewer words">−</button>
      <b id="c-n">${settings.perDay}</b>
      <button id="c-more" aria-label="More words">+</button></div>
    <button class="wide" id="c-ok">Done</button></div>`;
  document.body.append(pop);

  const set = (n) => {
    settings.perDay = Math.min(HIGH, Math.max(LOW, n));
    saveSettings();
    $('c-n').textContent = settings.perDay;
  };
  $('c-less').addEventListener('click', () => set(settings.perDay - STEP));
  $('c-more').addEventListener('click', () => set(settings.perDay + STEP));
  $('c-ok').addEventListener('click', close);
}
