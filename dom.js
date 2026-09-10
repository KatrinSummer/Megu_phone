// Talking to the page. Two lines, but every other module wants them.

export const $ = (id) => document.getElementById(id);

/** Her own words go into innerHTML, so they have to be defanged first. */
export const esc = (s) => String(s ?? '')
  .replace(/[<>&"]/g, (m) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[m]));
