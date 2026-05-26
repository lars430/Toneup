import { redirect } from "next/navigation";
import { createServer } from "@/lib/supabase";
import { getUserSubscription, isProTier } from "@/lib/subscriptions";
import AdvisorUI from "./_components/AdvisorUI";
import BottomNav from "@/components/BottomNav";

/**
 * Server component — fetches user context so the AI advisor feels personal.
 * Passes a pre-built context summary and personalized questions to the
 * client-side AdvisorUI component.
 */
export default async function AskPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const supabase = createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const sub = await getUserSubscription(supabase, user.id);
  const isPro = isProTier(sub);

  // Last skin log
  const { data: lastLog } = await supabase
    .from("skin_logs")
    .select("feel_label, dryness, redness, glow, sensitivity, tags, logged_at")
    .eq("user_id", user.id)
    .order("logged_at", { ascending: false })
    .limit(1)
    .single();

  // Loved products (up to 5)
  const { data: lovedItems } = await supabase
    .from("makeup_bag_items")
    .select("shade_name, shade_code, products(name, brand, category)")
    .eq("user_id", user.id)
    .eq("loved", true)
    .limit(5);

  // Last analysis
  const { data: lastAnalysis } = await supabase
    .from("skin_analyses")
    .select("raw_result, summary, taken_at")
    .eq("user_id", user.id)
    .order("taken_at", { ascending: false })
    .limit(1)
    .single();

  // Build context summary shown to the user
  const contextParts: string[] = [];
  if (profile?.skin_type) contextParts.push(skinTypeLabel(profile.skin_type));
  if (profile?.skin_goals?.length)
    contextParts.push(profile.skin_goals.slice(0, 3).map(goalLabel).join(", "));
  if (profile?.preferences?.budget)
    contextParts.push(budgetLabel(profile.preferences.budget));
  if (lastLog)
    contextParts.push(`Sist logget: ${feelLabel(lastLog.feel_label)}`);
  if (lastAnalysis?.raw_result?.undertone)
    contextParts.push(undertoneLabel(lastAnalysis.raw_result.undertone));
  if (lovedItems?.length)
    contextParts.push(`${lovedItems.length} elskede produkter`);

  const contextSummary = contextParts.length ? contextParts.join(" · ") : null;

  // Personalized suggested questions based on profile + season
  const personalQuestions = buildPersonalQuestions(
    profile,
    lastLog,
    lastAnalysis,
    lovedItems ?? [],
    computeSeason()
  );

  return (
    <main className="min-h-dvh bg-bone pb-28">
      <AdvisorUI
        locale={locale}
        isPro={isPro}
        contextSummary={contextSummary}
        personalQuestions={personalQuestions}
      />
      <BottomNav locale={locale} />
    </main>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function computeSeason(): "spring" | "summer" | "autumn" | "winter" {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

function buildPersonalQuestions(
  profile: any,
  lastLog: any,
  lastAnalysis: any,
  lovedItems: any[],
  season: string
): string[] {
  const questions: string[] = [];

  // Foundation shade matching
  if (lastAnalysis?.raw_result?.undertone) {
    questions.push(
      `Hvilken foundationtone passer best for meg nå basert på undertonen min?`
    );
  }

  // Skin-type specific
  if (profile?.skin_type === "dry") {
    questions.push("Hvilke fuktighetsprodukter passer best for tørr hud om " + seasonLabel(season) + "?");
  } else if (profile?.skin_type === "oily") {
    questions.push("Hvordan kontrollerer jeg glans uten å tørke ut huden?");
  } else if (profile?.skin_type === "sensitive") {
    questions.push("Hvilke ingredienser bør jeg unngå for sensitiv hud?");
  }

  // Season-specific
  const seasonQ: Record<string, string> = {
    spring: "Hva bør jeg endre i rutinen nå som sesongen skifter til vår?",
    summer: "Hvilke lette baseprodukter fungerer best i sommer?",
    autumn: "Hvordan gjenoppbygger jeg hudbarrieren etter sommeren?",
    winter: "Hvilke produkter beskytter mot tørrhet og kulde om vinteren?",
  };
  questions.push(seasonQ[season]);

  // Recent log-based
  if (lastLog?.redness >= 4) {
    questions.push("Hva kan jeg gjøre for å dempe rødhet i huden?");
  } else if (lastLog?.dryness <= 2) {
    questions.push("Huden føles veldig tørr — hva er de beste ingrediensene for dyp fukt?");
  }

  // Loved product alternatives
  const foundationLoved = lovedItems.find(
    (i: any) => i.products?.category === "foundation"
  );
  if (foundationLoved) {
    questions.push(
      `Finnes det et rimeligere alternativ til ${foundationLoved.products?.name}?`
    );
  }

  // Life phase
  if (profile?.life_phase === "pregnancy") {
    questions.push("Hvilke hudpleieingredienser er trygge under graviditet?");
  } else if (profile?.life_phase === "menstrual_cycle") {
    questions.push("Hvordan tilpasser jeg rutinen til ulike faser i syklusen?");
  }

  // Fallback generic
  if (questions.length < 4) {
    questions.push("Hva er forskjellen på AHA og BHA, og hva passer best for meg?");
    questions.push("Kan jeg bruke vitamin C og retinol i samme rutine?");
  }

  return questions.slice(0, 5);
}

function skinTypeLabel(key: string): string {
  const m: Record<string, string> = {
    dry: "Tørr hud", oily: "Fet hud", combination: "Kombinert hud",
    normal: "Normal hud", sensitive: "Sensitiv hud",
  };
  return m[key] ?? key;
}

function goalLabel(key: string): string {
  const m: Record<string, string> = {
    less_dryness: "Mindre tørrhet", glow: "Glød", less_acne: "Mindre akne",
    even_tone: "Jevnere hudtone", less_sensitivity: "Mindre sensitivitet",
    anti_aging: "Anti-aging", pore_minimizing: "Porer",
  };
  return m[key] ?? key;
}

function budgetLabel(key: string): string {
  const m: Record<string, string> = {
    budget: "Rimelig budsjett", mid: "Mellompris", premium: "Premium", luxury: "Luksus",
  };
  return m[key] ?? key;
}

function feelLabel(key: string): string {
  const m: Record<string, string> = {
    radiant: "Strålende", balanced: "Balansert", tired: "Trett",
    tight: "Stram", reactive: "Reaktiv", oily: "Glinsende",
  };
  return m[key] ?? key;
}

function undertoneLabel(key: string): string {
  const m: Record<string, string> = {
    warm: "Varm undertone", cool: "Kald undertone", neutral: "Nøytral undertone",
  };
  return m[key] ?? key;
}

function seasonLabel(s: string): string {
  return { spring: "våren", summer: "sommeren", autumn: "høsten", winter: "vinteren" }[s] ?? s;
}
