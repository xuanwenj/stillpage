import axios from "axios";
import type { AxiosInstance } from "axios";
import type {
  LoginResponse,
  RegisterResponse,
  User,
  Note,
  Folder,
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
  getNotes: () => apiClient.get<Note[]>("/notes"),

  getNote: (id: string) => apiClient.get<Note>(`/notes/${id}`),

  createNote: (title: string, content: string, folderId?: string) =>
    apiClient.post<Note>("/notes", { title, content, folderId }),

  updateNote: (id: string, title: string, content: string, folderId?: string) =>
    apiClient.put<Note>(`/notes/${id}`, { title, content, folderId }),

  deleteNote: (id: string) => apiClient.delete(`/notes/${id}`),
};

// Folder endpoints
export const folderApi = {
  getFolders: () => apiClient.get<Folder[]>("/folders"),

  createFolder: (name: string) => apiClient.post<Folder>("/folders", { name }),

  deleteFolder: (id: string) => apiClient.delete(`/folders/${id}`),
};

export default apiClient;
