import jwt, { Jwt } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "";

interface TokenData {
  token: string;
  expiresIn: number;
}

interface JwtPayload {
  userId: string;
  email: string;
  exp: number;
}

export const generateToken = (userId: string, email: string): TokenData => {
  const expiresIn = 60 * 60; // 1 hour
  const token = jwt.sign({ userId, email }, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn,
  });
  return { token, expiresIn };
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
};
