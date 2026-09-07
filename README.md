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
`npm run pwa` over there writes `deck.json` and `audio/` into this repository.
Sound is generated once per word (edge-tts, voice `ja-JP-NanamiNeural`).

The only hand-written files here are `index.html`, `app.js` and `sw.js` — no
framework, no build step.
