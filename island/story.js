// A scene of the story: her text, played one line at a time.
//
// The scene lives in a text file she writes herself - names, lines, and
// -effects- between dashes - so the story can grow without this file changing.
import { $, esc } from '../core/dom.js';
import { settings, saveSettings } from '../core/store.js';
import { LEVELS, setLevel } from './level.js';
// What a line of theirs sounds like to her - a subject of its own, and the
// only part of a scene that is about the language rather than about the play.
import { heard, JAPANESE, clearHeard } from './heard.js';

/** The scene she opens on, named once for the whole app: Home opens it, and
 *  the island waits on it to hand out quests.  It was written down in both of
 *  those places, which is two files free to disagree about which scene the
 *  story begins with.  Its text lives in story/01-beach.txt - she writes the
 *  story, and a line of it should never mean editing code. */
export const FIRST = '01-beach';

/** The scene that hands her her first quests: her two lines about the
 *  islanders, played the first time she presses Megu on the island.  She drew
 *  it as a conversation and not as one crowded plate - press her, she talks,
 *  and THEN the quests exist. */
export const QUESTS = '02-quests';

/** Which version of each scene she has played.  A scene finished once is
 *  remembered for good - that memory is what puts the "!" on Home - but the
 *  scenes are hers and she rewrites them, and then the mark stands on Home for
 *  a scene nobody has seen.  A record carries the number the scene had when it
 *  was earned; bump the one whose text changed, and it waits to be earned
 *  again with nothing for her to clear by hand. */
export const V = { [FIRST]: 4, [QUESTS]: 1 };
export const FIRST_V = V[FIRST];

/** Played to the end, in the text that is there now.  It asks for `done` and
 *  not merely for a record, because a record written by an older build was
 *  written under a looser rule: opening a scene is not finishing one. */
export const played = (name) => settings.scenes?.[name]?.done === true
  && settings.scenes[name].v === V[name];

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

/** A change of place, not a flash: the ground goes dark and the stage empties,
 *  and it stays that way until somebody new is standing on it.  She has no
 *  drawing of the church yet, so black is what the church is. */
function blackout() {
  $('main')?.classList.add('blackout');
  blank = true;
  const img = $('d-char')?.querySelector('img');
  if (img) img.hidden = true;
}

function runEffect(name) {
  if (name === 'black') return blackout();
  const ms = EFFECTS[name];
  if (!ms) {
    console.warn(`story: no effect called "${name}". There is: ${Object.keys(EFFECTS).join(', ')}`);
    return;
  }
  const main = $('main');
  main.classList.add(`fx-${name}`);
  setTimeout(() => main.classList.remove(`fx-${name}`), ms);
}

/** A scene is written with the speaker in capitals - MEGU, TORO - because that
 *  is how a script reads on the page.  On screen it is a name, not shouting. */
// Nobody has introduced him.  She washes up on a beach and a stranger speaks to
// her in a language she does not have a word of - she cannot know his name, and
// a plate that prints it is the story telling her something she was never told.
// He leaves this set on the day the story says who he is.
const UNMET = new Set(['TORO']);
/** A name the screen spells its own way.  Her thoughts are not her speaking,
 *  and the plate says so: she asked for "Megu Thought" over them. */
const SHOWN = { 'MEGU THOUGHT': 'Megu Thought' };
const named = (who) => (UNMET.has(who.toUpperCase()) ? '???'
  : SHOWN[who.toUpperCase()] ?? who[0] + who.slice(1).toLowerCase());

// Who the screen shows.  There is one place to stand, so it belongs to whoever
// is talking - a story that keeps showing her while somebody else speaks is
// telling the wrong thing.  A name with no picture leaves whoever is there.
const FACES = {
  MEGU: 'img/char.webp',
  'MEGU THOUGHT': 'img/char.webp',
  TORO: 'img/taro.webp',
  LILY: 'img/lily.webp',
  HANRY: 'img/hanry.webp',
};
// Nobody is nudged by a MEASUREMENT any more.  Five different ways of measuring
// "where the person is" pointed five different ways on the same drawing - the
// middle of the picture, the middle of each row (which is the middle of "staff
// ... hair"), the widest run (the robe), a band of rows over the top (the staff
// and a mass of hair) and skin colour (his staff is brown, so the wood counted
// as skin) - and each nudge built on one of them moved him further off than he
// started.  The instrument is the drawing rendered at the size the stage
// actually uses, with a red line down the middle of the screen to judge it
// against, and the eye.
// Judged that way, Megu stands centred on her own and Toro does not: his staff
// runs off the left edge of the screen and leaves the sea empty on the right.
// So the stylesheet moves him, and it knows which of them is standing there
// because of the line below.
function show(who) {
  const img = $('d-char')?.querySelector('img');
  if (!img) return;
  const name = who?.toUpperCase();
  const face = FACES[name];
  // Nobody to show: the stage is left empty rather than leaving the last
  // person standing there while somebody else does the talking.
  if (!face) { img.hidden = true; return; }
  // After a change of place the stage stays empty until somebody new walks on
  // to it.  The line straight after the change is hers, and standing her on
  // the new ground before the story has shown it is telling the wrong thing.
  if (blank && name === img.dataset.who) { img.hidden = true; return; }
  blank = false;
  img.hidden = false;
  if (!img.src.endsWith(face)) img.src = face;
  img.dataset.who = name;
}

let beats = [], at = 0, running = false, scene = '', ends = null;
// Who spoke last, whether the stage is dark and empty, and whether the screen
// is between two lines - a tap in that gap must not eat the next one.
let lastWho = '', blank = false, hold = false;

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
  if (running && !hold) step();
};

/** The last beat of the intro is hers, and it is a question: how much of their
 *  language does she have?  A test of nine questions used to stand here - she
 *  took it out of the story, and this is what she wrote in its place.
 *  Answering it is what writes the scene down as played, because it is the
 *  last thing the intro asks of her: the mark on Home hangs on that, and a
 *  scene left half way through has not been played. */
const LEVEL_Q = 'Megu is having trouble with the local accent! '
  + 'What is your lvl of the language?';

/** Written down as played, in the version that is on disk now. */
const mark = () => {
  (settings.scenes ??= {})[scene] = { done: true, v: V[scene] ?? 1 };
  saveSettings();
};

/** The end of a scene.  The intro - and only the intro - ends on her own
 *  question about how much of the language she has; every other scene simply
 *  closes and hands her back to whatever opened it. */
function finishScene(box) {
  if (scene === FIRST) return askLevel(box);
  mark();
  box.innerHTML = '<p class="end">— to be continued —</p>';
  ends?.();
}

function askLevel(box) {
  // The screen goes dark and the question stands in the middle of it, the way
  // she drew it - not on the plate at the foot of the screen, which is where
  // the conversation happened and this is not part of the conversation.
  const over = document.createElement('div');
  over.className = 'over dark';
  over.id = 'over';
  over.innerHTML = `<div class="card"><p>${esc(LEVEL_Q)}</p>
    <div class="chips lv">${LEVELS.map(([id, title]) =>
    `<button data-lv="${esc(id)}">${esc(title)}</button>`).join('')}</div></div>`;
  document.body.append(over);
  for (const b of over.querySelectorAll('[data-lv]')) {
    b.addEventListener('click', (e) => {
      e.stopPropagation();              // the screen is a way on; this is not
      setLevel(b.dataset.lv);
      mark();
      over.remove();
      box.innerHTML = '<p class="end">— to be continued —</p>';
      ends?.();
    });
  }
}

/** Effects run on the way past; the next line she reads stops the walk. */
function step() {
  const box = $('d-say');
  clearTimeout(back);                   // the line it would turn back is gone
  while (at < beats.length && beats[at].effect) runEffect(beats[at++].effect);
  if (at >= beats.length) {
    running = false;                    // and the screen stops being a way on
    return finishScene(box);
  }
  const b = beats[at++];
  const changed = (b.who ?? '') !== lastWho;
  lastWho = b.who ?? '';
  show(b.who);                          // the screen belongs to whoever is talking
  if (b.fx) runEffect(b.fx);            // the screen flinches as the line lands
  const jp = JAPANESE.test(b.text);
  const html = `${b.who ? `<p class="who">${esc(named(b.who))}</p>` : ''}
    <p class="line">${jp ? heard(b.text) : esc(b.text)}</p><p class="on">tap to go on</p>`;
  // The person arrives before their line does.  Both landing in the same
  // instant reads as the one who was already standing there saying it, which
  // is what she saw every time the speaker changed.  The plate is empty for
  // that moment, and a tap in it is ignored rather than eating the line.
  if (!changed) { box.innerHTML = html; return; }
  box.innerHTML = '';
  hold = true;
  setTimeout(() => { hold = false; box.innerHTML = html; }, 220);
}

// Which scene was asked for last.  A scene is fetched, so two of them asked
// for in quick succession are a race, and the one that lands LAST wins however
// long ago it was asked for: pressing her, leaving, and pressing her again put
// the intro on screen in place of the scene she had just asked for.  The older
// load is dropped instead.
let load = 0;

export async function startScene(name, onEnd) {
  const box = $('d-say');
  box.hidden = false;
  ends = onEnd;
  const mine = ++load;
  let text;
  try {
    text = await (await fetch(`story/${name}.txt`)).text();
  } catch {
    // Offline and never cached, or the file was renamed: say so rather than
    // sit there with an empty plate.
    box.innerHTML = `<p>The scene "${esc(name)}" could not be read.</p>`;
    return;
  }
  if (mine !== load) return;            // she asked for another scene while this loaded
  beats = parseScene(text);
  at = 0;
  scene = name;
  clearHeard();                         // a test asks about THIS run of it
  // A second time through starts on the same ground as the first: nobody left
  // standing from last time, no change of place still in force.
  lastWho = ''; blank = false; hold = false;
  $('main')?.classList.remove('blackout');
  const img = $('d-char')?.querySelector('img');
  if (img) img.hidden = false;
  running = true;                       // the screen carries the taps from here
  step();
}
