import express, { Router } from "express";
import {
  getDailyReview,
  getWeeklyReview,
} from "../controllers/review.controller";
import { authenticate } from "../middlewares/auth.middleware";

const reviewRouter: Router = express.Router();

reviewRouter.post("/daily", authenticate, getDailyReview);

reviewRouter.post("/weekly", authenticate, getWeeklyReview);

export default reviewRouter;
