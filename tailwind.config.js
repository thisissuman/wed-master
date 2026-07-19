const tokens = require("./src/theme/tokens.json");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      borderRadius: tokens.radius,
      boxShadow: tokens.elevation,
      colors: tokens.colors,
      fontFamily: tokens.fontFamily,
      fontSize: tokens.typography,
      spacing: tokens.spacing,
      transitionDuration: tokens.motion,
    },
  },
  plugins: [],
};
