# Megu on the phone

The same 808 Japanese words as Megu on the computer, with sound and with a
review schedule. Installs as a home-screen icon; works with no internet.

## Put it on the phone

Open the site in Safari -> Share -> "Add to Home Screen". Then open the menu
(the ☰ button) once and press "Download all the sound" - after that the phone
needs no network at all.

## Where the contents come from

Built by Megu: `npm run pwa` reads `portable/library` and the generated audio,
and writes `deck.json` and `audio/` here. The only hand-written files are
`index.html`, `app.js` and `sw.js`.

## Progress

Lives on the phone. A copy goes to the cloud (see `../worker`), and there is a
"Save progress to a file" button as well. It is tied to the WORD, not to the
deck, so words can be added, moved between decks, and decks renamed, and the
history still follows the word.
