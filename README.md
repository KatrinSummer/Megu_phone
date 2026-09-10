# Megu — Japanese flashcards for the phone

**Open on your phone: https://katrinsummer.github.io/Megu_phone/**

It is a web page, so any phone works — iPhone, Android, or a computer. To keep
it on the home screen and run it full screen, like an app:

- **iPhone** (Safari): Share → *Add to Home Screen*
- **Android** (Chrome): ⋮ → *Add to Home screen* / *Install app*

Nothing is installed from a store, and once opened it works with no internet.

808 Japanese words, every one of them spoken aloud, with a review schedule
that shows a word again just before it would be forgotten.

- The Japanese word is **spoken as it appears** — hearing it is part of the question.
- Tap to see the reading, the kanji and the meaning.
- Three answers — *Forgot / Knew it / Easy* — and each says up front when the
  word will come back: tomorrow, in 4 days, in 2 months.
- Bookmark anything worth coming back to.
- Open the menu (☰) once and press **Download all the sound** — after that the
  phone needs no network at all.

## Your progress

Kept on the phone, and tied to the **word**, not to the deck — so words can be
added, moved between decks, and decks renamed, without losing any history. It
remembers the interval, the ease, how many times you slipped, and the bookmark.

Nothing is sent anywhere. To keep a copy off the app, open the menu and press
*Save progress to a file* — the share sheet appears, choose *Save to Files*
(iCloud Drive if you want it off the phone). *Restore from a file* reads it
back, and merges rather than overwrites: for each word the more recent review
wins, so restoring an old file never loses newer work.

## Where the words come from

Built by [**Megu on the computer**](https://github.com/KatrinSummer/Megu),
which is where the vocabulary actually lives:
lessons come in, words get filed into decks, and the deck is exported.
After a lesson is imported over there, `npm run phone` brings the new words
here: it says the ones with no sound, rebuilds `deck.json` and `audio/`, checks
the result in a real browser, and pushes this repository. GitHub Pages does the
rest, and a phone with the app open notices the new version and reloads itself.

Sound is said once per word (edge-tts, voice `ja-JP-NanamiNeural`) and kept
forever in `_audio_test/cache`, named after the md5 of the word, so only the
missing ones are ever fetched.

Everything here is hand-written — no framework, no build step. One subject per
file, and `shell.json` lists them all so the service worker and the update check
never disagree about what the app is made of:

| file | answers |
| --- | --- |
| `index.html` | the markup and every line of CSS |
| `dom.js` | talking to the page |
| `store.js` | what is saved, and what happens when saving fails |
| `schedule.js` | when a word comes back |
| `boards.js` | which words she is shown, and in what order |
| `sound.js` | saying the word out loud |
| `screens.js` | what is on the screen |
| `backup.js` | moving progress between two phones |
| `menu.js` | the settings sheet |
| `app.js` | wiring, startup, and noticing a new version |
| `sw.js` | the offline cache |
