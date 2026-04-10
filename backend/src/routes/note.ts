import express, { Router } from "express";
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
} from "../controllers/note.controller";
import { authenticate } from "../middlewares/auth.middleware";

const noteRouter: Router = express.Router();

/**
 * All note routes require authentication
 * Every request must include: Authorization: Bearer {token}
 */

/**
 * POST /api/notes
 * Create a new note
 * Body: { title, content (optional), folderId (optional) }
 */
noteRouter.post("/", authenticate, createNote);

/**
 * GET /api/notes
 * Get all notes for the user (newest first)
 * Query params: ?folderId=xxx (optional - filter by folder)
 */
noteRouter.get("/", authenticate, getNotes);

/**
 * GET /api/notes/:id
 * Get a single note by ID
 * Params: id (note ID)
 */
noteRouter.get("/:id", authenticate, getNoteById);

/**
 * PUT /api/notes/:id
 * Update a note
 * Params: id (note ID)
 * Body: { title (optional), content (optional), folderId (optional) }
 */
noteRouter.put("/:id", authenticate, updateNote);

/**
 * DELETE /api/notes/:id
 * Delete a note
 * Params: id (note ID)
 */
noteRouter.delete("/:id", authenticate, deleteNote);

/**
 * CREATE FOLDER /api/notes/:id/folder
 * Create a folder for a note
 * Params: id (note ID)
 * Body: { name }
 */
noteRouter.post("/:id/folder", authenticate);

export default noteRouter;
