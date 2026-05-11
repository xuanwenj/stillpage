import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  noteApi,
  folderApi,
  todoApi,
  brainDumpApi,
  reviewApi,
} from "../api/client";
import { CreateNote } from "../components/CreateNote";
import { CreateFolder } from "../components/CreateFolder";
import { CreateTodo } from "../components/CreateTodo";
import { WeekReviewPage } from "./WeekReviewPage";
import type { Note, Folder, Todo, BrainDump } from "../types";
import { useToast, useConfirm } from "../toast";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  // Helper function to format seconds to HH:MM:SS
  const formatSeconds = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [hours, minutes, secs]
      .map((val) => String(val).padStart(2, "0"))
      .join(":");
  };

  const [notes, setNotes] = useState<Note[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [openMenuNoteId, setOpenMenuNoteId] = useState<string | null>(null);
  const [openSubmenuNoteId, setOpenSubmenuNoteId] = useState<string | null>(
    null,
  );
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showCreateTodoModal, setShowCreateTodoModal] = useState(false);
  const [brainDump, setBrainDump] = useState<BrainDump | null>(null);
  const [brainDumpContent, setBrainDumpContent] = useState("");
  const [brainDumpSaving, setBrainDumpSaving] = useState(false);
  const [reviewSummary, setReviewSummary] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"daily" | "notes" | "review">(
    "daily",
  );
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [clockTime, setClockTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  });
  const [clockDay, setClockDay] = useState(() =>
    new Date().toLocaleDateString("en-US", { weekday: "long" }),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setClockTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
      setClockDay(now.toLocaleDateString("en-US", { weekday: "long" }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notes, todos and folders
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch notes, folders, and todos in parallel
      const [notesResponse, foldersResponse, todosResponse, brainDumpResponse] =
        await Promise.all([
          noteApi.getNotes(),
          folderApi.getFolders(),
          todoApi.getAllTodos(),
          brainDumpApi.get(),
        ]);

      setNotes(notesResponse.data);
      setFolders(foldersResponse.data);
      setTodos(todosResponse.data);
      setBrainDump(brainDumpResponse.data.entry);
      setBrainDumpContent(brainDumpResponse.data.entry?.content ?? "");
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load your data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCreateNote = () => {
    setEditingNote(null);
    setShowModal(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    const ok = await confirm({
      title: "Delete Note",
      message: "Are you sure you want to delete this note?",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (ok) {
      try {
        await noteApi.deleteNote(noteId);
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
        toast.success("Note deleted.");
      } catch (err) {
        console.error("Failed to delete note:", err);
        toast.error("Failed to delete the note. Please try again.");
      }
    }
  };
  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowModal(true);
  };

  const handleMenuToggle = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuNoteId(openMenuNoteId === noteId ? null : noteId);
  };

  const handleMoveNoteToFolder = async (
    noteId: string,
    folderId: string | null,
  ) => {
    try {
      await noteApi.moveNoteToFolder(noteId, folderId);
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === noteId ? ({ ...note, folderId } as Note) : note,
        ),
      );
      toast.success(
        folderId ? "Note moved to folder." : "Note removed from folder.",
      );
    } catch (err) {
      console.error("Failed to move note:", err);
      toast.error("Failed to move the note. Please try again.");
    }
  };

  const closeMenu = () => {
    setOpenMenuNoteId(null);
    setOpenSubmenuNoteId(null);
  };

  // Close edit menu when clicking outside
  useEffect(() => {
    if (openMenuNoteId === null) return;
    const handleOutsideClick = () => closeMenu();
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [openMenuNoteId]);

  const handleSubmenuToggle = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenSubmenuNoteId(openSubmenuNoteId === noteId ? null : noteId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    return diffMinutes > 0 ? `${diffMinutes}m ago` : "just now";
  };

  const handleDeleteTodo = async (todoId: string) => {
    const ok = await confirm({
      title: "Delete Todo",
      message: "Are you sure you want to delete this todo?",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (ok) {
      try {
        await todoApi.deleteTodo(todoId);
        setTodos((prev) => prev.filter((t) => t.id !== todoId));
        toast.success("Todo deleted.");
      } catch (err) {
        console.error("Failed to delete todo:", err);
        toast.error("Failed to delete the todo. Please try again.");
      }
    }
  };

  const handleCreateTodo = () => {
    setShowCreateTodoModal(true);
  };

  const handleCompletedChange = async (todoId: string) => {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;
    const newCompleted = !todo.completed;
    await todoApi.updateTodo(todoId, undefined, newCompleted);
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todoId ? { ...t, completed: newCompleted } : t,
      ),
    );
  };

  const handleBrainDumpBlur = async () => {
    const saved = brainDump?.content ?? "";
    if (brainDumpContent === saved) return;
    setBrainDumpSaving(true);
    try {
      const res = await brainDumpApi.upsert(brainDumpContent);
      setBrainDump(res.data.entry);
    } catch (err) {
      console.error("Failed to save brain dump:", err);
    } finally {
      setBrainDumpSaving(false);
    }
  };

  const handleReview = async () => {
    setReviewLoading(true);
    try {
      const res = await reviewApi.performReview();
      setReviewSummary(res.data.summary);
      await fetchData();
      toast.success("Review completed.");
    } catch (err) {
      console.error("Review error:", err);
      toast.error("Failed to perform the review. Please try again.");
    } finally {
      setReviewLoading(false);
    }
  };

  const todayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayTodos = todos.filter((t) => t.date === todayString());
  const pendingTodos = todos.filter(
    (t) => t.date !== todayString() && !t.completed,
  );

  return (
    <div className="dashboard-wrapper">
      {/* Navbar */}
      <div className="dashboard-navbar">
        <h1>Stillpage</h1>
        <div className="navbar-right">
          <span>{user?.name}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Sidebar — reserved for future navigation */}
        <div className="dashboard-sidebar">
          <nav className="sidebar-nav">
            {(["daily", "notes", "review"] as const).map((tab) => (
              <button
                key={tab}
                className={`sidebar-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Three-panel grid */}
        {activeTab === "daily" && (
          <div className="dashboard-main">
            {/* Brain Dump Column */}
            <div className="notes-column">
              {/* Brain Dump */}
              <div className="panel brain-dump-panel">
                <div className="brain-dump-header">
                  <h2 className="panel-label">Brain Dump</h2>
                  {brainDumpSaving && (
                    <span className="brain-dump-saving">saving…</span>
                  )}
                </div>
                <textarea
                  className="brain-dump-textarea"
                  placeholder="Quick capture, no need to organise..."
                  value={brainDumpContent}
                  onChange={(e) => setBrainDumpContent(e.target.value)}
                  onBlur={handleBrainDumpBlur}
                />
              </div>
            </div>

            {/* Todos Panel */}
            <div className="panel">
              <h2 className="panel-label">TODOS</h2>
              {isLoading ? (
                <p className="panel-empty">Loading...</p>
              ) : (
                <>
                  {todayTodos.length > 0 && (
                    <div className="todo-section">
                      <h3 className="todo-section-label">Today</h3>
                      {todayTodos.map((todo) => (
                        <div key={todo.id} className="todo-item">
                          <div className="todo-content">
                            <button
                              className={`todo-circle-btn ${todo.completed ? "checked" : ""}`}
                              onClick={() => handleCompletedChange(todo.id)}
                              aria-label={
                                todo.completed
                                  ? "Mark incomplete"
                                  : "Mark complete"
                              }
                            >
                              {todo.completed ? (
                                <svg
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <circle cx="10" cy="10" r="10" />
                                  <path
                                    d="M6 10.5l2.5 2.5 5.5-5.5"
                                    stroke="white"
                                    strokeWidth="1.75"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    fill="none"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <circle
                                    cx="10"
                                    cy="10"
                                    r="9"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                  />
                                </svg>
                              )}
                            </button>
                            <span
                              className={`todo-title ${todo.completed ? "completed" : ""}`}
                            >
                              {todo.content}
                            </span>
                          </div>
                          <div className="todo-actions">
                            <button
                              className="todo-delete-btn"
                              onClick={() => handleDeleteTodo(todo.id)}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="todo-section">
                    {!isLoading && (
                      <button
                        className="new-item-button"
                        onClick={handleCreateTodo}
                      >
                        + New todo
                      </button>
                    )}
                    <h3 className="todo-section-label">Upcoming</h3>
                    {pendingTodos.length === 0 ? (
                      <p className="panel-empty">Nothing upcoming</p>
                    ) : (
                      pendingTodos.map((todo) => (
                        <div key={todo.id} className="todo-item">
                          <div className="todo-content">
                            <span className="todo-title">{todo.content}</span>
                          </div>
                          <div className="todo-actions">
                            <button
                              className="todo-delete-btn"
                              onClick={() => handleDeleteTodo(todo.id)}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {todayTodos.length === 0 && (
                    <p className="panel-empty">No todos for today</p>
                  )}
                </>
              )}
            </div>

            {/* Right Panel */}
            <div className="right-panel">
              {/* Clock */}
              <div className="clock-card">
                <div className="clock-time">{clockTime}</div>
                <div className="clock-day">{clockDay}</div>
              </div>

              {/* Today's Review */}
              <div className="panel-card review-card">
                <button
                  className="panel-label review-btn"
                  onClick={handleReview}
                  disabled={reviewLoading}
                >
                  {reviewLoading ? "Generating..." : "Today's Review"}
                </button>
                {reviewSummary && (
                  <p className="review-summary">{reviewSummary}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notes tab */}
        {activeTab === "notes" && (
          <div className="dashboard-main notes-layout">
            {/* Left: Folders */}
            <div className="notes-folders-panel">
              <div className="folders-header">
                <h2 className="panel-label">NOTES</h2>
                <button className="folder-add-btn">+</button>
              </div>
              <div className="folders-list">
                <button
                  className={`folder-item inbox-folder ${selectedFolderId === null ? "active" : ""}`}
                  onClick={() => setSelectedFolderId(null)}
                >
                  <span className="folder-name">Inbox</span>
                  <span className="folder-count">
                    {notes.filter((n) => !n.folderId).length}
                  </span>
                </button>
                {folders.map((folder) => {
                  const folderNotes = notes.filter(
                    (n) => n.folderId === folder.id,
                  );
                  return (
                    <button
                      key={folder.id}
                      className={`folder-item ${selectedFolderId === folder.id ? "active" : ""}`}
                      onClick={() => setSelectedFolderId(folder.id)}
                    >
                      <span className="folder-icon">📁</span>
                      <span className="folder-name">{folder.name}</span>
                      <span className="folder-count">{folderNotes.length}</span>
                    </button>
                  );
                })}
                <button className="new-folder-btn">+ New folder</button>
              </div>
            </div>

            {/* Middle: Notes List */}
            <div className="notes-list-panel">
              <div className="notes-list-header">
                <h2 className="panel-label">
                  {selectedFolderId
                    ? folders.find((f) => f.id === selectedFolderId)?.name
                    : "Inbox"}
                </h2>
                <div className="notes-list-actions">
                  <span className="unsorted-badge">
                    {
                      notes.filter((n) =>
                        selectedFolderId === null
                          ? !n.folderId
                          : n.folderId === selectedFolderId,
                      ).length
                    }{" "}
                    unsorted
                  </span>
                  <button className="notes-list-action-btn">+</button>
                </div>
              </div>
              <div className="notes-list-container">
                {notes
                  .filter((n) =>
                    selectedFolderId === null
                      ? !n.folderId
                      : n.folderId === selectedFolderId,
                  )
                  .map((note) => (
                    <div
                      key={note.id}
                      className={`notes-list-item ${selectedNoteId === note.id ? "active" : ""}`}
                      onClick={() => setSelectedNoteId(note.id)}
                    >
                      <div className="notes-list-item-header">
                        {note.tags?.[0] && (
                          <span className="note-tag-indicator">●</span>
                        )}
                        <h3 className="notes-list-item-title">{note.title}</h3>
                      </div>
                      <p className="notes-list-item-preview">
                        {note.content
                          ? note.content
                              .replace(/<[^>]*>/g, "")
                              .substring(0, 100)
                          : note.videoUrl
                            ? `📹 ${note.videoUrl}`
                            : "(No content)"}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Right: Note Detail */}
            <div className="note-detail-panel">
              {selectedNoteId && notes.find((n) => n.id === selectedNoteId) ? (
                (() => {
                  const note = notes.find((n) => n.id === selectedNoteId)!;
                  return (
                    <div className="note-detail-content">
                      <div className="note-detail-header">
                        <h1 className="note-detail-title">{note.title}</h1>
                        <div className="note-detail-actions">
                          <button className="note-detail-action-btn">
                            Move to folder
                          </button>
                          <button className="note-detail-action-btn">🗑</button>
                        </div>
                      </div>
                      <p className="note-detail-meta">
                        Saved from{" "}
                        {new Date(note.createdAt).toLocaleTimeString()}
                      </p>
                      <div className="note-detail-body">
                        {note.content ? (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: note.content,
                            }}
                          />
                        ) : (
                          <p className="note-empty-content">
                            (No content - only title was saved)
                          </p>
                        )}
                        {note.videoUrl && (
                          <div className="note-video-info">
                            <strong>Video:</strong>{" "}
                            <a
                              href={note.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {note.videoUrl}
                            </a>
                            {note.videoItems && note.videoItems.length > 0 && (
                              <div className="video-items">
                                <strong>Video Notes:</strong>
                                <ul>
                                  {note.videoItems.map((item, idx) => (
                                    <li key={idx}>
                                      [{formatSeconds(item.time)}] {item.note}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="note-detail-empty">
                  <p>Select a note to view</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Review tab */}
        {activeTab === "review" && (
          <div className="dashboard-main tab-view">
            <WeekReviewPage />
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTodo
        isOpen={showCreateTodoModal}
        onClose={() => setShowCreateTodoModal(false)}
        onSave={() => {
          setShowCreateTodoModal(false);
          fetchData();
        }}
      />
      <CreateNote
        isOpen={showModal}
        selectedFolder={null}
        onClose={() => setShowModal(false)}
        onSave={() => {
          setShowModal(false);
          setEditingNote(null);
          fetchData();
        }}
        note={editingNote || undefined}
      />
      <CreateFolder
        isOpen={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onSave={() => {
          setShowCreateFolderModal(false);
          fetchData();
        }}
      />
    </div>
  );
};
