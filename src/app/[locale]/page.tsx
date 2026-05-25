import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LanguageSelector } from "@/components/LanguageSelector";
import { createServer } from "@/lib/supabase";

export default async function WelcomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .single();
    redirect(profile ? `/${locale}/home` : `/${locale}/onboarding`);
  }

  const t = await getTranslations();

  return (
    <main className="min-h-screen flex flex-col p-8 relative overflow-hidden">
      {/* Decorative geometric forms */}
      <div
        className="absolute top-20 right-0 w-56 h-80 opacity-85"
        style={{
          background: "linear-gradient(160deg, #D9CFC1 0%, #B5A795 100%)",
          borderBottomLeftRadius: "200px",
        }}
      />
      <div
        className="absolute top-56 left-7 w-20 h-20 rounded-full opacity-90"
        style={{ background: "#8B6F4E" }}
      />

      {/* Language selector — top right */}
      <div className="relative z-10 flex justify-end">
        <LanguageSelector currentLocale={locale} />
      </div>

      {/* Top — brand */}
      <div className="relative z-10 mt-16">
        <div className="editorial-eyebrow mb-8">Est. Toneup</div>
        <h1 className="font-display text-[84px] leading-none tracking-wide2">
          {t("brand.name")}
        </h1>
        <p className="font-display italic text-xl text-soft-ink mt-4 leading-snug max-w-xs">
          {t("onboarding.welcome_sub")}
        </p>
      </div>

      {/* Bottom — CTA */}
      <div className="relative z-10 mt-auto">
        <div className="divider-line mb-6" />
        <Link
          href={{ pathname: `/${locale}/sign-in`, query: { next: "onboarding" } }}
          className="block w-full bg-ink text-bone py-5 text-center text-[11px] uppercase tracking-[0.32em] mb-3"
        >
          {t("onboarding.start")}
        </Link>
        <Link
          href={`/${locale}/sign-in`}
          className="block w-full text-soft-ink py-2 text-center text-[11px] uppercase tracking-[0.24em]"
        >
          {t("onboarding.have_account")}
        </Link>
      </div>
    </main>
  );
}
