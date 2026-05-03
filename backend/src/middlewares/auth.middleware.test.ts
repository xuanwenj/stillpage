import { Request, Response, NextFunction } from "express";
import { authenticate } from "./auth.middleware";
import * as authService from "../services/auth.service";

jest.mock("../services/auth.service");

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

describe("auth.middleware", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
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

  it("should return 401 if no authorization header is provided", () => {
    authenticate(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if authorization header has no bearer token", () => {
    req.headers = { authorization: "InvalidFormat" };

    authenticate(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if token verification fails", () => {
    req.headers = { authorization: "Bearer invalid-token" };
    (authService.verifyToken as jest.Mock).mockReturnValue(null);

    authenticate(req as AuthRequest, res as Response, next);

    expect(authService.verifyToken).toHaveBeenCalledWith("invalid-token");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should attach user to request and call next if token is valid", () => {
    const mockUser = {
      userId: "user-123",
      email: "user@example.com",
      exp: 1234567890,
    };
    req.headers = { authorization: "Bearer valid-token" };
    (authService.verifyToken as jest.Mock).mockReturnValue(mockUser);

    authenticate(req as AuthRequest, res as Response, next);

    expect(authService.verifyToken).toHaveBeenCalledWith("valid-token");
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should handle bearer token with multiple spaces in header", () => {
    // The split(" ")[1] approach will get empty string from multiple spaces
    // This test verifies the actual behavior: empty string fails verification
    req.headers = { authorization: "Bearer   " };
    (authService.verifyToken as jest.Mock).mockReturnValue(null);

    authenticate(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
