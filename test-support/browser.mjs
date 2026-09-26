// Just enough browser for the phone's own logic to run under `node --test`.
//
// store.js keeps what she has done in localStorage and, when a write fails,
// puts a line about it on the screen. Neither exists in node, and standing in
// for both is six lines - far cheaper than declaring the schedule untestable
// and finding out about a mistake in it on her phone.
//
// It must be imported FIRST, before anything that reaches store.js: store.js
// reads and writes while it is being loaded.
//
// It lives beside the tests rather than among them because node counts every
// file inside a folder called `test` as a test, and a file with no checks in it
// passing quietly makes the tally one higher than the number of things proved.
const kept = new Map();
globalThis.localStorage = {
  getItem: (k) => (kept.has(k) ? kept.get(k) : null),
  setItem: (k, v) => { kept.set(k, String(v)); },
  removeItem: (k) => { kept.delete(k); },
  clear: () => kept.clear(),
};
// Only ever asked for the warning line, and only to set a property on it.
globalThis.document = {
  getElementById: () => ({}),
  querySelector: () => null,
  querySelectorAll: () => [],
  documentElement: { dataset: {} },
};
