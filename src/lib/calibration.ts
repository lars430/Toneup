/**
 * Client-side image processing for white-balance calibration + sub-region
 * sampling.
 *
 * Runs entirely in the browser using Canvas API — no upload, no API cost.
 *
 * The capture flow gives us two UI-guided regions: a white paper for white
 * balance, and the face oval. From the face region we automatically derive
 * sub-regions (forehead, nose, cheek L/R, chin) so the analysis can do
 * region-aware redness detection.
 *
 * Privacy benefit: we can skip uploading the full image entirely and just
 * send the extracted RGB samples. The user's face never leaves the device.
 */

export interface RegionSample {
  mean: [number, number, number];
  stdDev: number;
}

export interface CalibrationResult {
  paperRgb: [number, number, number];
  skinRgb: [number, number, number];
  /** Per-region samples on the face — used for region-aware redness etc. */
  regions?: {
    forehead?: RegionSample;
    templeL?: RegionSample;
    templeR?: RegionSample;
    jawline?: RegionSample;
    nose?: RegionSample;
    cheekL?: RegionSample;
    cheekR?: RegionSample;
    chin?: RegionSample;
  };
  /** Std-dev of the whole face region — proxy for evenness */
  skinStdDev?: number;
  /** Lighting metrics derived from paper + skin */
  lighting?: {
    /** Mean luminance of paper (0..1) */
    brightness: number;
    /** How warm the paper looks (R-B normalized); higher = warmer indoor light */
    warmthBias: number;
    /** Std-dev of paper region — high = uneven light, not a flat paper */
    paperUniformity: number;
    /** Sharpness proxy (Laplacian magnitude estimate, 0..1; higher = sharper) */
    sharpness: number;
  };
  /** Overall confidence (capture readiness) — only includes blocking issues */
  confidence: number;
  /** Per-guide readiness signals for the UI */
  faceOk: boolean;
  paperOk: boolean;
  warnings: string[];
}

/**
 * Extract calibration + sub-region data from a captured image.
 * @param imageEl  HTMLImageElement or HTMLVideoElement with the frame loaded
 * @param paperRegion normalized rect (0..1) — paper position
 * @param skinRegion  normalized rect (0..1) — face center
 */
export function extractCalibration(
  imageEl: HTMLImageElement | HTMLVideoElement,
  paperRegion: { x: number; y: number; w: number; h: number },
  skinRegion: { x: number; y: number; w: number; h: number }
): CalibrationResult {
  const canvas = document.createElement("canvas");
  const w = "videoWidth" in imageEl ? imageEl.videoWidth : imageEl.naturalWidth;
  const h = "videoHeight" in imageEl ? imageEl.videoHeight : imageEl.naturalHeight;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(imageEl, 0, 0, w, h);

  const paper = samplePaperRegion(ctx, paperRegion, w, h);
  const skin = sampleRegion(ctx, skinRegion, w, h);

  // Derive sub-regions from the face region. Coordinates relative to the
  // face rect, then mapped back to absolute normalized image coords.
  const fr = skinRegion;
  const sub = (rx: number, ry: number, rw: number, rh: number) => ({
    x: fr.x + rx * fr.w,
    y: fr.y + ry * fr.h,
    w: rw * fr.w,
    h: rh * fr.h,
  });

  // Sub-regions roughly aligned to a centered face inside the oval guide.
  const regions = {
    forehead: sampleRegion(ctx, sub(0.20, 0.05, 0.60, 0.15), w, h),
    templeL:  sampleRegion(ctx, sub(0.08, 0.18, 0.18, 0.14), w, h),
    templeR:  sampleRegion(ctx, sub(0.74, 0.18, 0.18, 0.14), w, h),
    jawline:  sampleRegion(ctx, sub(0.28, 0.68, 0.44, 0.12), w, h),
    nose:     sampleRegion(ctx, sub(0.42, 0.30, 0.16, 0.30), w, h),
    cheekL:   sampleRegion(ctx, sub(0.05, 0.40, 0.22, 0.22), w, h),
    cheekR:   sampleRegion(ctx, sub(0.73, 0.40, 0.22, 0.22), w, h),
    chin:     sampleRegion(ctx, sub(0.32, 0.78, 0.36, 0.15), w, h),
  };

  // Lighting metrics from paper
  const paperBrightness =
    (paper.mean[0] + paper.mean[1] + paper.mean[2]) / 3;
  const warmthBias = clamp01(
    (paper.mean[0] - paper.mean[2]) / Math.max(1, paperBrightness) * 4
  );

  // Sharpness — sample a small central strip and compute Laplacian
  const sharpness = estimateSharpness(ctx, skinRegion, w, h);

  const lighting = {
    brightness: clamp01(paperBrightness / 255),
    warmthBias,
    paperUniformity: paper.stdDev,
    sharpness,
  };

  // ── Per-guide blocking checks (these gate capture-readiness) ───
  const warnings: string[] = [];
  let paperOk = true;
  let faceOk = true;

  // Paper detection — coverage-based on paper-like pixels inside the rect.
  // The filter already requires bright + neutral + brighter-than-rect-avg,
  // so we just need a reasonable cluster.
  const coverage = paper.coverage ?? 0;
  if (coverage < 0.25) {
    warnings.push("paper_not_detected");
    paperOk = false;
  } else if (paper.stdDev > 20) {
    // The cluster itself is too varied — likely not a flat surface
    warnings.push("paper_region_busy");
    paperOk = false;
  }

  if (skin.mean[0] < skin.mean[2] - 20) {
    warnings.push("skin_region_unusual");
    faceOk = false;
  }
  // Skin region must be reasonably bright (i.e. there's something there)
  const skinBrightness = (skin.mean[0] + skin.mean[1] + skin.mean[2]) / 3;
  if (skinBrightness < 40) {
    warnings.push("face_not_in_frame");
    faceOk = false;
  }

  // Non-blocking quality notes — affect analysis-time confidence, not capture
  if (sharpness < 0.25) warnings.push("image_blurry");
  if (warmthBias > 0.55) warnings.push("warm_indoor_light");

  const confidence = (paperOk && faceOk) ? 1.0 : 0.3;

  return {
    paperRgb: paper.mean,
    skinRgb: skin.mean,
    skinStdDev: skin.stdDev,
    regions,
    lighting,
    confidence,
    faceOk,
    paperOk,
    warnings,
  };
}

// ────────────────────────────────────────────────────────────────────

/**
 * Adaptive paper sampling — robust to partial coverage of the rect.
 * Filters to pixels that look paper-like (bright, near-neutral color) and
 * computes mean/stdDev only on that subset. Falls back to plain region
 * sampling if no paper-like cluster is found.
 *
 * Returns an extra `coverage` field on the mean (carried via stdDev as
 * a low-stdDev signal). The caller decides if coverage is enough.
 */
function samplePaperRegion(
  ctx: CanvasRenderingContext2D,
  region: { x: number; y: number; w: number; h: number },
  imgW: number,
  imgH: number
): RegionSample & { coverage: number } {
  const x = Math.max(0, Math.floor(region.x * imgW));
  const y = Math.max(0, Math.floor(region.y * imgH));
  const w = Math.min(imgW - x, Math.floor(region.w * imgW));
  const h = Math.min(imgH - y, Math.floor(region.h * imgH));

  if (w <= 0 || h <= 0)
    return { mean: [0, 0, 0], stdDev: 0, coverage: 0 };

  const data = ctx.getImageData(x, y, w, h).data;
  const totalPx = data.length / 4;

  // First, compute the overall mean of the rect so we can require paper
  // to be a genuinely bright spot — not just any "kind of bright" pixels.
  let overallBright = 0;
  let overallCount = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const bright = (r + g + b) / 3;
    if (bright < 30 || bright > 252) continue;
    overallBright += bright;
    overallCount++;
  }
  const rectMean = overallCount > 0 ? overallBright / overallCount : 0;

  // Paper-like filter: bright + near-neutral.
  // The "must stand out from the rect avg" check only applies when the region
  // is dark (partial paper coverage). When the paper fills the entire rect,
  // rectMean is already high and the delta check would wrongly reject every
  // pixel. Tighter spread (<=30) reliably excludes skin — even fair skin has
  // R-B spread of 30-50 while white paper is near-neutral (<20 typically).
  const filter = (r: number, g: number, b: number) => {
    const bright = (r + g + b) / 3;
    if (bright < 170 || bright > 252) return false;
    if (rectMean < 160 && bright < rectMean + 20) return false;
    const spread = Math.max(r, g, b) - Math.min(r, g, b);
    return spread <= 30;
  };

  let rSum = 0, gSum = 0, bSum = 0;
  let kept = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (!filter(r, g, b)) continue;
    rSum += r; gSum += g; bSum += b;
    kept++;
  }

  if (kept / totalPx >= 0.25 && kept > 0) {
    const mean: [number, number, number] = [rSum / kept, gSum / kept, bSum / kept];
    let variance = 0;
    let n = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (!filter(r, g, b)) continue;
      const dr = r - mean[0], dg = g - mean[1], db = b - mean[2];
      variance += (dr * dr + dg * dg + db * db) / 3;
      n++;
    }
    const stdDev = n > 0 ? Math.sqrt(variance / n) : 0;
    return { mean, stdDev, coverage: kept / totalPx };
  }

  // Fallback — no paper-like cluster found
  const fallback = sampleRegion(ctx, region, imgW, imgH);
  return { ...fallback, coverage: 0 };
}

function sampleRegion(
  ctx: CanvasRenderingContext2D,
  region: { x: number; y: number; w: number; h: number },
  imgW: number,
  imgH: number
): RegionSample {
  const x = Math.max(0, Math.floor(region.x * imgW));
  const y = Math.max(0, Math.floor(region.y * imgH));
  const w = Math.min(imgW - x, Math.floor(region.w * imgW));
  const h = Math.min(imgH - y, Math.floor(region.h * imgH));

  if (w <= 0 || h <= 0) return { mean: [0, 0, 0], stdDev: 0 };

  const data = ctx.getImageData(x, y, w, h).data;
  let rSum = 0, gSum = 0, bSum = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const bright = (r + g + b) / 3;
    if (bright < 30 || bright > 250) continue;
    rSum += r; gSum += g; bSum += b;
    count++;
  }

  if (count === 0) return { mean: [0, 0, 0], stdDev: 0 };

  const mean: [number, number, number] = [rSum / count, gSum / count, bSum / count];

  let variance = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const bright = (r + g + b) / 3;
    if (bright < 30 || bright > 250) continue;
    const dr = r - mean[0], dg = g - mean[1], db = b - mean[2];
    variance += (dr * dr + dg * dg + db * db) / 3;
    n++;
  }
  const stdDev = Math.sqrt(variance / n);

  return { mean, stdDev };
}

/**
 * Rough sharpness estimate — compute variance of Laplacian-like differences
 * across a central horizontal strip. Higher = sharper. Cheap, runs in ~5ms.
 */
function estimateSharpness(
  ctx: CanvasRenderingContext2D,
  region: { x: number; y: number; w: number; h: number },
  imgW: number,
  imgH: number
): number {
  const x = Math.max(0, Math.floor(region.x * imgW));
  const y = Math.max(0, Math.floor((region.y + region.h * 0.4) * imgH));
  const w = Math.min(imgW - x, Math.floor(region.w * imgW));
  const h = Math.min(imgH - y, Math.max(8, Math.floor(region.h * 0.15 * imgH)));
  if (w <= 0 || h <= 0) return 0.5;

  const data = ctx.getImageData(x, y, w, h).data;
  let acc = 0;
  let n = 0;
  // Use grayscale + 1D Laplacian along x
  for (let row = 0; row < h; row++) {
    for (let col = 1; col < w - 1; col++) {
      const i = (row * w + col) * 4;
      const gPrev = grayAt(data, i - 4);
      const gNext = grayAt(data, i + 4);
      const gCur = grayAt(data, i);
      const lap = Math.abs(gPrev + gNext - 2 * gCur);
      acc += lap;
      n++;
    }
  }
  const mean = n > 0 ? acc / n : 0;
  // Empirical normalization — values typically land 1..15
  return clamp01(mean / 10);
}

function grayAt(data: Uint8ClampedArray, i: number): number {
  return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
