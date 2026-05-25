/**
 * Client-side image processing for white-balance calibration.
 *
 * Runs entirely in the browser using Canvas API — no upload, no API cost.
 * The user holds a piece of white paper near their face. We:
 *   1. Sample the brightest near-neutral region → that's the paper
 *   2. Sample the face center → that's the skin
 *   3. Send both RGB values + the original image to the server
 *      The server's InternalAdapter does the math.
 *
 * Privacy benefit: we can optionally skip uploading the full image entirely
 * and just send the extracted RGB pairs. The user's face never leaves
 * their device.
 */

export interface CalibrationResult {
  paperRgb: [number, number, number];
  skinRgb: [number, number, number];
  confidence: number;
  warnings: string[];
}

/**
 * Extract calibration data from a captured image.
 * @param imageEl - HTMLImageElement or HTMLVideoElement with the frame loaded
 * @param paperRegion - normalized rect (0..1) where paper should be (UI-guided)
 * @param skinRegion - normalized rect (0..1) where face center is (UI-guided)
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

  const paper = sampleRegion(ctx, paperRegion, w, h);
  const skin = sampleRegion(ctx, skinRegion, w, h);

  const warnings: string[] = [];
  let confidence = 1.0;

  // Sanity check: paper should be bright and near-neutral
  const paperBrightness = (paper.mean[0] + paper.mean[1] + paper.mean[2]) / 3;
  if (paperBrightness < 180) {
    warnings.push("lighting_too_dim");
    confidence *= 0.6;
  }
  const paperSpread =
    Math.max(...paper.mean) - Math.min(...paper.mean);
  if (paperSpread > 50) {
    warnings.push("paper_not_detected"); // too colorful to be paper
    confidence *= 0.4;
  }

  // Sanity check: skin region should look like skin (warm-ish, not too pale)
  if (skin.mean[0] < skin.mean[2] - 20) {
    warnings.push("skin_region_unusual"); // blue dominant — likely wrong region
    confidence *= 0.5;
  }

  // Sanity check: variance in paper region shouldn't be huge (uniform paper)
  if (paper.stdDev > 25) {
    warnings.push("paper_region_busy");
    confidence *= 0.7;
  }

  return {
    paperRgb: paper.mean,
    skinRgb: skin.mean,
    confidence,
    warnings,
  };
}

function sampleRegion(
  ctx: CanvasRenderingContext2D,
  region: { x: number; y: number; w: number; h: number },
  imgW: number,
  imgH: number
) {
  const x = Math.floor(region.x * imgW);
  const y = Math.floor(region.y * imgH);
  const w = Math.floor(region.w * imgW);
  const h = Math.floor(region.h * imgH);

  const data = ctx.getImageData(x, y, w, h).data;
  let rSum = 0, gSum = 0, bSum = 0;
  let count = 0;

  // First pass: mean (ignore very dark and very bright pixels — likely shadows/glare)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const bright = (r + g + b) / 3;
    if (bright < 30 || bright > 250) continue;
    rSum += r; gSum += g; bSum += b;
    count++;
  }

  if (count === 0) {
    return { mean: [0, 0, 0] as [number, number, number], stdDev: 0 };
  }

  const mean: [number, number, number] = [rSum / count, gSum / count, bSum / count];

  // Second pass: std-dev (signals uniformity of the region)
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
