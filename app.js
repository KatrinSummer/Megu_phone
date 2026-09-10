// Megu review app. Everything lives on the phone; the network is only ever
// used to back the progress up, never to show a card.
//
// dom.js       talking to the page
// store.js     what is saved, and what happens when saving fails
// schedule.js  when a word comes back
// boards.js    which words she is shown, and in what order
// sound.js     saying the word out loud
// screens.js   what is on the screen
// backup.js    moving progress between two phones
// menu.js      the settings sheet
import { $ } from './dom.js';
import { progress, doneToday, lifetime, saveProgress } from './store.js';
import { deck, setDeck, queue } from './boards.js';
import { answer } from './schedule.js';
import { merge } from './backup.js';
import { playing, sayOnFirstTap } from './sound.js';
import { home, render, stats, currentCard, toggleStar } from './screens.js';
import { openMenu } from './menu.js';

$('menu').addEventListener('click', openMenu);
$('back').addEventListener('click', home);
$('star').addEventListener('click', toggleStar);
sayOnFirstTap(currentCard);

fetch('deck.json').then((r) => r.json()).then((d) => { setDeck(d); home(); });

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

// The service worker fetches the app from the network, so every launch gets the
// newest one - but a tab left open all day never launches again, and goes on
// running the code it started with.  Whenever she comes back to the app, ask
// whether it has changed and reload if it has.  The app is many small files, so
// it asks about all of them: any one of them is enough to make it out of date.
async function stamp() {
  const files = await (await fetch('shell.json', { cache: 'no-cache' })).json();
  const watched = ['shell.json', ...files.filter((f) => /\.(js|html|json)$/.test(f))];
  const tags = await Promise.all(watched.map(async (f) => {
    // HEAD skips the worker's fetch handler entirely and costs only headers.
    const r = await fetch(f, { method: 'HEAD', cache: 'no-cache' });
    return r.headers.get('etag') ?? r.headers.get('last-modified') ?? '';
  }));
  return tags.join('|');
}

let running = null;
async function checkForUpdate() {
  try {
    const now = await stamp();
    if (running && now !== running) location.reload();
    else running = now;
  } catch {}                       // no signal: go on running what we have
}
checkForUpdate();
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkForUpdate(); });

// Only on a local machine: lets scripts/check-pwa.mjs test the schedule and the
// merge for real instead of poking at the screen.
if (['127.0.0.1', 'localhost'].includes(location.hostname)) {
  window.megu = { merge, answer, stats, home, checkForUpdate, saveProgress, doneToday, lifetime,
                  get progress() { return progress; }, get deck() { return deck; },
                  get audioSrc() { return playing(); }, get current() { return currentCard(); },
                  get queue() { return queue; } };
}
