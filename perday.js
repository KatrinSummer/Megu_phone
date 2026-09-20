// "Word count" - the strip that drops out from under Home's big button when the
// little gear on it is tapped: Random, or a number of her own.  The number is
// the same one as *New words at a time* in the settings.
import { $ } from './dom.js';
import { settings, saveSettings } from './store.js';

const LOW = 5, HIGH = 50, STEP = 5;

/** Drawn straight into Home, under the button, rolled up until the gear. */
export const countRow = () => `<div class="drop" id="d-count"><div><div class="cnt">
  <span class="n">Word count</span>
  <button class="pick" id="c-rand">Random</button>
  <button id="c-less" aria-label="Fewer words">−</button>
  <b id="c-n">${settings.perDay}</b>
  <button id="c-more" aria-label="More words">+</button></div></div></div>`;

/** Only this strip and the button's own number change while she picks: nothing
 *  else on Home depends on the count, so nothing else is drawn again. */
export function bindCount() {
  const row = $('d-count');
  const show = () => {
    row.classList.toggle('rand', !!settings.rand);
    $('c-rand').classList.toggle('on', !!settings.rand);
    $('c-rand').setAttribute('aria-pressed', String(!!settings.rand));
    $('c-n').textContent = settings.perDay;
    // The button says what the lesson will deal - and with Random, that it does
    // not know yet: the question mark is the answer then.
    if ($('d-v')) $('d-v').textContent = settings.rand ? '?' : settings.perDay;
  };
  const set = (n) => {
    settings.perDay = Math.min(HIGH, Math.max(LOW, n));
    settings.rand = false;                 // naming a number is choosing not to be random
    saveSettings();
    show();
  };
  $('c-rand').addEventListener('click', () => {
    settings.rand = !settings.rand;
    saveSettings();
    show();
  });
  $('c-less').addEventListener('click', () => set(settings.perDay - STEP));
  $('c-more').addEventListener('click', () => set(settings.perDay + STEP));
  show();
}
