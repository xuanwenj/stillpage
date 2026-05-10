import { Request, Response, NextFunction } from "express";
import { createNote, getNotes, updateNote, deleteNote } from "./note.controller";
import Note from "../models/note.model";

jest.mock("../models/note.model");

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

describe("note.controller", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

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
    next = jest.fn() as NextFunction;
    jest.clearAllMocks();
  });

  describe("createNote", () => {
    it("should return 401 if user is not authenticated", async () => {
      req.user = undefined;
      await createNote(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 400 if title is empty", async () => {
      req.body = { title: "   " };
      await createNote(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Title is required",
      });
    });

    it("should return 400 if tags exceed 3", async () => {
      req.body = {
        title: "Note",
        tags: ["a", "b", "c", "d"],
      };
      await createNote(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should create a note successfully", async () => {
      const mockNote = { _id: "note-1", title: "Test" };
      req.body = { title: "Test Note" };
      (Note as any).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(undefined),
        ...mockNote,
      }));

      const instance = new Note(mockNote);
      (instance.save as jest.Mock).mockResolvedValue(undefined);
      await createNote(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should create a note with video URL and items", async () => {
      const mockNote = { _id: "note-1", title: "Video Note" };
      req.body = {
        title: "Video Note",
        videoUrl: "https://example.com/video.mp4",
        videoItems: [
          { time: 10, note: "Timestamp 1" },
          { time: 30, note: "Timestamp 2" },
        ],
      };
      (Note as any).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(undefined),
        ...mockNote,
      }));

      const instance = new Note(mockNote);
      (instance.save as jest.Mock).mockResolvedValue(undefined);
      await createNote(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Note created successfully",
        })
      );
    });

    it("should create a note with null videoUrl when not provided", async () => {
      const mockNote = { _id: "note-1", title: "Test" };
      req.body = { title: "Test Note" };
      (Note as any).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(undefined),
        ...mockNote,
      }));

      const instance = new Note(mockNote);
      (instance.save as jest.Mock).mockResolvedValue(undefined);
      await createNote(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("getNotes", () => {
    it("should return 401 if user not authenticated", async () => {
      req.user = undefined;
      await getNotes(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should fetch notes for user", async () => {
      const mockNotes = [{ _id: "1", title: "Note 1" }];
      (Note.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockNotes),
      });
      req.query = {};

      await getNotes(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 1,
          notes: mockNotes,
        })
      );
    });
  });

  describe("updateNote", () => {
    it("should return 401 if user not authenticated", async () => {
      req.user = undefined;
      await updateNote(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 400 if note ID is invalid", async () => {
      req.params = { id: "invalid-id" };
      req.body = { title: "New Title" };
      (Note.findById as jest.Mock).mockResolvedValue(null);

      await updateNote(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should update note if user owns it", async () => {
      const mockNote = {
        userId: "user-123",
        title: "Old",
        save: jest.fn().mockResolvedValue(undefined),
      };
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { title: "New" };
      (Note.findById as jest.Mock).mockResolvedValue(mockNote);

      await updateNote(req as AuthRequest, res as Response, next);

      expect(mockNote.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should update note with video URL", async () => {
      const mockNote = {
        userId: "user-123",
        title: "Old",
        videoUrl: null,
        save: jest.fn().mockResolvedValue(undefined),
      };
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { videoUrl: "https://example.com/video.mp4" };
      (Note.findById as jest.Mock).mockResolvedValue(mockNote);

      await updateNote(req as AuthRequest, res as Response, next);

      expect(mockNote.videoUrl).toBe("https://example.com/video.mp4");
      expect(mockNote.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should update note with video items", async () => {
      const mockNote = {
        userId: "user-123",
        title: "Old",
        videoItems: [],
        save: jest.fn().mockResolvedValue(undefined),
      };
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = {
        videoItems: [
          { time: 15, note: "Important" },
          { time: 45, note: "Conclusion" },
        ],
      };
      (Note.findById as jest.Mock).mockResolvedValue(mockNote);

      await updateNote(req as AuthRequest, res as Response, next);

      expect(mockNote.videoItems).toEqual([
        { time: 15, note: "Important" },
        { time: 45, note: "Conclusion" },
      ]);
      expect(mockNote.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should clear video URL when set to null", async () => {
      const mockNote = {
        userId: "user-123",
        title: "Old",
        videoUrl: "https://example.com/video.mp4",
        save: jest.fn().mockResolvedValue(undefined),
      };
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { videoUrl: null };
      (Note.findById as jest.Mock).mockResolvedValue(mockNote);

      await updateNote(req as AuthRequest, res as Response, next);

      expect(mockNote.videoUrl).toBeNull();
      expect(mockNote.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteNote", () => {
    it("should return 401 if user not authenticated", async () => {
      req.user = undefined;
      await deleteNote(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should delete note if user owns it", async () => {
      const mockNote = {
        userId: "user-123",
      };
      req.params = { id: "507f1f77bcf86cd799439011" };
      (Note.findById as jest.Mock).mockResolvedValue(mockNote);
      (Note.findByIdAndDelete as jest.Mock).mockResolvedValue(mockNote);

      await deleteNote(req as AuthRequest, res as Response, next);

      expect(Note.findByIdAndDelete).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
