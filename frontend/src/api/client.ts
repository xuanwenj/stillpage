import axios from "axios";
import type { AxiosInstance } from "axios";
import type {
  LoginResponse,
  RegisterResponse,
  User,
  Note,
  Folder,
  Todo,
  BrainDump,
} from "../types";

// Create axios instance with base URL
const apiClient: AxiosInstance = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to add JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 (unauthorized), token probably expired
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth endpoints
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>("/auth/login", { email, password }),

  register: (name: string, email: string, password: string) =>
    apiClient.post<RegisterResponse>("/auth/register", {
      name,
      email,
      password,
    }),

  getCurrentUser: () => apiClient.get<User>("/auth/me"),
};

// Note endpoints
export const noteApi = {
  getNotes: async () => {
    const response = await apiClient.get<{
      message: string;
      count: number;
      notes: Note[];
    }>("/notes");
    return { data: response.data.notes };
  },

  getNote: (id: string) => apiClient.get<Note>(`/notes/${id}`),

  createNote: (
    title: string,
    content: string,
    folderId?: string,
    tags?: string[] | null,
  ) =>
    apiClient.post<{ message: string; note: Note }>("/notes", {
      title,
      content,
      folderId,
      tags,
    }),

  updateNote: (
    id: string,
    title: string,
    content: string,
    folderId?: string | null,
    tags?: string[] | null,
  ) =>
    apiClient.put<{ message: string; note: Note }>(`/notes/${id}`, {
      title,
      content,
      folderId,
      tags,
    }),

  deleteNote: (id: string) => apiClient.delete(`/notes/${id}`),

  moveNoteToFolder: (noteId: string, folderId: string | null) =>
    apiClient.put(`/notes/${noteId}`, { folderId }),
};

// Folder endpoints
export const folderApi = {
  getFolders: async () => {
    const response = await apiClient.get<{ folders: Folder[] }>("/folders");
    return { data: response.data.folders };
  },

  createFolder: (name: string) => apiClient.post<Folder>("/folders", { name }),

  deleteFolder: (id: string) => apiClient.delete(`/folders/${id}`),
};

// Todo endpoints
export const todoApi = {
  getAllTodos: async () => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const response = await apiClient.get<{
      message: string;
      count: number;
      todos: Todo[];
    }>("/todos", { params: { timezone } });
    return { data: response.data.todos };
  },

  createTodo: (content: string, noteId?: string | null) =>
    apiClient.post<{ message: string; todo: Todo }>("/todos", {
      content,
      noteId,
    }),

  updateTodo: (id: string, content?: string, completed?: boolean) =>
    apiClient.put<{ message: string; todo: Todo }>(`/todos/${id}`, {
      content,
      completed,
    }),

  deleteTodo: (id: string) => apiClient.delete(`/todos/${id}`),
};

// Brain Dump endpoints
export const brainDumpApi = {
  get: (date?: string) =>
    apiClient.get<{ entry: BrainDump | null }>("/braindump", {
      params: date ? { date } : {},
    }),

  upsert: (content: string, date?: string) =>
    apiClient.put<{ entry: BrainDump }>("/braindump", {
      content,
      date,
    }),
};

export const reviewApi = {
  performReview: () =>
    apiClient.post<{ summary: string; tomorrowSuggestions: string[] }>(
      "/review/daily",
    ),
};

export default apiClient;
