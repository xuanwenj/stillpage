const originalJwtSecret = process.env.JWT_SECRET;

const loadAuthService = async () => {
  jest.resetModules();
  process.env.JWT_SECRET = "test-secret";
  return import("./auth.service");
};

describe("auth.service", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
      return;
    }

    process.env.JWT_SECRET = originalJwtSecret;
  });

  it("generates a token that can be verified", async () => {
    const { generateToken, verifyToken } = await loadAuthService();

    const { token, expiresIn } = generateToken("user-123", "user@example.com");
    const payload = verifyToken(token);

    expect(expiresIn).toBe(3600);
    expect(payload).toEqual(
      expect.objectContaining({
        userId: "user-123",
        email: "user@example.com",
      }),
    );
    expect(payload?.exp).toEqual(expect.any(Number));
  });

  it("returns null for an invalid token", async () => {
    const { verifyToken } = await loadAuthService();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    expect(verifyToken("invalid-token")).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
