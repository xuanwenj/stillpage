import express, { Router } from "express";
import {
  createFolder,
  getFolders,
  updateFolder,
  deleteFolder,
} from "../controllers/folder.controller";
import { authenticate } from "../middlewares/auth.middleware";

const folderRouter: Router = express.Router();

// POST /api/folders - Create a new folder
folderRouter.post("/", authenticate, createFolder);

// GET /api/folders - Get all folders for the user
folderRouter.get("/", authenticate, getFolders);

// PUT /api/folders/:id - Rename a folder
folderRouter.put("/:id", authenticate, updateFolder);

// DELETE /api/folders/:id - Delete a folder
folderRouter.delete("/:id", authenticate, deleteFolder);

export default folderRouter;
