import express, { Router } from "express";
import { getDailyReview } from "../controllers/review.controller";
import { authenticate } from "../middlewares/auth.middleware";

const reviewRouter: Router = express.Router();

reviewRouter.post("/daily", authenticate, getDailyReview);

export default reviewRouter;
