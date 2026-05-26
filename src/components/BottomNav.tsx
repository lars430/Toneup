"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  path: string;
  labels: Record<string, string>;
}

const NAV: NavItem[] = [
  {
    path: "/home",
    labels: { no: "Hjem", en: "Home", da: "Hjem", sv: "Hem", es: "Inicio", fr: "Accueil" },
  },
  {
    path: "/skin-log",
    labels: { no: "Logg", en: "Log", da: "Log", sv: "Logg", es: "Diario", fr: "Journal" },
  },
  {
    path: "/bag",
    labels: { no: "Pung", en: "Bag", da: "Taske", sv: "Väska", es: "Bolso", fr: "Sac" },
  },
  {
    path: "/ask",
    labels: { no: "Spør", en: "Ask", da: "Spørg", sv: "Fråga", es: "Preguntar", fr: "Demander" },
  },
  {
    path: "/me",
    labels: { no: "Meg", en: "Me", da: "Mig", sv: "Mig", es: "Yo", fr: "Moi" },
  },
];

interface Props {
  locale: string;
}

export default function BottomNav({ locale }: Props) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bone border-t border-stone/30 z-30">
      <div className="max-w-md mx-auto flex">
        {NAV.map((item) => {
          const href = `/${locale}${item.path}`;
          // Mark active if pathname starts with the href
          // Special case: /home should not match /home/... sub-routes unintentionally
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const label = item.labels[locale] ?? item.labels.en;
          return (
            <Link
              key={item.path}
              href={href}
              className={`flex-1 py-5 text-center text-[10px] uppercase tracking-[0.32em] transition-colors ${
                active ? "text-ink" : "text-soft-ink/60"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
