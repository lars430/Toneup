import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase";

/**
 * POST /api/share/palette
 *
 * Generates a shareable SVG palette card that the user can download
 * and post to Instagram. Returns a public share token so they can
 * also share a link.
 *
 * The card uses Toneup's editorial typography and palette colors.
 */

export async function POST(req: Request) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { paletteName, colors, undertone, depth } = await req.json();

  // Generate the SVG. 1080x1350 — Instagram portrait.
  const svg = generatePaletteSVG({
    paletteName: paletteName || "Aube nordique",
    colors: colors || [
      { hex: "#F6F2EC", label: "Bone" },
      { hex: "#E5C8B8", label: "Rose pâle" },
      { hex: "#B05670", label: "Berry whisper" },
    ],
    undertone: undertone || "nøytral",
    depth: depth || "fair",
  });

  // Save to storage with a public token
  const shareToken = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const path = `palette-cards/${user.id}/${shareToken}.svg`;
  await supabase.storage
    .from("shareable-cards")
    .upload(path, svg, { contentType: "image/svg+xml", upsert: true });

  await supabase.from("shareable_cards").insert({
    user_id: user.id,
    card_type: "palette",
    image_path: path,
    share_token: shareToken,
  });

  const { data: publicUrl } = supabase.storage
    .from("shareable-cards")
    .getPublicUrl(path);

  return NextResponse.json({
    svg,
    shareToken,
    publicUrl: publicUrl.publicUrl,
  });
}

function generatePaletteSVG(p: {
  paletteName: string;
  colors: Array<{ hex: string; label: string }>;
  undertone: string;
  depth: string;
}): string {
  // Editorial Instagram-shareable card: 1080x1350
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
  <defs>
    <style>
      .display { font-family: 'Cormorant Garamond', 'Times New Roman', serif; }
      .body { font-family: 'Inter Tight', -apple-system, sans-serif; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1350" fill="#F6F2EC"/>

  <!-- Border -->
  <rect x="40" y="40" width="1000" height="1270" fill="none" stroke="#D9CFC1" stroke-width="1"/>

  <!-- Top eyebrow -->
  <text x="540" y="160" text-anchor="middle" class="body"
    font-size="14" letter-spacing="6" fill="#8A8278">
    TONEUP · DIN PALETT
  </text>

  <!-- Palette name (the hero) -->
  <text x="540" y="290" text-anchor="middle" class="display"
    font-size="84" font-weight="400" fill="#1C1A17" letter-spacing="2">
    ${escapeXml(p.paletteName)}
  </text>

  <!-- Italic line -->
  <text x="540" y="350" text-anchor="middle" class="display"
    font-size="32" font-style="italic" fill="#4A453E">
    N° 01
  </text>

  <!-- Divider -->
  <line x1="480" y1="420" x2="600" y2="420" stroke="#8A8278" stroke-width="1"/>

  <!-- Palette circles -->
  ${p.colors.map((c, i) => {
    const cx = 270 + i * 270;
    return `
      <circle cx="${cx}" cy="630" r="100" fill="${c.hex}" />
      <circle cx="${cx}" cy="630" r="100" fill="none" stroke="#1C1A17" stroke-width="0.5" opacity="0.15"/>
      <text x="${cx}" y="780" text-anchor="middle" class="display"
        font-size="22" font-style="italic" fill="#4A453E">
        ${escapeXml(c.label)}
      </text>
    `;
  }).join("")}

  <!-- Meta -->
  <text x="540" y="950" text-anchor="middle" class="body"
    font-size="12" letter-spacing="4" fill="#8A8278">
    UNDERTONE · ${escapeXml(p.undertone.toUpperCase())}
  </text>
  <text x="540" y="985" text-anchor="middle" class="body"
    font-size="12" letter-spacing="4" fill="#8A8278">
    DYBDE · ${escapeXml(p.depth.toUpperCase())}
  </text>

  <!-- Divider -->
  <line x1="480" y1="1060" x2="600" y2="1060" stroke="#8A8278" stroke-width="1"/>

  <!-- Bottom signature -->
  <text x="540" y="1140" text-anchor="middle" class="display"
    font-size="40" font-style="italic" fill="#1C1A17">
    toneup
  </text>
  <text x="540" y="1185" text-anchor="middle" class="body"
    font-size="11" letter-spacing="5" fill="#8A8278">
    EN STILLE STUDIE AV HUDENS LYS
  </text>
  <text x="540" y="1235" text-anchor="middle" class="body"
    font-size="10" letter-spacing="3" fill="#B5A795">
    toneup.app
  </text>
</svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
