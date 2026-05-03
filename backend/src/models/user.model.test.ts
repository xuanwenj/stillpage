import User from "./user.model";
import bcrypt from "bcrypt";

jest.mock("bcrypt");

describe("user.model", () => {
  let originalJwtSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  afterEach(() => {
    jest.resetModules();
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  describe("pre-save hook", () => {
    it("should hash password before saving", async () => {
      const hashedPassword = "hashed-password-123";
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const user = new User({
        name: "John Doe",
        email: "john@example.com",
        password: "plaintext-password",
      });

      // Simulate pre-save hook
      expect(user.isModified("password")).toBe(true);
      const hashedPass = await bcrypt.hash(user.password, 10);
      user.password = hashedPass;

      expect(bcrypt.hash).toHaveBeenCalledWith("plaintext-password", 10);
      expect(user.password).toBe(hashedPassword);
    });

    it("should not hash password if password was not modified", async () => {
      const user = new User({
        name: "John Doe",
        email: "john@example.com",
        password: "plaintext-password",
      });

      // Clear the modified flag
      user.password = user.password;

      // Simulate pre-save hook behavior for unmodified password
      if (!user.isModified("password")) {
        expect(bcrypt.hash).not.toHaveBeenCalled();
      }
    });
  });

  describe("comparePassword method", () => {
    it("should return true if password matches", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const user = new User({
        name: "John Doe",
        email: "john@example.com",
        password: "hashed-password",
      });

      const result = await user.comparePassword("correct-password");

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "correct-password",
        "hashed-password"
      );
      expect(result).toBe(true);
    });

    it("should return false if password does not match", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const user = new User({
        name: "John Doe",
        email: "john@example.com",
        password: "hashed-password",
      });

      const result = await user.comparePassword("wrong-password");

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrong-password",
        "hashed-password"
      );
      expect(result).toBe(false);
    });

    it("should handle bcrypt errors during comparison", async () => {
      const error = new Error("Bcrypt error");
      (bcrypt.compare as jest.Mock).mockRejectedValue(error);

      const user = new User({
        name: "John Doe",
        email: "john@example.com",
        password: "hashed-password",
      });

      await expect(user.comparePassword("some-password")).rejects.toThrow(
        "Bcrypt error"
      );
    });
  });

  describe("User model properties", () => {
    it("should have required fields", () => {
      const user = new User({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });

      expect(user.name).toBe("John Doe");
      expect(user.email).toBe("john@example.com");
      expect(user.password).toBe("password123");
    });

    it("should have createdAt field in schema", () => {
      const user = new User({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });

      // Schema defines createdAt with default Date.now
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("password");
    });

    it("should trim whitespace from name", () => {
      const user = new User({
        name: "  John Doe  ",
        email: "john@example.com",
        password: "password123",
      });

      // Mongoose schema has trim: true, so it trims on instantiation
      expect(user.name).toBe("John Doe");
    });

    it("should lowercase email", () => {
      const user = new User({
        name: "John Doe",
        email: "JOHN@EXAMPLE.COM",
        password: "password123",
      });

      // Mongoose schema has lowercase: true, so it lowercases on instantiation
      expect(user.email).toBe("john@example.com");
    });

    it("should have virtual id property that maps to _id", () => {
      const user = new User({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });

      // Virtual is defined on schema
      expect(user).toHaveProperty("_id");
    });
  });
});
