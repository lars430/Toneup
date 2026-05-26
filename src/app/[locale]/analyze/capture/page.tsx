"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { extractCalibration, type CalibrationResult } from "@/lib/calibration";

// Guide positions in screen-space (0-1), matching the SVG overlay positions.
// The camera container has scaleX(-1) (mirror), so screen-left = video-right.
const FACE_SCREEN  = { x: 0.35, y: 0.22, w: 0.30, h: 0.36 }; // centre of oval guide
const PAPER_SCREEN = { x: 0.05, y: 0.40, w: 0.18, h: 0.18 }; // dashed rect (appears screen-left due to mirror)

/**
 * Map a screen-space region → actual video-frame coordinates.
 *
 * Two corrections are applied:
 *  1. scaleX(-1) mirror on the container: screen x → video x = 1 - x - w
 *  2. object-cover crop: when video aspect ≠ container aspect the browser
 *     shows only the centre slice; we compensate so we sample from the
 *     correct pixels even if the camera returns a landscape stream.
 */
function mapToVideoRegion(
  screen: { x: number; y: number; w: number; h: number },
  containerW: number,
  containerH: number,
  videoW: number,
  videoH: number,
): { x: number; y: number; w: number; h: number } {
  // Mirror correction
  const mx = 1 - screen.x - screen.w;

  // object-cover: figure out which axis is clipped
  const cA = containerW / containerH;
  const vA = videoW / videoH;
  let xOff = 0, xVis = 1, yOff = 0, yVis = 1;
  if (vA > cA) {
    // landscape video in portrait container → sides cropped
    xVis = cA / vA;
    xOff = (1 - xVis) / 2;
  } else {
    // portrait video in landscape container → top/bottom cropped
    yVis = vA / cA;
    yOff = (1 - yVis) / 2;
  }

  return {
    x: xOff + mx * xVis,
    y: yOff + screen.y * yVis,
    w: screen.w * xVis,
    h: screen.h * yVis,
  };
}

export default function CapturePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations();
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [feedback, setFeedback] = useState<string>("calibrate.feedback.searching");
  const [confidence, setConfidence] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play();
        }
      } catch {
        setFeedback("calibrate.feedback.no_camera");
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!stream || !videoRef.current) return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      const container = cameraRef.current;
      if (!video || !container || !video.videoWidth) return;
      try {
        const { clientWidth: cW, clientHeight: cH } = container;
        const { videoWidth: vW, videoHeight: vH } = video;
        const paperRegion = mapToVideoRegion(PAPER_SCREEN, cW, cH, vW, vH);
        const faceRegion  = mapToVideoRegion(FACE_SCREEN,  cW, cH, vW, vH);
        const result = extractCalibration(video, paperRegion, faceRegion);
        setConfidence(result.confidence);
        setFeedback(feedbackKeyFor(result));
      } catch {}
    }, 600);
    return () => clearInterval(interval);
  }, [stream]);

  async function capture() {
    const video = videoRef.current;
    const container = cameraRef.current;
    if (!video || !container || busy) return;
    setBusy(true);

    const { clientWidth: cW, clientHeight: cH } = container;
    const { videoWidth: vW, videoHeight: vH } = video;
    const paperRegion = mapToVideoRegion(PAPER_SCREEN, cW, cH, vW, vH);
    const faceRegion  = mapToVideoRegion(FACE_SCREEN,  cW, cH, vW, vH);

    let best: CalibrationResult | null = null;
    for (let i = 0; i < 3; i++) {
      const r = extractCalibration(video, paperRegion, faceRegion);
      if (!best || r.confidence > best.confidence) best = r;
      await new Promise((r) => setTimeout(r, 200));
    }

    const res = await fetch("/api/skin/analyze-internal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(best),
    });

    if (!res.ok) {
      setBusy(false);
      setFeedback("calibrate.feedback.failed");
      return;
    }

    const { analysisId } = await res.json();
    router.push(`/${locale}/analyze/result/${analysisId}`);
  }

  const ready = confidence > 0.6;

  return (
    <main className="min-h-dvh flex flex-col bg-ink text-bone relative">
      {/* Top bar — outside the mirrored area so text is readable */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-6 z-20">
        <button
          onClick={() => router.back()}
          className="text-[11px] uppercase tracking-[0.24em] text-bone/80"
        >
          {t("common.cancel")}
        </button>
        <span className="text-[9px] uppercase tracking-[0.4em] text-bone/60">
          {t("calibrate.eyebrow")}
        </span>
        <span className="w-12" />
      </div>

      {/* Camera view — mirrored for intuitive selfie framing */}
      <div
        ref={cameraRef}
        className="flex-1 relative overflow-hidden"
        style={{ transform: "scaleX(-1)" }}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Overlay — inside mirror so guides align with what user sees */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <mask id="cutout">
                <rect width="100" height="100" fill="white" />
                <ellipse cx="50" cy="40" rx="22" ry="30" fill="black" />
              </mask>
            </defs>
            <rect width="100" height="100" fill="rgba(28,26,23,0.45)" mask="url(#cutout)" />
            {/* Face oval */}
            <ellipse
              cx="50" cy="40" rx="22" ry="30"
              fill="none"
              stroke={ready ? "#F6F2EC" : "#B5A795"}
              strokeWidth="0.3"
              strokeDasharray={ready ? "" : "0.8 0.8"}
            />
            {/* Paper guide — at SVG x=77 which appears at screen-left due to mirror */}
            <rect
              x="77" y="40" width="18" height="18"
              fill="none"
              stroke={ready ? "#F6F2EC" : "#B5A795"}
              strokeWidth="0.3"
              strokeDasharray="0.6 0.6"
            />
          </svg>
        </div>
      </div>

      {/* Feedback strip */}
      <div className="absolute bottom-32 left-0 right-0 text-center px-8 z-10">
        <div className="inline-block bg-ink/60 backdrop-blur-sm px-4 py-2 rounded-sm">
          <div className="font-display italic text-sm text-bone/90 mb-1">
            {t(feedback)}
          </div>
          <div className="h-px bg-bone/20 mx-auto max-w-[160px] relative">
            <div
              className="absolute top-0 left-0 h-px bg-bone transition-all duration-500"
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
        <div className="text-[10px] uppercase tracking-[0.24em] text-bone/50 mt-3">
          Hold hvitt ark til venstre i bildet
        </div>
      </div>

      {/* Capture button */}
      <div className="p-8 bg-ink flex justify-center z-10">
        <button
          onClick={capture}
          disabled={!ready || busy}
          className={`w-20 h-20 rounded-full border-2 transition-all ${
            ready && !busy
              ? "border-bone bg-bone/10 hover:bg-bone/20"
              : "border-bone/30"
          }`}
          aria-label={t("calibrate.capture")}
        >
          <div
            className={`w-14 h-14 rounded-full mx-auto transition-colors ${
              ready && !busy ? "bg-bone" : "bg-bone/30"
            }`}
          />
        </button>
      </div>
    </main>
  );
}

function feedbackKeyFor(r: CalibrationResult): string {
  if (r.warnings.includes("paper_not_detected")) return "calibrate.feedback.no_paper";
  if (r.warnings.includes("lighting_too_dim")) return "calibrate.feedback.too_dim";
  if (r.warnings.includes("skin_region_unusual")) return "calibrate.feedback.position_face";
  if (r.warnings.includes("paper_region_busy")) return "calibrate.feedback.steady_paper";
  if (r.confidence > 0.75) return "calibrate.feedback.ready";
  if (r.confidence > 0.5) return "calibrate.feedback.almost";
  return "calibrate.feedback.searching";
}
