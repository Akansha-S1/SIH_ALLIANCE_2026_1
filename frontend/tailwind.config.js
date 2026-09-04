/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#0b1220",
        panel2: "#0f1a2c",
        panelborder: "#1c2b42",
        ink: "#c9d6e8",
        muted: "#7286a3",
        accent: "#22d3ee",
        safe: "#22c55e",
        warn: "#eab308",
        high: "#f97316",
        critical: "#ef4444",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(34,211,238,0.15), 0 0 20px rgba(34,211,238,0.08)",
      },
    },
  },
  plugins: [],
};
