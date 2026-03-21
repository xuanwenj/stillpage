import express, { Router, Request, Response } from "express";
import { login, register } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const authRouter: Router = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);

// 受保护的路由示例
authRouter.get("/profile", authenticate, (req: Request, res: Response) => {
  res.status(200).json({ message: "Profile accessed", user: (req as any).user });
});

export default authRouter;
