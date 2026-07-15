import { useEffect, useRef } from "react";

/**
 * PixelDriftBanner
 *
 * Animated generative background: pixel grid + simplex noise + radial gradient.
 * Uses ImageData for maximum performance.
 *
 * Grid: ~4px visual dots with ~2px gap (scaled by DPR internally)
 * Animation: Two layers of 2D simplex noise drifting at different speeds
 * Background: CSS radial gradient (deep indigo → purple → near-black)
 */

// ─── Simplex Noise 2D ────────────────────────────────────────────────
const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;
const grad3 = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

function buildPermTable(seed: number): Uint8Array {
  const p = new Uint8Array(512);
  const src = new Uint8Array(256);
  for (let i = 0; i < 256; i++) src[i] = i;
  let s = seed;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [src[i], src[j]] = [src[j], src[i]];
  }
  for (let i = 0; i < 512; i++) p[i] = src[i & 255];
  return p;
}

function noise2D(perm: Uint8Array, x: number, y: number): number {
  const s = (x + y) * F2;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const t = (i + j) * G2;
  const x0 = x - (i - t);
  const y0 = y - (j - t);

  const i1 = x0 > y0 ? 1 : 0;
  const j1 = x0 > y0 ? 0 : 1;

  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2;
  const y2 = y0 - 1 + 2 * G2;

  const ii = i & 255;
  const jj = j & 255;

  let n0 = 0, n1 = 0, n2 = 0;
  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 >= 0) {
    t0 *= t0;
    const gi = perm[ii + perm[jj]] % 8;
    n0 = t0 * t0 * (grad3[gi][0] * x0 + grad3[gi][1] * y0);
  }
  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 >= 0) {
    t1 *= t1;
    const gi = perm[ii + i1 + perm[jj + j1]] % 8;
    n1 = t1 * t1 * (grad3[gi][0] * x1 + grad3[gi][1] * y1);
  }
  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 >= 0) {
    t2 *= t2;
    const gi = perm[ii + 1 + perm[jj + 1]] % 8;
    n2 = t2 * t2 * (grad3[gi][0] * x2 + grad3[gi][1] * y2);
  }
  return (70 * (n0 + n1 + n2) + 1) * 0.5; // [0, 1]
}

// ─── Component ───────────────────────────────────────────────────────
export function PixelDriftBanner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (!ctx) return;

    const perm1 = buildPermTable(42);
    const perm2 = buildPermTable(137);

    // ─── Visual dot grid: 3px dot, 1px gap (in CSS pixels) ───────
    const DOT = 3;
    const GAP = 1;
    const CELL = DOT + GAP;

    // ─── Noise config ────────────────────────────────────────────
    const SCALE1 = 0.012;
    const SCALE2 = 0.022;
    const SPEED1 = 0.00015;
    const SPEED2 = 0.0001;

    let imgData: ImageData | null = null;
    let data: Uint8ClampedArray | null = null;
    let cw = 0;
    let ch = 0;
    let cols = 0;
    let rows = 0;
    let dpr = 1;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w !== cw || h !== ch) {
        cw = w;
        ch = h;
        canvas!.width = w;
        canvas!.height = h;
        cols = Math.ceil(w / CELL);
        rows = Math.ceil(h / CELL);
        imgData = ctx!.createImageData(w, h);
        data = imgData.data;
      }
    }

    let lastResizeCheck = 0;

    function draw(time: number) {
      if (time - lastResizeCheck > 500) {
        resize();
        lastResizeCheck = time;
      }

      if (!imgData || !data) {
        resize();
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      data.fill(0);

      // Glow center
      const cx = cw * 0.6;
      const cy = ch * 0.4;
      const maxDist = Math.sqrt(cw * cw + ch * ch) * 0.6;

      const t1 = time * SPEED1;
      const t2 = time * SPEED2;

      for (let row = 0; row < rows; row++) {
        const y = row * CELL;

        for (let col = 0; col < cols; col++) {
          const x = col * CELL;

          // Two octaves of simplex noise
          const n1val = noise2D(perm1, x * SCALE1 + t1, y * SCALE1 + t1 * 0.7);
          const n2val = noise2D(perm2, x * SCALE2 - t2, y * SCALE2 + t2 * 1.3);
          const noiseVal = n1val * 0.6 + n2val * 0.4;

          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;

          // Alpha curve matching the original:
          // Quadratic falloff from noise, boosting contrast
          let alpha = noiseVal * noiseVal * 1.2;

          // Boost alpha slightly towards the edges
          const edgeBoost = Math.min(dist * 0.6, 0.3);
          alpha += edgeBoost;

          // Suppress in the glow epicenter to let the gradient shine
          if (dist < 0.45) {
            // Smoothly interpolate from highly suppressed at center to normal
            const centerFade = Math.max(0.2, dist / 0.45);
            alpha *= centerFade * centerFade; 
          }

          // Create organic gaps
          if (noiseVal < 0.25) {
            alpha *= Math.pow(noiseVal / 0.25, 2);
          }

          // Clamp
          alpha = Math.max(0, Math.min(alpha, 0.85));
          if (alpha < 0.01) continue;

          const a = Math.round(alpha * 255);
          const rowOffset = y * cw;

          // Paint 3x3 pixel dot
          for (let dy2 = 0; dy2 < DOT; dy2++) {
            const ry = y + dy2;
            if (ry >= ch) break;
            const rOffset = ry * cw;
            for (let dx2 = 0; dx2 < DOT; dx2++) {
              const rx = x + dx2;
              if (rx >= cw) break;
              const idx = (rOffset + rx) * 4;
              data[idx] = 255;
              data[idx + 1] = 255;
              data[idx + 2] = 255;
              data[idx + 3] = a;
            }
          }
        }
      }

      ctx!.putImageData(imgData, 0, 0);
      rafRef.current = requestAnimationFrame(draw);
    }

    resize();
    rafRef.current = requestAnimationFrame(draw);

    const onResize = () => { lastResizeCheck = 0; };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="pixel-drift-banner" aria-hidden="true">
      <div className="pixel-drift-banner__gradient" />
      <canvas ref={canvasRef} className="pixel-drift-banner__canvas" />
    </div>
  );
}
