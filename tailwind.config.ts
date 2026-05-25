import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bone: "#F6F2EC",
        cream: "#EFE8DE",
        stone: "#D9CFC1",
        taupe: "#B5A795",
        ink: "#1C1A17",
        "soft-ink": "#4A453E",
        mute: "#8A8278",
        accent: "#8B6F4E",
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "serif"],
        sans: ['"Inter Tight"', "system-ui", "sans-serif"],
      },
      letterSpacing: {
        editorial: "0.32em",
        wide2: "0.18em",
      },
    },
  },
  plugins: [],
};

export default config;
