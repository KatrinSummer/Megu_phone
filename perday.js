// "Discover ... words" - the strip that slides out from under Home's big button when the
// little gear on it is tapped: Random, or a number of her own.  The number is
// the same one as *New words at a time* in the settings.
import { $ } from './dom.js';
import { settings, saveSettings } from './store.js';

const LOW = 5, HIGH = 50, STEP = 5;

/** Drawn straight into Home, under the button, rolled up until the gear. */
export const countRow = () => `<div class="drop" id="d-count"><div><div class="cnt">
  <span class="n">Discover</span>
  <button class="pick" id="c-rand">Random</button>
  <button class="pick" id="c-set">Set</button>
  <button id="c-less" aria-label="Fewer words">−</button>
  <b id="c-n">${settings.perDay}</b>
  <button id="c-more" aria-label="More words">+</button>
  <span class="n">words</span></div></div></div>`;

/** Only this strip and the button's own number change while she picks: nothing
 *  else on Home depends on the count, so nothing else is drawn again. */
export function bindCount() {
  const row = $('d-count');
  const show = () => {
    // Two chips, one lit: Random deals a number it has not picked yet, Set deals
    // the one she names with the minus and the plus.
    row.classList.toggle('rand', !!settings.rand);
    for (const [id, on] of [['c-rand', !!settings.rand], ['c-set', !settings.rand]]) {
      $(id).classList.toggle('on', on);
      $(id).setAttribute('aria-pressed', String(on));
    }
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
  const mode = (rand) => { settings.rand = rand; saveSettings(); show(); };
  $('c-rand').addEventListener('click', () => mode(true));
  $('c-set').addEventListener('click', () => mode(false));
  $('c-less').addEventListener('click', () => set(settings.perDay - STEP));
  $('c-more').addEventListener('click', () => set(settings.perDay + STEP));
  show();
}
