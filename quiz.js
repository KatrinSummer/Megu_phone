// The test at the end of a scene: how much of their language does she have?
//
// The questions come in the order the conversation went.  He has just been
// talking at her, so the first three only ask what he said; then she tries to
// say something back; then a whole sentence has to hold together, ending on
// the longest one there is.  Every question is Megu trying to speak or trying
// to follow, because that is what is happening to her; none of it is a
// vocabulary drill with a costume on.
//
// How many there are is not a number written down here - it is however many
// the words of this scene can carry.  A length fixed at ten is what drove the
// old version out into the deck for filler, and filler is what put a relative
// raising pigs in a field into a test about a shipwreck.
//
// Every question ends with "I don't know", and it counts as wrong.  Three
// guesses and no way to say "no idea" cannot tell knowing from luck, and saying
// how much she actually has is this test's whole job.
//
// It asks about the words that were spoken in this scene and about nothing
// else. Wrong answers still come from the deck - a wrong answer only has to
// look possible - but no question is ever about a word he did not say.
// How it went is written down, because the story is meant to read it: a good
// score opens many quests, a poor one few.
import { $, esc } from './dom.js';
import { deck, cardOf } from './boards.js';
import { settings, saveSettings } from './store.js';
import { LEVELS, levelOf, levelName, setLevel } from './level.js';

const shuffle = (list) => list.sort(() => Math.random() - 0.5);

/** Answers that could pass for the right one: the same sort of length, where
 *  the deck allows it, or the right answer is the odd one out and she can pick
 *  it without reading a word. `key` is the side being answered in. */
function decoys(card, n, key) {
  const len = [...card[key]].length;
  const others = deck.cards.filter((c) => c.f !== card.f && c.e !== card.e);
  const near = others.filter((c) => Math.abs([...c[key]].length - len) <= 2);
  return shuffle([...(near.length >= n ? near : others)]).slice(0, n);
}

/** Three to choose from and a fourth that is not a choice at all. */
const REAL = 2;                           // decoys; with the right answer, three
const IDK = "I don't know";

const answers = (card, key) =>
  shuffle([card, ...decoys(card, REAL, key)]).map((c) => c[key]);

/** The easy end: he is the one talking, and all she has to do is catch it. */
const toHear = (c) => ({
  q: `He said <b>${esc(c.f)}</b>. What was that?`,
  opts: answers(c, 'e'), right: c.e,
});

/** Harder, because now it is her turn: she has something to say and has to
 *  find it, with nobody having said it first. */
const toSay = (c) => ({
  q: `You want to say <b>${esc(c.e)}</b>. How does it go?`,
  opts: answers(c, 'f'), right: c.f,
});

/** A whole sentence with the word taken out of it.  Her own example sentences,
 *  in the kana she reads, spaced word by word the way the rest of the app
 *  spaces them - so the question is whether she can hold the sentence, not
 *  whether she can find a word in a list. */
const WORD = 8;                           // kana; past this it is a phrase, not a word
const isWord = (c) => [...c.f].length <= WORD;

function toSpeak(c, nth = 0) {
  // A word missing out of a sentence, not a sentence missing out of a sentence.
  // A fair share of the deck is whole phrases, and one of those in the hole
  // turns the question into five unrelated sentences to choose between - which
  // is not the sentence being read at all.
  if (!isWord(c)) return null;
  // A word can be asked twice; the second time it takes its other sentence,
  // because the same sentence twice is the same question twice.
  const all = (c.x ?? []).filter((x) => x.k?.split(' ').includes(c.f));
  const ex = all[nth];
  if (!ex) return null;
  // And a sentence that still says something with the word taken out of it.
  // "は が ＿＿＿" is correct Japanese - 歯が痛い, my tooth hurts - and it is
  // not a question: in kana it is two bare particles and a hole, with nothing
  // left to work the missing word out from.
  if ([...ex.k.split(' ').filter((w) => w !== c.f).join('')].length < 4) return null;
  const hole = ex.k.split(' ').map((w) => (w === c.f ? '＿＿＿' : w)).join(' ');
  return {
    q: `You are trying to say this. One word is missing:<br><span class="cloze">${esc(hole)}</span>`,
    opts: answers(c, 'f'), right: c.f,
  };
}

/** The questions, in the order she meets them - and every one of them about a
 *  word he actually said in this scene.
 *  They used to be topped up out of the deck once the scene's own words ran
 *  out.  That is how a test on a woman who had just washed up on a beach came
 *  to ask her about a relative raising pigs in a field, and about "I forgot
 *  (polite)": correct Japanese, nothing to do with her, and the test stopped
 *  being the last part of the conversation and became a drill.  A short test on
 *  what was said beats a long one on nothing.
 *  The questions the story actually wants - her asking where she is, telling
 *  him what happened to her - need Japanese written for them, and the Japanese
 *  in scenes is ChatGPT's to write; MEGU_TEST_REQUEST_20260926.txt asks for it. */
function build(words) {
  const cards = shuffle([...new Set(words)].map(cardOf).filter(Boolean));
  if (!cards.length) return [];
  const qs = [...cards.slice(0, 3).map((c) => toHear(c)),
              ...cards.slice(0, 3).map((c) => toSay(c))];

  // Then whole sentences of hers with one word cut out, built from those same
  // words.  A word that comes round a second time brings its other example
  // sentence with it; the same sentence twice is the same question twice.
  const holes = [];
  for (let nth = 0; nth < 2; nth++) {
    for (const c of cards) {
      const q = toSpeak(c, nth);
      if (q && !holes.some((h) => h.q === q.q)) holes.push(q);
    }
  }
  // Shortest first, so the test ends on the longest sentence there is - the one
  // meant to be past her.
  holes.sort((a, b) => a.q.length - b.q.length);
  qs.push(...(holes.length > 4 ? [...holes.slice(0, 3), holes.at(-1)] : holes.slice(0, 4)));
  return qs;
}

/**
 * `box` is the speech plate, `name` the scene it belongs to, `words` the
 * Japanese said in it, `done` what happens once she has finished - the scene's
 * own ending.
 * With nothing to ask about, there is no test: an empty one would be a screen
 * she has to tap past for no reason.
 */
export function startQuiz(box, name, words, done) {
  const qs = build(words);
  if (!qs.length) return done();

  let at = 0, right = 0, pick = null;

  const draw = () => {
    const q = qs[at];
    box.innerHTML = `<p class="who">A test</p>
      <p class="quiz-q">${q.q}</p>
      <div class="quiz">${[...q.opts, IDK].map((o) => {
        const state = !pick ? '' : o === q.right ? ' right' : o === pick ? ' wrong' : ' dim';
        return `<button class="quiz-a${o === IDK ? ' idk' : ''}${state}">${esc(o)}</button>`;
      }).join('')}</div>
      <p class="on">${pick ? 'tap to go on' : `${at + 1} of ${qs.length}`}
        <button class="skip">Skip the test</button></p>`;
    // Out of the whole thing, not just this question: nobody should be held on
    // a screen answering ten times to get on with the story.
    box.querySelector('.skip').addEventListener('click', (e) => {
      e.stopPropagation();
      skipped();
    });
    for (const b of box.querySelectorAll('.quiz-a')) {
      b.addEventListener('click', (e) => {
        e.stopPropagation();                  // the screen is a way on; this is not
        if (pick) return next();
        pick = b.textContent;
        if (pick === q.right) right++;
        draw();
      });
    }
    // Once she has answered, the whole plate is the way on, the same as the rest
    // of the story - she should not have to find the small print.
    if (pick) box.addEventListener('click', next, { once: true });
  };

  /** Written down where the story can read it later: which scene, what it made
   *  of her, and that she is through it.  `done` is what opens her quests and
   *  it is written here and nowhere else - opening a scene is not finishing
   *  one, and a mark on Home before that promises her something that has not
   *  happened. */
  function land(id, got, of, skip) {
    (settings.scenes ??= {})[name] = { right: got, of, done: true, ...(skip && { skipped: true }) };
    saveSettings();
    setLevel(id);
  }

  /** Answered to the end: the score says what it says. */
  function finish(got, of) {
    const id = levelOf(got, of);
    land(id, got, of, false);
    box.innerHTML = `<p class="who">A test</p>
      <p class="quiz-q"><b>${got} of ${of}</b></p>
      <p>${esc(levelName(id))}.</p>
      <p class="on">You can change this in Settings · tap to go on</p>`;
    box.addEventListener('click', done, { once: true });
  }

  /** Pressed past it.  A test she did not sit cannot say a thing about her, so
   *  she is asked rather than sentenced - handing her a verdict off a test she
   *  refused is the app making something up about her.
   *  The same four levels the test itself hands out, and the same four
   *  Settings holds: one ladder, so a level set here and a level set there
   *  mean the same thing. */
  function skipped() {
    box.innerHTML = `<p class="who">A test</p>
      <p class="quiz-q">You skipped the test. How much of their language do you have?</p>
      <div class="chips lv">${LEVELS.map(([id, title]) =>
        `<button data-lv="${esc(id)}">${esc(title)}</button>`).join('')}</div>
      <p class="on">You can change this in Settings</p>`;
    for (const b of box.querySelectorAll('[data-lv]')) {
      b.addEventListener('click', (e) => {
        e.stopPropagation();                  // the plate is a way on; this is not
        land(b.dataset.lv, 0, qs.length, true);
        box.innerHTML = `<p class="who">A test</p>
          <p>${esc(levelName(b.dataset.lv))}.</p>
          <p class="on">You can change this in Settings · tap to go on</p>`;
        box.addEventListener('click', done, { once: true });
      });
    }
  }

  const next = () => {
    at++;
    pick = null;
    if (at < qs.length) return draw();
    finish(right, qs.length);
  };

  draw();
}
