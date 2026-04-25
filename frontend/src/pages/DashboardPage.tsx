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

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await noteApi.deleteNote(noteId);
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
      } catch (err) {
        console.error("Failed to delete note:", err);
        alert("Failed to delete the note. Please try again.");
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

  const handleCreateFolder = () => {
    setShowCreateFolderModal(true);
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
      console.log("Moved note to no folder clicked");
    } catch (err) {
      console.error("Failed to move note:", err);
      alert("Failed to move the note. Please try again.");
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
    if (window.confirm("Are you sure you want to delete this todo?")) {
      try {
        await todoApi.deleteTodo(todoId);
        setTodos((prev) => prev.filter((t) => t.id !== todoId));
      } catch (err) {
        console.error("Failed to delete todo:", err);
        alert("Failed to delete the todo. Please try again.");
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
    } catch (err) {
      console.error("Review error:", err);
      alert("Failed to perform the review. Please try again.");
    } finally {
      setReviewLoading(false);
    }
  };

  const todayString = () => new Date().toISOString().slice(0, 10);

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
            {/* Notes + Brain Dump Column */}
            <div className="notes-column">
              <div className="panel panel-half">
                <h2 className="panel-label">NOTES</h2>
                {isLoading ? (
                  <p className="panel-empty">Loading...</p>
                ) : error ? (
                  <p className="panel-empty">{error}</p>
                ) : notes.length === 0 ? (
                  <p className="panel-empty">No notes yet</p>
                ) : (
                  <div className="notes-list">
                    {notes.map((note) => (
                      <div key={note.id} className="note-card">
                        <div className="note-card-header">
                          <h3 className="note-title">{note.title}</h3>
                          <div className="note-menu-container">
                            <button
                              className="note-menu-btn"
                              onClick={(e) => handleMenuToggle(note.id, e)}
                            >
                              ⋮
                            </button>
                            {openMenuNoteId === note.id && (
                              <div
                                className="note-menu-dropdown"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="menu-item edit-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditNote(note);
                                    closeMenu();
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="menu-item duplicate-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    closeMenu();
                                  }}
                                >
                                  Duplicate
                                </button>
                                <button
                                  className="menu-item delete-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    closeMenu();
                                    handleDeleteNote(note.id);
                                  }}
                                >
                                  Delete
                                </button>
                                <div
                                  className={`menu-submenu ${openSubmenuNoteId === note.id ? "active" : ""}`}
                                >
                                  <button
                                    className="submenu-label"
                                    onClick={(e) =>
                                      handleSubmenuToggle(note.id, e)
                                    }
                                  >
                                    Move to folder
                                  </button>
                                  {openSubmenuNoteId === note.id && (
                                    <div className="submenu-options">
                                      <button
                                        className="submenu-item"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMoveNoteToFolder(note.id, null);
                                          closeMenu();
                                        }}
                                      >
                                        None
                                      </button>
                                      {folders.map((folder) => (
                                        <button
                                          key={folder.id}
                                          className="submenu-item"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMoveNoteToFolder(
                                              note.id,
                                              folder.id,
                                            );
                                            closeMenu();
                                          }}
                                        >
                                          {folder.name}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="note-preview">
                          {note.content.replace(/<[^>]*>/g, "")}
                        </p>
                        <div className="note-footer">
                          <span className="note-date">
                            {formatDate(note.createdAt)}
                          </span>
                          <div className="note-tags">
                            {note.tags?.map((tag) => (
                              <span key={tag} className="note-tag-pill">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!isLoading && (
                  <button
                    className="new-item-button"
                    onClick={handleCreateNote}
                  >
                    + New note
                  </button>
                )}
              </div>

              {/* Brain Dump */}
              <div className="panel panel-half brain-dump-panel">
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
                  {pendingTodos.length > 0 && (
                    <div className="todo-section">
                      <h3 className="todo-section-label">Pending</h3>
                      {pendingTodos.map((todo) => (
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
                  {todayTodos.length === 0 && pendingTodos.length === 0 && (
                    <p className="panel-empty">No todos yet</p>
                  )}
                </>
              )}
              {!isLoading && (
                <button className="new-item-button" onClick={handleCreateTodo}>
                  + New todo
                </button>
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
          <div className="dashboard-main tab-view">
            <div className="panel">
              <h2 className="panel-label">Notes</h2>
              <p className="panel-empty">Notes management coming soon.</p>
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
