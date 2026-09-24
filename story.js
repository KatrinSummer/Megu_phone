// A scene of the story: her text, played one line at a time.
//
// The scene lives in a text file she writes herself - names, lines, and
// -effects- between dashes - so the story can grow without this file changing.
import { $, esc } from './dom.js';
import { cardOf } from './boards.js';
import { isMemorized } from './schedule.js';
import { stateOf } from './word.js';

// The village speaks Japanese and she does not, so a word she has not learned
// reaches her as noise.  The noise is kana rather than invented symbols: she is
// hearing Japanese, she simply cannot understand it - and kana is certain to
// draw on her phone, which a rare glyph is not.
const KANA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわん';
/** Same word in, same noise out - so an unheard word is recognisably the same
 *  one each time it comes round, and the day she learns it, it resolves. */
const deafen = (t) => [...t].map((ch, i) => (/[぀-ヿ]/.test(ch)
  ? KANA[(ch.codePointAt(0) * 7 + i * 13) % KANA.length] : ch)).join('');

// A line is Japanese if there is kana in it; Megu's own English never is.
const JAPANESE = /[぀-ヿ]/;

/** A line as she hears it.  Scenes space their kana word by word, the same way
 *  her example sentences do, so each piece is one word to look up.  Learned
 *  words stand as themselves and wear their colour; the rest is noise. */
const known = (t) => { const c = cardOf(t); return !!c && isMemorized(c); };
const heard = (text) => text.split(' ').map((t) => (known(t)
  ? `<span class="w ${stateOf(cardOf(t))}">${esc(t)}</span>`
  : esc(deafen(t)))).join(' ');

/** Is there anything in this line she cannot hear yet?  The day she knows every
 *  word of it there is no noise left, and the line below would be the same
 *  sentence a second time. */
const noisy = (text) => !text.split(' ').every(known);

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
const EFFECTS = { shock: 400, scared: 700, shake: 500, dark: 900 };

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

/** A scene is written with the speaker in capitals - MEGU, TARO - because that
 *  is how a script reads on the page.  On screen it is a name, not shouting. */
const named = (who) => who[0] + who.slice(1).toLowerCase();

// Who the screen shows.  There is one place to stand, so it belongs to whoever
// is talking - a story that keeps showing her while somebody else speaks is
// telling the wrong thing.  A name with no picture leaves whoever is there.
const FACES = { MEGU: 'img/char.webp', TARO: 'img/taro.webp' };

function show(who) {
  const face = FACES[who?.toUpperCase()];
  const img = $('d-char')?.querySelector('img');
  if (face && img && !img.src.endsWith(face)) img.src = face;
}

let beats = [], at = 0, running = false;

/** The next line.  Nothing in here listens for a tap: the screen does, and the
 *  screen calls this - so the story runs the same whatever she pressed. */
export const advance = () => { if (running) step(); };

/** Effects run on the way past; the next line she reads stops the walk. */
function step() {
  const box = $('d-say');
  while (at < beats.length && beats[at].effect) runEffect(beats[at++].effect);
  if (at >= beats.length) {
    box.innerHTML = '<p class="end">— to be continued —</p>';
    running = false;                    // and the screen stops being a way on
    return;
  }
  const b = beats[at++];
  show(b.who);                          // the screen belongs to whoever is talking
  if (b.fx) runEffect(b.fx);            // the screen flinches as the line lands
  const jp = JAPANESE.test(b.text);
  // What she HEARS is the line; what was SAID is written under it, quietly and
  // as plain text.  Not a hint she taps for - the words are simply there to look
  // at, the way the writing on a foreign sign is there whether or not it means
  // anything to you.  Nothing in it is a word to press: pressing a word is how
  // she learns one, and she has not learned these.
  box.innerHTML = `${b.who ? `<p class="who">${esc(named(b.who))}</p>` : ''}
    <p class="line">${jp ? heard(b.text) : esc(b.text)}</p>
    ${jp && noisy(b.text) ? `<p class="jp">${esc(b.text)}</p>` : ''}<p class="on">tap to go on</p>`;
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
  running = true;                       // the screen carries the taps from here
  step();
}
