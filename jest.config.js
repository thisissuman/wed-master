module.exports = {
  preset: "jest-expo",
  resolver: "react-native-worklets/jest/resolver",
  setupFiles: ["<rootDir>/jest.setup.js"],
  testMatch: ["<rootDir>/src/**/*.test.ts", "<rootDir>/src/**/*.test.tsx"],
};
