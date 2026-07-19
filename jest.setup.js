jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

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
