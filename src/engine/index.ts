/**
 * Engine entry point — singleton-factory.
 *
 * Tilgjengelige motorer:
 *   - 'internal'  → Toneups egen analyse, hvitbalanse-kalibrering, 0 kr per analyse
 *   - 'mock'      → Deterministisk dummy-data, til utvikling
 *   - 'revieve'   → Revieve SDK (premium, koster per kall)
 *
 * Velg via env: ANALYSIS_PROVIDER=internal | mock | revieve
 */

import type { AnalysisProvider } from "./types";
import { MockAdapter } from "./adapters/mock";
import { InternalAdapter } from "./adapters/internal";
import { RevieveAdapter } from "./adapters/revieve";

let instance: AnalysisProvider | null = null;

export function getAnalysisProvider(): AnalysisProvider {
  if (instance) return instance;

  const choice = process.env.ANALYSIS_PROVIDER ?? "internal";

  switch (choice) {
    case "internal":
      instance = new InternalAdapter();
      break;

    case "revieve": {
      const apiKey = process.env.REVIEVE_API_KEY;
      const partnerId = process.env.REVIEVE_PARTNER_ID;
      if (!apiKey || !partnerId) {
        console.warn("Revieve not configured; falling back to internal");
        instance = new InternalAdapter();
      } else {
        instance = new RevieveAdapter({ apiKey, partnerId });
      }
      break;
    }

    case "mock":
      instance = new MockAdapter();
      break;

    default:
      instance = new InternalAdapter();
  }

  return instance;
}

export type {
  AnalysisProvider,
  SkinAnalysisResult,
  ShadeMatch,
  ProductSuggestion,
} from "./types";
