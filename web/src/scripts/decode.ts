/**
 * THE DECODE — text that arrives as noise and resolves.
 *
 * Every character is its own span. It flips through a technical glyph set
 * every ~45 ms and lands on its real value at its own time, so a line resolves
 * left to right and a block resolves top to bottom. This only works in a
 * monospaced face: every glyph is the same width, so nothing shakes.
 *
 * Shared by the instrument pages. `OneScreen` prints its own spans, so
 * `/lab/natt` calls `scramble` on those; the other pages call `decode` on a
 * plain element and let `split` make the spans.
 */
export const GLYPHS = '0123456789ABCDEFXZ<>/\\|[]{}=+*#_—·';
export const rnd = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
export const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Wrap every character of a plain-text element in `.chi`. Idempotent.
 *
 * Characters are grouped by word in a `.w` that does not break, and the
 * spaces between words are left as plain text. Without that, every glyph is
 * its own inline box and the line breaks wherever it runs out of room — in
 * the middle of "nettsider".
 */
export function split(el: HTMLElement): HTMLElement[] {
  if (el.dataset.split) return Array.from(el.querySelectorAll<HTMLElement>('.chi'));
  const text = el.textContent ?? '';
  el.textContent = '';
  const out: HTMLElement[] = [];
  text.split(' ').forEach((word, i) => {
    if (i) el.appendChild(document.createTextNode(' '));
    if (!word) return;
    const w = document.createElement('span');
    w.className = 'w';
    for (const ch of word) {
      const c = document.createElement('span');
      c.className = 'chi';
      c.dataset.t = ch;
      c.textContent = ch;
      w.appendChild(c);
      out.push(c);
    }
    el.appendChild(w);
  });
  el.dataset.split = '1';
  return out;
}

/** Scramble one span, landing it at `at` ms. Whitespace lands at once. */
export function scramble(el: HTMLElement, at: number, flip = 45) {
  const real = el.dataset.t ?? el.textContent ?? '';
  if (still() || real.trim() === '') {
    el.textContent = real;
    el.classList.remove('noise');
    return;
  }
  /* A new run on the same span cancels the one before it; otherwise two runs
     race and the loser keeps flipping after the winner has landed. */
  const run = String(Number(el.dataset.run ?? 0) + 1);
  el.dataset.run = run;
  el.classList.add('noise');
  let t = 0;
  const tick = () => {
    if (el.dataset.run !== run) return;
    if (t >= at) {
      el.textContent = real;
      el.classList.remove('noise');
      return;
    }
    el.textContent = rnd();
    t += flip;
    setTimeout(tick, flip);
  };
  tick();
}

/** Decode a whole element. Returns when the last character lands, in ms. */
export function decode(el: HTMLElement, { delay = 0, perChar = 34, flip = 45 } = {}) {
  const chars = split(el);
  el.classList.add('ready');
  chars.forEach((c, i) => scramble(c, delay + 220 + i * perChar, flip));
  return delay + 220 + chars.length * perChar;
}

/**
 * A typewriter for one line, with edits: retyping a different string erases
 * back to where the two stop agreeing and writes on from there, so a switch
 * reads as a correction rather than a wipe.
 */
export function typer(target: HTMLElement) {
  let run = 0;
  return (s: string, speed = 14) => {
    const my = ++run;
    target.classList.add('ready');
    if (still()) { target.textContent = s; return; }
    const from = target.textContent ?? '';
    let keep = 0;
    while (keep < from.length && keep < s.length && from[keep] === s[keep]) keep++;
    let n = from.length;
    const write = () => {
      if (my !== run) return;
      if (n < s.length) { n++; target.textContent = s.slice(0, n); setTimeout(write, speed); }
    };
    const erase = () => {
      if (my !== run) return;
      if (n > keep) { n--; target.textContent = from.slice(0, n); setTimeout(erase, 8); return; }
      write();
    };
    erase();
  };
}

/** Type a `[data-type]` element's own text into place. Returns duration. */
export function typeSelf(el: HTMLElement, { delay = 0, speed = 14 } = {}) {
  const s = el.textContent ?? '';
  el.textContent = '';
  const t = typer(el);
  setTimeout(() => t(s, speed), delay);
  return delay + s.length * speed;
}

/** Run `cb` once, the first time each element is on screen. */
export function onEnter(els: Iterable<Element>, cb: (el: HTMLElement) => void, threshold = 0.2) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      cb(e.target as HTMLElement);
    }
  }, { threshold });
  for (const el of els) io.observe(el);
}
