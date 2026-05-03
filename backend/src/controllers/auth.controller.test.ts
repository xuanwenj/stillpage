import { Request, Response, NextFunction } from "express";
import { register, login } from "./auth.controller";
import User from "../models/user.model";
import * as authService from "../services/auth.service";

jest.mock("../models/user.model");
jest.mock("../services/auth.service");

describe("auth.controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn() as NextFunction;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("register", () => {
    it("should return 400 if password is less than 6 characters", async () => {
      req.body = {
        name: "John Doe",
        email: "john@example.com",
        password: "12345",
      };

      await register(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Password must be at least 6 characters long",
      });
    });

    it("should create a user and return 200 on successful registration", async () => {
      const mockUser = {
        _id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        password: "hashed-password",
      };
      req.body = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };
      (User.create as jest.Mock).mockResolvedValue(mockUser);

      await register(req as Request, res as Response, next);

      expect(User.create).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "User registered successfully",
        user: mockUser,
      });
    });

    it("should return 401 on registration error", async () => {
      req.body = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };
      const error = new Error("Email already exists");
      (User.create as jest.Mock).mockRejectedValue(error);

      await register(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error registering user",
        error: "Email already exists",
      });
    });

    it("should handle non-Error exceptions in registration", async () => {
      req.body = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };
      (User.create as jest.Mock).mockRejectedValue("Unknown error");

      await register(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error registering user",
        error: "Unknown error",
      });
    });
  });

  describe("login", () => {
    it("should return 400 if email or password is missing", async () => {
      req.body = { email: "john@example.com" };

      await login(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email and password are required",
      });
    });

    it("should return 401 if user is not found", async () => {
      req.body = {
        email: "nonexistent@example.com",
        password: "password123",
      };
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await login(req as Request, res as Response, next);

      expect(User.findOne).toHaveBeenCalledWith({
        email: "nonexistent@example.com",
      });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid email or password",
      });
    });

    it("should return 401 if password does not match", async () => {
      const mockUser = {
        _id: "user-123",
        email: "john@example.com",
        comparePassword: jest.fn().mockResolvedValue(false),
      };
      req.body = {
        email: "john@example.com",
        password: "wrongpassword",
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await login(req as Request, res as Response, next);

      expect(mockUser.comparePassword).toHaveBeenCalledWith("wrongpassword");
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid email or password",
      });
    });

    it("should return token and user on successful login", async () => {
      const mockUser = {
        _id: "user-123",
        email: "john@example.com",
        name: "John Doe",
        comparePassword: jest.fn().mockResolvedValue(true),
      };
      req.body = {
        email: "john@example.com",
        password: "password123",
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (authService.generateToken as jest.Mock).mockReturnValue({
        token: "jwt-token",
        expiresIn: 3600,
      });

      await login(req as Request, res as Response, next);

      expect(mockUser.comparePassword).toHaveBeenCalledWith("password123");
      expect(authService.generateToken).toHaveBeenCalledWith(
        "user-123",
        "john@example.com"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Login successful",
        token: "jwt-token",
        expiresIn: 3600,
        user: mockUser,
      });
    });

    it("should return 401 on login error", async () => {
      req.body = {
        email: "john@example.com",
        password: "password123",
      };
      const error = new Error("Database connection failed");
      (User.findOne as jest.Mock).mockRejectedValue(error);

      await login(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error during login",
        error: "Database connection failed",
      });
    });

    it("should handle non-Error exceptions in login", async () => {
      req.body = {
        email: "john@example.com",
        password: "password123",
      };
      (User.findOne as jest.Mock).mockRejectedValue("Unknown error");

      await login(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error during login",
        error: "Unknown error",
      });
    });
  });
});
