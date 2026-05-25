"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowser } from "@/lib/supabase";

export default function SignInPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createBrowser();
    const callbackUrl = new URL(`${window.location.origin}/${locale}/auth/callback`);
    if (next) callbackUrl.searchParams.set("next", next);
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl.toString(),
        shouldCreateUser: true,
      },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  }

  return (
    <main className="min-h-screen bg-bone flex items-center justify-center p-7">
      <div className="max-w-sm w-full">
        <div className="text-center mb-10">
          <div className="font-display text-4xl tracking-wide2 mb-2">Toneup</div>
          <div className="font-display italic text-soft-ink text-lg">
            {sent ? "Sjekk innboksen din" : "Velkommen tilbake"}
          </div>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="divider-line mx-auto mb-7" />
            <p className="font-display text-base leading-relaxed mb-3">
              Vi sendte en lenke til
            </p>
            <p className="font-display italic text-lg mb-7">{email}</p>
            <p className="text-xs text-soft-ink leading-relaxed">
              Klikk på lenken i e-posten for å logge inn.
              Lenken er gyldig i 60 minutter.
            </p>
          </div>
        ) : (
          <form onSubmit={send} className="space-y-5">
            <div>
              <label className="editorial-eyebrow block mb-3">E-postadresse</label>
              <input type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@epost.no"
                className="w-full bg-cream border-none px-4 py-4 font-display text-base focus:outline-none focus:ring-1 focus:ring-ink" />
            </div>

            {error && <p className="text-xs text-red-700">{error}</p>}

            <button type="submit" disabled={loading || !email}
              className="btn-primary disabled:opacity-40">
              {loading ? "Sender…" : "Send lenke til e-post"}
            </button>

            <p className="text-[10px] tracking-wider text-mute text-center leading-relaxed pt-4">
              Vi bruker passordløs innlogging.<br />
              Ingen passord å huske, ingen å miste.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
