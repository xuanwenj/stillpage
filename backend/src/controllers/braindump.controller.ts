import { Request, Response } from "express";
import BrainDump from "../models/braindump.model";
import { Types } from "mongoose";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * GET /api/braindump?date=YYYY-MM-DD
 * Get the brain dump entry for a given date (defaults to today).
 */
export const getBrainDump = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const date = (req.query.date as string) || todayString();

    const entry = await BrainDump.findOne({
      userId: new Types.ObjectId(userId),
      date,
    });

    return res.status(200).json({ entry: entry ?? null });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching brain dump" });
  }
};

/**
 * PUT /api/braindump
 * Upsert (create or update) the brain dump entry for a date.
 * Body: { content, date? }
 */
export const upsertBrainDump = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { content, date } = req.body;
    const targetDate = date || todayString();

    const entry = await BrainDump.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), date: targetDate },
      { content: content ?? "" },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    return res.status(200).json({ entry });
  } catch (error) {
    console.error("upsertBrainDump error:", error);
    return res.status(500).json({ message: "Error saving brain dump" });
  }
};

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}
