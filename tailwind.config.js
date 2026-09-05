const tokens = require("./src/theme/tokens.json");
const palettes = require("./src/theme/palettes.json");

const fixedAlphaColorRoles = new Set([
  "nightSoft",
  "overlay",
  "translucentBorder",
  "translucentSurface",
  "wordmarkShadow",
]);

const toKebabCase = (value) => value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

const colors = Object.fromEntries(
  Object.keys(palettes.lavenderPearl.colors).map((role) => {
    const variable = `var(--color-${toKebabCase(role)})`;
    return [
      role,
      fixedAlphaColorRoles.has(role) ? `rgb(${variable})` : `rgb(${variable} / <alpha-value>)`,
    ];
  }),
);

const boxShadow = Object.fromEntries(
  Object.entries(tokens.elevationGeometry).map(([role, geometry]) => [
    role,
    `${geometry} rgb(var(--shadow-${toKebabCase(role)}))`,
  ]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      borderRadius: tokens.radius,
      boxShadow,
      colors,
      fontFamily: tokens.fontFamily,
      fontSize: tokens.typography,
      spacing: tokens.spacing,
      transitionDuration: tokens.motion,
    },
  },
  plugins: [],
};
