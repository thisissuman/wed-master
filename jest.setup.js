jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("lucide-react-native", () => {
  const mockIcon = () => null;

  return {
    CalendarPlus: mockIcon,
    CalendarDays: mockIcon,
    Check: mockIcon,
    CheckCircle2: mockIcon,
    CheckSquare2: mockIcon,
    ChevronDown: mockIcon,
    Circle: mockIcon,
    ReceiptIndianRupee: mockIcon,
    Plus: mockIcon,
    SlidersHorizontal: mockIcon,
    X: mockIcon,
  };
});
