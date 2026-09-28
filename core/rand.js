// Shuffling, in one place.
//
// It was written out three times - the boards, the jungle and the test - which
// is three chances for them to disagree about what "shuffled" means.

/** In place, and it returns the same list: every caller here wants both. */
export const shuffle = (list) => list.sort(() => Math.random() - 0.5);
