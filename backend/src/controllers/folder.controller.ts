import { Request, Response, NextFunction } from "express";
import Folder from "../models/folder.model";
import { Types } from "mongoose";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * Create a new folder
 * POST /api/folders
 */
export const createFolder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // STEP 1: CHECK IF AUTHENTICATED
    // This gets the userId from the JWT token (set by middleware)
    // If no userId, user is not authenticated
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Why: We need to know WHO is creating this folder
    // The folder will be linked to this userId in the database

    // STEP 2: GET THE FOLDER NAME FROM REQUEST BODY
    // User sends: { "name": "My Folder" }
    // This extracts that name
    const { name } = req.body;
    // Why: We need the folder name to save in database

    // STEP 3: VALIDATE THE FOLDER NAME
    // Check if name exists AND is not just empty spaces
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Folder name is required" });
    }
    // Why: Don't allow empty folder names in database

    // STEP 4: CREATE NEW FOLDER DOCUMENT
    // Create a new Folder object with:
    // - userId: who owns this folder
    // - name: the folder name (trim removes extra spaces)
    const folder = new Folder({
      userId,
      name: name.trim(),
    });
    // Why: This creates the object structure, but hasn't saved to database yet

    // STEP 5: SAVE TO DATABASE
    // Actually save the folder to MongoDB
    await folder.save();
    // Why: Without this, the folder only exists in memory, not in database

    // STEP 6: SEND SUCCESS RESPONSE
    // Return the newly created folder to the frontend
    res.status(201).json({
      message: "Folder created successfully",
      folder,
    });
    // Why: Frontend needs the new folder data (with the ID) to update the UI
  } catch (error) {
    // STEP 7: HANDLE ERRORS
    // If anything goes wrong, send error response
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * Get all folders for the logged-in user
 * GET /api/folders
 */
export const getFolders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const folders = await Folder.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ folders });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * Rename a folder
 * PUT /api/folders/:id
 */
export const updateFolder = async (
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

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid folder ID" });
    }

    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const folder = await Folder.findById(id);

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    if (folder.userId.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    folder.name = name.trim();
    await folder.save();

    res.status(200).json({
      message: "Folder updated successfully",
      folder,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * Delete a folder
 * DELETE /api/folders/:id
 */
export const deleteFolder = async (
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

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid folder ID" });
    }

    const folder = await Folder.findById(id);

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    if (folder.userId.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    await folder.deleteOne();

    res.status(200).json({ message: "Folder deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
