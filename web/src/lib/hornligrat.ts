/**
 * THE HÖRNLIGRAT ON ITS OWN — the BenchBoss ridge, cut out of the still's
 * trace so it can leave the photograph.
 *
 * On the front page BenchBoss owns the right-hand ridge (projects alternate,
 * and it is first). In `/lab/rygg` that ridge is the thread between the two
 * pages: clicking the row lifts the lit line off the rock, and it lands on the
 * case as the climb that fills while you read. Both ends draw THIS path in
 * THIS box, so the view transition morphs one picture of one line instead of
 * cross-fading two drawings that almost agree.
 *
 * The path runs BASE → SUMMIT, the opposite way to the trace. That is the
 * direction of the climb, and with `pathLength="1"` it means progress is a
 * plain dash offset from 1 to 0.
 *
 * The box is the ridge's own bounds plus a stroke's worth of margin, in the
 * still's viewBox units — so the front page can pin it inside the pushed frame
 * as percentages and it rides the camera without a line of script.
 */
import { still, smooth } from './skyline';

const PAD = 8;

const ridge = still.pts.slice(still.top).reverse();
const xs = ridge.map((p) => p[0]);
const ys = ridge.map((p) => p[1]);
const x0 = Math.min(...xs) - PAD;
const y0 = Math.min(...ys) - PAD;
const w = Math.max(...xs) + PAD - x0;
const h = Math.max(...ys) + PAD - y0;

export const climb = {
  d: smooth(ridge),
  viewBox: `${x0} ${y0} ${w} ${h}`,
  /** Width over height — the case page sizes its box by this, so the morph
      never changes shape. */
  ar: w / h,
  /** Where the box sits in the still's frame, as CSS percentages. */
  frame: {
    left: (x0 / still.vbw) * 100,
    top: (y0 / still.vbh) * 100,
    width: (w / still.vbw) * 100,
    height: (h / still.vbh) * 100,
  },
};
