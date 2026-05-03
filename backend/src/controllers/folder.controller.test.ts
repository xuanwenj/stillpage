import { Request, Response, NextFunction } from "express";
import {
  createFolder,
  getFolders,
  updateFolder,
  deleteFolder,
} from "./folder.controller";
import Folder from "../models/folder.model";

jest.mock("../models/folder.model");

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

describe("folder.controller", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
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

  describe("createFolder", () => {
    it("should return 401 if not authenticated", async () => {
      req.user = undefined;
      await createFolder(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 400 if name is empty", async () => {
      req.body = { name: "   " };
      await createFolder(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should create folder successfully", async () => {
      const mockFolder = { _id: "folder-1", name: "My Folder" };
      req.body = { name: "My Folder" };
      (Folder as any).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(undefined),
        ...mockFolder,
      }));

      const instance = new Folder(mockFolder);
      (instance.save as jest.Mock).mockResolvedValue(undefined);
      await createFolder(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Folder created successfully",
        })
      );
    });
  });

  describe("getFolders", () => {
    it("should return 401 if not authenticated", async () => {
      req.user = undefined;
      await getFolders(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should fetch all user folders", async () => {
      const mockFolders = [{ _id: "1", name: "Folder 1" }];
      (Folder.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockFolders),
      });

      await getFolders(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        folders: mockFolders,
      });
    });
  });

  describe("updateFolder", () => {
    it("should return 401 if not authenticated", async () => {
      req.user = undefined;
      await updateFolder(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 400 if ID is invalid", async () => {
      req.params = { id: "invalid-id" };
      (Folder.findById as jest.Mock).mockResolvedValue(null);

      await updateFolder(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should update folder with valid input", async () => {
      const mockFolder = {
        userId: "user-123",
        name: "Old Name",
        save: jest.fn().mockResolvedValue(undefined),
      };
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { name: "New Name" };
      (Folder.findById as jest.Mock).mockResolvedValue(mockFolder);

      await updateFolder(req as AuthRequest, res as Response, next);

      expect(mockFolder.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteFolder", () => {
    it("should return 401 if not authenticated", async () => {
      req.user = undefined;
      await deleteFolder(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should delete folder if user owns it", async () => {
      const mockFolder = {
        userId: "user-123",
        deleteOne: jest.fn().mockResolvedValue(undefined),
      };
      req.params = { id: "507f1f77bcf86cd799439011" };
      (Folder.findById as jest.Mock).mockResolvedValue(mockFolder);

      await deleteFolder(req as AuthRequest, res as Response, next);

      expect(mockFolder.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Folder deleted successfully",
      });
    });
  });
});
