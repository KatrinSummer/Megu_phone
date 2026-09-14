// Which way her finger went across the card. Right is on to the next card,
// left is back to the one before - the way round she asked for.
export function onSwipe(el, { right, left }) {
  let x0 = null, y0 = 0;
  el.addEventListener('touchstart', (e) => {
    x0 = e.touches.length === 1 ? e.touches[0].clientX : null;
    y0 = e.touches[0].clientY;
  }, { passive: true });
  el.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    x0 = null;
    // Long and flat: scrolling down a long card is not a swipe.
    if (Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(dy)) (dx > 0 ? right : left)();
  });
}
