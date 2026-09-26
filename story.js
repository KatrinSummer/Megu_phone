// A scene of the story: her text, played one line at a time.
//
// The scene lives in a text file she writes herself - names, lines, and
// -effects- between dashes - so the story can grow without this file changing.
import { $, esc } from './dom.js';
import { cardOf } from './boards.js';
import { isMemorized } from './schedule.js';
import { stateOf } from './word.js';
import { startQuiz } from './quiz.js';

// The village speaks Japanese and she does not, so a word she has not learned
// reaches her as noise.  The noise is kana rather than invented symbols: she is
// hearing Japanese, she simply cannot understand it - and kana is certain to
// draw on her phone, which a rare glyph is not.
// Writing she cannot read, not a line struck out.  It was kana first, which read
// as Japanese she simply had not learned; then blocks, which read as a censored
// document rather than as a village speaking.  What she asked for is a script of
// their own - so this is one: letters, clearly letters, and not one of them hers.
// These are real Unicode syllabics rather than invented pictures because a made-
// up glyph has no font behind it and arrives on her phone as an empty box, which
// is unreadable for the wrong reason.  This block ships with iOS, Android and
// Windows alike.
const SCRIPT = 'ᐊᐃᐅᑎᑭᒥᓇᔭᕐᖏᐸᒐᓗᑦᔅ';
/** Same word in, same noise out - so an unheard word is recognisably the same
 *  one each time it comes round, and the day she learns it, it resolves. */
const deafen = (t) => [...t].map((ch, i) => (/[぀-ヿ]/.test(ch)
  ? SCRIPT[(ch.codePointAt(0) * 7 + i * 13) % SCRIPT.length] : ch)).join('');

// A line is Japanese if there is kana in it; Megu's own English never is.
const JAPANESE = /[぀-ヿ]/;

/** A line as she hears it.  Scenes space their kana word by word, the same way
 *  her example sentences do, so each piece is one word to look up.  Learned
 *  words stand as themselves and wear their colour; the rest is noise. */
const known = (t) => { const c = cardOf(t); return !!c && isMemorized(c); };
/** A word she has not learned carries both of its faces: the noise she hears,
 *  and what was really said underneath.  A tap turns the line over. */
/** Every word of theirs the scene put in front of her, in the order it came.
 *  The test at the end asks about these and nothing else: it is a test on the
 *  conversation she just had, not on the deck. */
const said = new Set();
const heard = (text) => text.split(' ').map((t) => {
  if (cardOf(t)) said.add(t);
  return known(t)
    ? `<span class="w ${stateOf(cardOf(t))}">${esc(t)}</span>`
    : `<span class="noise" data-said="${esc(t)}" data-noise="${esc(deafen(t))}">${esc(deafen(t))}</span>`;
}).join(' ');

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
// Nobody has introduced him.  She washes up on a beach and a stranger speaks to
// her in a language she does not have a word of - she cannot know his name, and
// a plate that prints it is the story telling her something she was never told.
// He leaves this set on the day the story says who he is.
const UNMET = new Set(['TARO']);
const named = (who) => (UNMET.has(who.toUpperCase()) ? '???'
  : who[0] + who.slice(1).toLowerCase());

// Who the screen shows.  There is one place to stand, so it belongs to whoever
// is talking - a story that keeps showing her while somebody else speaks is
// telling the wrong thing.  A name with no picture leaves whoever is there.
const FACES = { MEGU: 'img/char.webp', TARO: 'img/taro.webp' };
// Nobody is nudged by a MEASUREMENT any more.  Five different ways of measuring
// "where the person is" pointed five different ways on the same drawing - the
// middle of the picture, the middle of each row (which is the middle of "staff
// ... hair"), the widest run (the robe), a band of rows over the top (the staff
// and a mass of hair) and skin colour (his staff is brown, so the wood counted
// as skin) - and each nudge built on one of them moved him further off than he
// started.  The instrument is the drawing rendered at the size the stage
// actually uses, with a red line down the middle of the screen to judge it
// against, and the eye.
// Judged that way, Megu stands centred on her own and Taro does not: his staff
// runs off the left edge of the screen and leaves the sea empty on the right.
// So the stylesheet moves him, and it knows which of them is standing there
// because of the line below.
function show(who) {
  const name = who?.toUpperCase();
  const face = FACES[name];
  const img = $('d-char')?.querySelector('img');
  if (!face || !img) return;
  if (!img.src.endsWith(face)) img.src = face;
  img.dataset.who = name;
}

let beats = [], at = 0, running = false, scene = '';

let back;                               // the timer that puts the noise back

/** Turn the line over: the noise becomes what was really said, and a second tap
 *  - or five seconds - turns it back.  It is not a translation she keeps, it is
 *  a glance at the writing on the sign.  Whole line at once, because one word
 *  out of a sentence she cannot read is not worth the tap. */
function flip(line) {
  clearTimeout(back);
  const open = line.classList.toggle('open');
  for (const s of line.querySelectorAll('.noise')) {
    s.textContent = open ? s.dataset.said : s.dataset.noise;
  }
  if (open) back = setTimeout(() => flip(line), 5000);
}

/** The next line.  Nothing in here listens for a tap: the screen does, and the
 *  screen calls this - so the story runs the same whatever she pressed.
 *  A tap that landed on the noise is the exception: it turns that line over and
 *  goes no further, or the same tap would show her the words and take them away
 *  in the same instant. */
export const advance = (e) => {
  const noise = e?.target?.closest?.('.noise');
  if (noise) return flip(noise.closest('.line'));
  if (running) step();
};

/** Effects run on the way past; the next line she reads stops the walk. */
function step() {
  const box = $('d-say');
  clearTimeout(back);                   // the line it would turn back is gone
  while (at < beats.length && beats[at].effect) runEffect(beats[at++].effect);
  if (at >= beats.length) {
    running = false;                    // and the screen stops being a way on
    // The test comes before the curtain, where she put it: she has just been
    // spoken to in a language she is learning, and this asks what she caught of
    // it.  It runs the plate itself until it is done, then hands it back.
    return startQuiz(box, scene, [...said], () => {
      box.innerHTML = '<p class="end">— to be continued —</p>';
    });
  }
  const b = beats[at++];
  show(b.who);                          // the screen belongs to whoever is talking
  if (b.fx) runEffect(b.fx);            // the screen flinches as the line lands
  const jp = JAPANESE.test(b.text);
  box.innerHTML = `${b.who ? `<p class="who">${esc(named(b.who))}</p>` : ''}
    <p class="line">${jp ? heard(b.text) : esc(b.text)}</p><p class="on">tap to go on</p>`;
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
  scene = name;
  said.clear();                         // the test asks about THIS run of it
  running = true;                       // the screen carries the taps from here
  step();
}
