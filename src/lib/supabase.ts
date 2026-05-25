/**
 * Supabase clients — server and browser.
 */
import { createBrowserClient, createServerClient } from "@supabase/ssr";

export function createBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function createServer() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { cookies } = require("next/headers");
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: object) => cookieStore.set({ name, value, ...options }),
        remove: (name: string, options: object) => cookieStore.set({ name, value: "", ...options }),
      },
    }
  );
}
