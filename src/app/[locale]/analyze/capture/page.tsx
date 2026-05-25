"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { extractCalibration, type CalibrationResult } from "@/lib/calibration";

// Normalized regions where we expect the face and paper to appear in the frame.
// These align with the on-screen overlay below.
const FACE_REGION = { x: 0.35, y: 0.30, w: 0.30, h: 0.20 }; // centre, cheek area
const PAPER_REGION = { x: 0.05, y: 0.40, w: 0.18, h: 0.18 }; // bottom-left card

export default function CapturePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations();
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [feedback, setFeedback] = useState<string>("calibrate.feedback.searching");
  const [confidence, setConfidence] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play();
        }
      } catch (e) {
        setFeedback("calibrate.feedback.no_camera");
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live feedback loop — sample every 600ms and update guidance.
  useEffect(() => {
    if (!stream || !videoRef.current) return;
    const interval = setInterval(() => {
      if (!videoRef.current) return;
      try {
        const result = extractCalibration(videoRef.current, PAPER_REGION, FACE_REGION);
        setConfidence(result.confidence);
        setFeedback(feedbackKeyFor(result));
      } catch {}
    }, 600);
    return () => clearInterval(interval);
  }, [stream]);

  async function capture() {
    if (!videoRef.current || busy) return;
    setBusy(true);

    // Take the best of 3 frames (skip if confidence below threshold)
    let best: CalibrationResult | null = null;
    for (let i = 0; i < 3; i++) {
      const r = extractCalibration(videoRef.current, PAPER_REGION, FACE_REGION);
      if (!best || r.confidence > best.confidence) best = r;
      await new Promise((r) => setTimeout(r, 200));
    }

    // Send to analysis API
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
    <main className="min-h-screen flex flex-col bg-ink text-bone relative">
      {/* Camera view */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Editorial overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Face oval guide */}
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <mask id="cutout">
                <rect width="100" height="100" fill="white" />
                <ellipse cx="50" cy="40" rx="22" ry="30" fill="black" />
              </mask>
            </defs>
            {/* Soft dark vignette around face */}
            <rect width="100" height="100" fill="rgba(28,26,23,0.5)" mask="url(#cutout)" />
            {/* Face oval line */}
            <ellipse
              cx="50" cy="40" rx="22" ry="30"
              fill="none"
              stroke={ready ? "#F6F2EC" : "#B5A795"}
              strokeWidth="0.2"
              strokeDasharray={ready ? "" : "0.8 0.8"}
            />
            {/* Paper region indicator (bottom-left) */}
            <rect
              x="5" y="40" width="18" height="18"
              fill="none"
              stroke={ready ? "#F6F2EC" : "#B5A795"}
              strokeWidth="0.2"
              strokeDasharray="0.6 0.6"
            />
          </svg>

          {/* Labels */}
          <div className="absolute top-1/3 left-[7%] text-[9px] uppercase tracking-[0.32em] text-bone/70">
            ↑ Hvitt ark
          </div>
        </div>

        {/* Top — close + ritual eyebrow */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-6 z-10">
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

        {/* Live feedback strip */}
        <div className="absolute bottom-32 left-0 right-0 text-center px-8">
          <div className="font-display italic text-lg text-bone mb-2">
            {t(feedback)}
          </div>
          <div className="h-px bg-bone/20 mx-auto max-w-[200px] relative">
            <div
              className="absolute top-0 left-0 h-px bg-bone transition-all duration-500"
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Capture button */}
      <div className="p-8 bg-ink flex justify-center">
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
