// User types
export type User = {
  id: string;
  name: string;
  email: string;
};

// Auth response from backend
export type LoginResponse = {
  token: string;
  user: User;
};

export type RegisterResponse = {
  token: string;
  user: User;
};

// Note types
export type Note = {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
};

// Folder types
export type Folder = {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

// API Error response
export type ApiError = {
  message: string;
  status: number;
};

export type Todo = {
  id: string;
  noteId?: string;
  userId: string;
  content: string;
  completed: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};
