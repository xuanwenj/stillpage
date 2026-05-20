import { Request, Response, NextFunction } from "express";
import Note, { INote } from "../models/note.model";
import { Types } from "mongoose";

// Extended Request to include user from auth middleware
interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * Create a new note
 * POST /api/notes
 */
export const createNote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { title, content, folderId, tags, videoUrl, videoItems } = req.body;

    // Validation
    if (!title || title.trim() === "") {
      return res.status(400).json({ message: "Title is required" });
    }

    // Validate tags
    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        return res.status(400).json({ message: "Tags must be an array" });
      }
      if (tags.length > 3) {
        return res.status(400).json({ message: "Maximum 3 tags allowed" });
      }
      if (tags.some((t: unknown) => typeof t !== "string" || t.trim() === "")) {
        return res
          .status(400)
          .json({ message: "Each tag must be a non-empty string" });
      }
    }
    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };
    // Create note
    const note = new Note({
      userId,
      title: title.trim(),
      content:
        content ||
        `<p>${videoUrl}</p>` +
          videoItems
            .map(
              (item: any) => `<p>${formatTime(item.time)} - ${item.note}</p>`,
            )
            .join(""),
      folderId: folderId || null,
      tags: tags ?? [],
      date: new Date().toISOString().slice(0, 10),
      videoUrl: videoUrl || null,
      videoItems: videoItems || [],
    });

    await note.save();

    res.status(201).json({
      message: "Note created successfully",
      note,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating note",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get all notes for the user (optionally filter by folder)
 * GET /api/notes?folderId=xxx
 */
export const getNotes = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { folderId } = req.query;

    // Build query
    const query: any = { userId };
    if (folderId) {
      query.folderId = folderId;
    }

    const notes = await Note.find(query).sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      message: "Notes retrieved successfully",
      count: notes.length,
      notes,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching notes",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get a single note by ID
 * GET /api/notes/:id
 */
export const getNoteById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params as { id: string };

    // Validate ID format
    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid note ID" });
    }

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Security check: verify user owns this note
    if (note.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this note" });
    }

    res.status(200).json({
      message: "Note retrieved successfully",
      note,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching note",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Update a note
 * PUT /api/notes/:id
 */
export const updateNote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params as { id: string };
    const { title, content, folderId, tags, videoUrl, videoItems } = req.body;

    // Validate ID format
    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid note ID" });
    }

    // Find note
    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Security check: verify user owns this note
    if (note.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this note" });
    }

    // Update fields (only if provided)
    if (title !== undefined && title.trim() !== "") {
      note.title = title.trim();
    }
    if (content !== undefined) {
      note.content = content;
    }
    if (folderId !== undefined) {
      note.folderId = folderId || null;
    }
    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        return res.status(400).json({ message: "Tags must be an array" });
      }
      if (tags.length > 3) {
        return res.status(400).json({ message: "Maximum 3 tags allowed" });
      }
      if (tags.some((t: unknown) => typeof t !== "string" || t.trim() === "")) {
        return res
          .status(400)
          .json({ message: "Each tag must be a non-empty string" });
      }
      note.tags = tags;
    }
    if (videoUrl !== undefined) {
      note.videoUrl = videoUrl || null;
    }
    if (videoItems !== undefined) {
      note.videoItems = videoItems || [];
    }
    await note.save();

    res.status(200).json({
      message: "Note updated successfully",
      note,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating note",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Delete a note
 * DELETE /api/notes/:id
 */
export const deleteNote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params as { id: string };

    // Validate ID format
    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid note ID" });
    }

    // Find note
    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Security check: verify user owns this note
    if (note.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this note" });
    }

    await Note.findByIdAndDelete(id);

    res.status(200).json({
      message: "Note deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting note",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
