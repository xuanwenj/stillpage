import express, { Router } from "express";
import {
  getBrainDump,
  upsertBrainDump,
} from "../controllers/braindump.controller";
import { authenticate } from "../middlewares/auth.middleware";

const brainDumpRouter: Router = express.Router();

brainDumpRouter.get("/", authenticate, getBrainDump);
brainDumpRouter.put("/", authenticate, upsertBrainDump);

export default brainDumpRouter;
