import { Request, Response, NextFunction } from "express";
import User from "../models/user.model";
import { IUser } from "../types/user";
import { generateToken } from "../services/auth.service"; 
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { name, email, password } = req.body;
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long" });
  }
  try {
    const user = await User.create({ name, email, password });
    res.status(200).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(401).json({
      message: "Error registering user",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const { token, expiresIn } = generateToken(user._id.toString(), user.email);
    res.status(200).json({ message: "Login successful", token, expiresIn, user });
  } catch (error) {
    return res.status(401).json({
      message: "Error during login",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
