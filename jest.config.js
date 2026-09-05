module.exports = {
  preset: "jest-expo",
  resolver: "react-native-worklets/jest/resolver",
  moduleNameMapper: {
    "^lucide-react-native/icons/.+$": "<rootDir>/test/mocks/lucide-icon.js",
  },
  setupFiles: ["<rootDir>/jest.setup.js"],
  testMatch: ["<rootDir>/src/**/*.test.ts", "<rootDir>/src/**/*.test.tsx"],
};
