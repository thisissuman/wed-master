const mockSentryInit = jest.fn();

jest.mock("@sentry/react-native", () => ({ init: mockSentryInit }));

const originalDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

describe("Sentry initialization", () => {
  beforeEach(() => {
    jest.resetModules();
    mockSentryInit.mockClear();
  });

  afterAll(() => {
    if (originalDsn === undefined) delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    else process.env.EXPO_PUBLIC_SENTRY_DSN = originalDsn;
  });

  it("stays disabled when no public DSN is configured", () => {
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;

    jest.isolateModules(() => {
      jest.requireActual("./sentry");
    });

    expect(mockSentryInit).not.toHaveBeenCalled();
  });

  it("configures error-only reporting with tracing and breadcrumbs disabled", () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = "https://public@example.invalid/1";

    jest.isolateModules(() => {
      jest.requireActual("./sentry");
    });

    expect(mockSentryInit).toHaveBeenCalledTimes(1);
    const options = mockSentryInit.mock.calls[0]?.[0];
    expect(options).toEqual(
      expect.objectContaining({
        dsn: "https://public@example.invalid/1",
        enableAutoSessionTracking: false,
        environment: "development",
        maxBreadcrumbs: 0,
        sendDefaultPii: false,
        tracesSampleRate: 0,
        beforeBreadcrumb: expect.any(Function),
        beforeSend: expect.any(Function),
        beforeSendTransaction: expect.any(Function),
      }),
    );
    expect(options.beforeBreadcrumb()).toBeNull();
    expect(options.beforeSendTransaction()).toBeNull();
  });
});
