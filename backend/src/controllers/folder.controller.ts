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
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const folder = new Folder({
      userId,
      name: name.trim(),
    });

    await folder.save();

    res.status(201).json({
      message: "Folder created successfully",
      folder,
    });
  } catch (error) {
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
