import { Request, Response } from "express";
import { getBrainDump, upsertBrainDump } from "./braindump.controller";
import BrainDump from "../models/braindump.model";

jest.mock("../models/braindump.model");

// Mock the Types.ObjectId call in braindump.controller
jest.mock("mongoose", () => {
  const actualMongoose = jest.requireActual("mongoose");
  return {
    ...actualMongoose,
    Types: {
      ...actualMongoose.Types,
      ObjectId: jest.fn((id) => id),
    },
  };
});

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

describe("braindump.controller", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: {
        userId: "user-123",
        email: "user@example.com",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe("getBrainDump", () => {
    it("should return 401 if user is not authenticated", async () => {
      req.user = undefined;
      await getBrainDump(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });

    it("should fetch brain dump for today if no date provided", async () => {
      const mockEntry = {
        _id: "entry-1",
        userId: "507f1f77bcf86cd799439011",
        content: "Today's thoughts",
        date: new Date().toISOString().slice(0, 10),
      };
      (BrainDump.findOne as jest.Mock).mockResolvedValue(mockEntry);

      await getBrainDump(req as AuthRequest, res as Response);

      expect(BrainDump.findOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ entry: mockEntry });
    });

    it("should fetch brain dump for specific date", async () => {
      const mockEntry = {
        _id: "entry-1",
        userId: "507f1f77bcf86cd799439011",
        content: "Past thoughts",
        date: "2026-05-01",
      };
      req.query = { date: "2026-05-01" };
      (BrainDump.findOne as jest.Mock).mockResolvedValue(mockEntry);

      await getBrainDump(req as AuthRequest, res as Response);

      expect(BrainDump.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          date: "2026-05-01",
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ entry: mockEntry });
    });

    it("should return null if no entry found", async () => {
      (BrainDump.findOne as jest.Mock).mockResolvedValue(null);

      await getBrainDump(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ entry: null });
    });

    it("should handle errors gracefully", async () => {
      (BrainDump.findOne as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await getBrainDump(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error fetching brain dump",
      });
    });
  });

  describe("upsertBrainDump", () => {
    it("should return 401 if user is not authenticated", async () => {
      req.user = undefined;
      req.body = { content: "Some content" };
      await upsertBrainDump(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });

    it("should create a brain dump entry for today", async () => {
      const mockEntry = {
        _id: "entry-1",
        userId: "507f1f77bcf86cd799439011",
        content: "New thoughts",
        date: new Date().toISOString().slice(0, 10),
      };
      req.body = { content: "New thoughts" };
      (BrainDump.findOneAndUpdate as jest.Mock).mockResolvedValue(mockEntry);

      await upsertBrainDump(req as AuthRequest, res as Response);

      expect(BrainDump.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(Object),
          date: expect.any(String),
        }),
        { content: "New thoughts" },
        {
          upsert: true,
          returnDocument: "after",
          setDefaultsOnInsert: true,
        }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ entry: mockEntry });
    });

    it("should update brain dump for specific date", async () => {
      const mockEntry = {
        _id: "entry-1",
        userId: "507f1f77bcf86cd799439011",
        content: "Updated thoughts",
        date: "2026-05-01",
      };
      req.body = { content: "Updated thoughts", date: "2026-05-01" };
      (BrainDump.findOneAndUpdate as jest.Mock).mockResolvedValue(mockEntry);

      await upsertBrainDump(req as AuthRequest, res as Response);

      expect(BrainDump.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          date: "2026-05-01",
        }),
        { content: "Updated thoughts" },
        {
          upsert: true,
          returnDocument: "after",
          setDefaultsOnInsert: true,
        }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ entry: mockEntry });
    });

    it("should handle empty content", async () => {
      const mockEntry = {
        _id: "entry-1",
        userId: "507f1f77bcf86cd799439011",
        content: "",
        date: new Date().toISOString().slice(0, 10),
      };
      req.body = { content: null };
      (BrainDump.findOneAndUpdate as jest.Mock).mockResolvedValue(mockEntry);

      await upsertBrainDump(req as AuthRequest, res as Response);

      expect(BrainDump.findOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        { content: "" },
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle errors gracefully", async () => {
      req.body = { content: "Some content" };
      (BrainDump.findOneAndUpdate as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await upsertBrainDump(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error saving brain dump",
      });
    });

    it("should use today's date if date not provided", async () => {
      const today = new Date().toISOString().slice(0, 10);
      const mockEntry = {
        _id: "entry-1",
        userId: "507f1f77bcf86cd799439011",
        content: "Today's content",
        date: today,
      };
      req.body = { content: "Today's content" };
      (BrainDump.findOneAndUpdate as jest.Mock).mockResolvedValue(mockEntry);

      await upsertBrainDump(req as AuthRequest, res as Response);

      expect(BrainDump.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          date: today,
        }),
        expect.any(Object),
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
