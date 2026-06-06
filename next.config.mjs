import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/config.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  images: {
    remotePatterns: [
      // Supabase Storage (product images hosted by Toneup)
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      // Common beauty brand CDNs + retailers
      { protocol: "https", hostname: "www.maccosmetics.com" },
      { protocol: "https", hostname: "cdn.maccosmetics.com" },
      { protocol: "https", hostname: "www.narscosmetics.com" },
      { protocol: "https", hostname: "fentybeauty.com" },
      { protocol: "https", hostname: "cdn-us.sephora.com" },
      { protocol: "https", hostname: "www.charlottetilbury.com" },
      { protocol: "https", hostname: "media.kicks.se" },
      { protocol: "https", hostname: "media.kicks.no" },
      { protocol: "https", hostname: "lyko.com" },
      { protocol: "https", hostname: "www.lookfantastic.com" },
      { protocol: "https", hostname: "media.lookfantastic.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
