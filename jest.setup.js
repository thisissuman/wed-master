jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("react-native-safe-area-context", () => {
  const safeAreaMock = require("react-native-safe-area-context/jest/mock");
  return safeAreaMock.default ?? safeAreaMock;
});

jest.mock("lucide-react-native", () => {
  const mockIcon = () => null;
  return new Proxy(
    { __esModule: true },
    {
      get: (target, property) => target[property] ?? mockIcon,
    },
  );
});

jest.mock("@shopify/flash-list", () => ({
  FlashList: require("react-native").FlatList,
}));

jest.mock("react-native-keyboard-controller", () =>
  require("react-native-keyboard-controller/jest"),
);
