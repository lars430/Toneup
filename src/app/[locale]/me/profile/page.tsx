import { redirect } from "next/navigation";
import { createServer } from "@/lib/supabase";
import ProfileForm from "./_components/ProfileForm";
import BottomNav from "@/components/BottomNav";

export default async function ProfileEditPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <main className="min-h-dvh bg-bone pb-28">
      <ProfileForm locale={locale} profile={profile} />
      <BottomNav locale={locale} />
    </main>
  );
}
