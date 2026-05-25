import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function CalibrateIntroPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  return (
    <main className="min-h-screen flex flex-col p-8 bg-bone">
      {/* Top eyebrow */}
      <header className="flex justify-between items-start mb-12">
        <Link
          href={`/${locale}/home`}
          className="text-[11px] uppercase tracking-[0.24em] text-soft-ink"
        >
          {t("common.back")}
        </Link>
        <span className="text-[10px] uppercase tracking-[0.32em] text-mute">
          {t("calibrate.eyebrow")}
        </span>
        <span className="w-6" />
      </header>

      {/* Editorial illustration */}
      <div className="flex justify-center mb-12">
        <svg viewBox="0 0 220 220" className="w-44 h-44" aria-hidden>
          {/* Soft circle backdrop */}
          <circle cx="110" cy="110" r="100" fill="#EFE8DE" />
          {/* Face silhouette */}
          <ellipse cx="110" cy="100" rx="42" ry="56" fill="none" stroke="#1C1A17" strokeWidth="0.8" />
          {/* Paper rectangle, held to the side */}
          <rect x="160" y="90" width="38" height="50" fill="#FFFFFF" stroke="#1C1A17" strokeWidth="0.8" />
          {/* Connection line — paper to face */}
          <line x1="155" y1="115" x2="148" y2="115" stroke="#8B6F4E" strokeWidth="0.6" strokeDasharray="2 3" />
          {/* Light rays */}
          <g stroke="#1C1A17" strokeWidth="0.4" opacity="0.5">
            <line x1="40" y1="40" x2="60" y2="60" />
            <line x1="50" y1="30" x2="60" y2="50" />
            <line x1="30" y1="50" x2="50" y2="60" />
          </g>
        </svg>
      </div>

      {/* Title */}
      <div className="mb-10">
        <div className="editorial-eyebrow mb-4">{t("calibrate.ritual")}</div>
        <h1 className="font-display text-4xl leading-tight tracking-wide2 mb-3">
          {t("calibrate.title")}
        </h1>
        <p className="font-display italic text-soft-ink text-lg leading-snug">
          {t("calibrate.subtitle")}
        </p>
      </div>

      {/* Numbered steps */}
      <div className="space-y-6 mb-12">
        <Step n="I" title={t("calibrate.step1_title")} body={t("calibrate.step1_body")} />
        <Step n="II" title={t("calibrate.step2_title")} body={t("calibrate.step2_body")} />
        <Step n="III" title={t("calibrate.step3_title")} body={t("calibrate.step3_body")} />
      </div>

      {/* CTA */}
      <div className="mt-auto">
        <div className="divider-line mb-6" />
        <Link
          href={`/${locale}/analyze/capture`}
          className="block w-full bg-ink text-bone py-5 text-center text-[11px] uppercase tracking-[0.32em] mb-3"
        >
          {t("calibrate.continue")}
        </Link>
        <p className="text-[10px] tracking-wider text-mute text-center leading-relaxed mt-4 max-w-xs mx-auto">
          {t("calibrate.privacy_note")}
        </p>
      </div>
    </main>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="grid grid-cols-[40px_1fr] gap-4 items-start">
      <span className="font-display italic text-xl text-mute pt-0.5">{n}</span>
      <div>
        <h3 className="font-display text-base text-ink mb-1">{title}</h3>
        <p className="text-sm text-soft-ink leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
