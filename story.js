// A scene of the story: her text, played one line at a time.
//
// The scene lives in a text file she writes herself - names, lines, and
// -effects- between dashes - so the story can grow without this file changing.
import { $, esc } from './dom.js';

/** One line of the file -> one beat.
 *  "NAME: text" is somebody speaking, "NAME -word-: text" is speaking while the
 *  screen does something, "-word-" on its own is the screen doing something
 *  between lines, and a "#" line is a note to herself that is never shown. */
export function parseScene(text) {
  const beats = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const alone = line.match(/^-([a-z]+)-$/i);
    if (alone) { beats.push({ effect: alone[1].toLowerCase() }); continue; }
    const said = line.match(/^([A-Za-z][A-Za-z ]*?)\s*(?:-([a-z]+)-)?\s*:\s*(.+)$/);
    if (said) beats.push({ who: said[1].trim(), fx: said[2]?.toLowerCase(), text: said[3] });
  }
  return beats;
}

// How long each effect runs, and the only names there are.  A closed list on
// purpose: a scene that asks for an effect nobody wrote says so in the console
// instead of doing nothing and leaving her wondering.
const EFFECTS = { shock: 400, shake: 500, dark: 900 };

function runEffect(name) {
  const ms = EFFECTS[name];
  if (!ms) {
    console.warn(`story: no effect called "${name}". There is: ${Object.keys(EFFECTS).join(', ')}`);
    return;
  }
  const main = $('main');
  main.classList.add(`fx-${name}`);
  setTimeout(() => main.classList.remove(`fx-${name}`), ms);
}

let beats = [], at = 0;

/** Effects run on the way past; the next line she reads stops the walk. */
function step() {
  const box = $('d-say');
  while (at < beats.length && beats[at].effect) runEffect(beats[at++].effect);
  if (at >= beats.length) {
    box.innerHTML = '<p class="end">— to be continued —</p>';
    box.onclick = null;
    return;
  }
  const b = beats[at++];
  if (b.fx) runEffect(b.fx);            // the screen flinches as the line lands
  box.innerHTML = `<p>${esc(b.text)}</p><p class="on">tap to go on</p>`;
}

export async function startScene(name) {
  const box = $('d-say');
  box.hidden = false;
  try {
    beats = parseScene(await (await fetch(`story/${name}.txt`)).text());
  } catch {
    // Offline and never cached, or the file was renamed: say so rather than
    // sit there with an empty plate.
    box.innerHTML = `<p>The scene "${esc(name)}" could not be read.</p>`;
    return;
  }
  at = 0;
  box.onclick = step;
  step();
}
