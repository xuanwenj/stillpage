import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { noteApi, folderApi, todoApi } from "../api/client";
import { CreateNote } from "../components/CreateNote";
import { CreateFolder } from "../components/CreateFolder";
import { CreateTodo } from "../components/CreateTodo";
import type { Note, Folder, Todo } from "../types";

type TabType = "notes" | "todos" | "review";
type TodoFilter = "all" | "today" | "completed";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // State management
  const [notes, setNotes] = useState<Note[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("notes");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTodoFilter, setSelectedTodoFilter] =
    useState<TodoFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [openMenuNoteId, setOpenMenuNoteId] = useState<string | null>(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [openSubmenuNoteId, setOpenSubmenuNoteId] = useState<string | null>(
    null,
  );
  const [showCreateTodoModal, setShowCreateTodoModal] = useState(false);

  // Fetch notes, todos and folders
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch notes, folders, and todos in parallel
      const [notesResponse, foldersResponse, todosResponse] = await Promise.all(
        [noteApi.getNotes(), folderApi.getFolders(), todoApi.getAllTodos()],
      );

      setNotes(notesResponse.data);
      setFolders(foldersResponse.data);
      setTodos(todosResponse.data);
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

  // Filter notes based on folder and search query
  const filteredNotes = notes.filter((note) => {
    const matchesFolder =
      selectedFolder === null || note.folderId === selectedFolder;
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFolder && matchesSearch;
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return diffMinutes > 0 ? `${diffMinutes}m ago` : "just now";
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    if (window.confirm("Are you sure you want to delete this todo?")) {
      try {
        await todoApi.deleteTodo(todoId);
        setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== todoId));
      } catch (err) {
        console.error("Failed to delete todo:", err);
        alert("Failed to delete the todo. Please try again.");
      }
    }
  };

  const handleCreateTodo = () => {
    setShowCreateTodoModal(true);
    console.log("Create todo clicked");
  };

  const handleCompletedChange = async (todoId: string) => {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;
    const newCompleted = !todo.completed;

    await todoApi.updateTodo(todoId, undefined, newCompleted);
    setTodos((prevTodos) =>
      prevTodos.map((t) =>
        t.id === todoId ? { ...t, completed: newCompleted } : t,
      ),
    );
  };
  const handleFilteredTodos = todos.filter((todo) => {
    switch (selectedTodoFilter) {
      case "all":
        return true;
      case "today":
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todoDate = new Date(todo.createdAt);
        todoDate.setHours(0, 0, 0, 0);
        return todoDate.getTime() === today.getTime();
      case "completed":
        return todo.completed;
      default:
        return true;
    }
  });
  return (
    <div className="dashboard-wrapper">
      {/* Top Navigation Bar */}
      <div className="dashboard-navbar">
        <h1>Stillpage</h1>
        <div className="navbar-right">
          <span>{user?.name}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-content">
        {/* Left Sidebar */}
        <div className="dashboard-sidebar">
          {/* Notes Sidebar - Folders */}
          {activeTab === "notes" && (
            <>
              <div className="sidebar-header">
                <h2 className="sidebar-title">Folders</h2>
                <button className="add-folder-btn" onClick={handleCreateFolder}>
                  +
                </button>
              </div>

              {/* All Notes Folder */}
              <button
                onClick={() => setSelectedFolder(null)}
                className={`folder-btn ${selectedFolder === null ? "active" : ""}`}
              >
                <span>All notes</span>
                <span className="folder-count">{notes.length}</span>
              </button>

              {/* Folder List */}
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`folder-btn ${selectedFolder === folder.id ? "active" : ""}`}
                >
                  <span>{folder.name}</span>
                  <span className="folder-count">
                    {notes.filter((note) => note.folderId === folder.id).length}
                  </span>
                </button>
              ))}
            </>
          )}

          {/* Todos Sidebar - Filters */}
          {activeTab === "todos" && (
            <>
              <div className="sidebar-header">
                <h2 className="sidebar-title">Todos</h2>
              </div>

              {/* All Todos Button */}
              <button
                onClick={() => setSelectedTodoFilter("all")}
                className={`todo-filter-btn ${selectedTodoFilter === "all" ? "active" : ""}`}
              >
                <span>All todos</span>
                <span className="filter-count">{todos.length}</span>
              </button>

              {/* Today Button */}
              <button
                onClick={() => setSelectedTodoFilter("today")}
                className={`todo-filter-btn ${selectedTodoFilter === "today" ? "active" : ""}`}
              >
                <span>Today</span>
                <span className="filter-count">
                  {
                    todos.filter((todo) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const todoDate = new Date(todo.createdAt);
                      todoDate.setHours(0, 0, 0, 0);
                      return todoDate.getTime() === today.getTime();
                    }).length
                  }
                </span>
              </button>

              {/* Completed Button */}
              <button
                onClick={() => setSelectedTodoFilter("completed")}
                className={`todo-filter-btn ${selectedTodoFilter === "completed" ? "active" : ""}`}
              >
                <span>Completed</span>
                <span className="filter-count">
                  {todos.filter((todo) => todo.completed).length}
                </span>
              </button>
            </>
          )}
        </div>

        {/* Right Content Area */}
        <div className="dashboard-main">
          {/* Header with Tabs and Search */}
          <div className="dashboard-header-bar">
            <div className="header-top">
              {/* Tabs */}
              <div className="tabs-container">
                {(["notes", "todos", "review"] as TabType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`tab-button ${activeTab === tab ? "active" : ""}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Search Bar and User Profile */}
              <div className="search-bar-container">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button className="profile-button">W</button>
              </div>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === "notes" && (
            <div className="notes-container">
              {isLoading ? (
                <div className="notes-loading">
                  <p>Loading notes...</p>
                </div>
              ) : error ? (
                <div className="notes-error">
                  <p>{error}</p>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="notes-empty">
                  <p>No notes found</p>
                </div>
              ) : (
                <div className="notes-grid">
                  {filteredNotes.map((note) => (
                    <div key={note.id} className="note-card">
                      {/* Header with Title and Menu */}
                      <div className="note-card-header">
                        <h3 className="note-title">{note.title}</h3>
                        <div className="note-menu-container">
                          <button
                            className="note-menu-btn"
                            onClick={(e) => handleMenuToggle(note.id, e)}
                          >
                            ⋮
                          </button>
                          {/* Dropdown Menu */}
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
                                    {/* "None" option - removes from folder */}
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

                                    {/* Folder options */}
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

                      {/* Preview */}
                      <p className="note-preview">
                        {note.content.replace(/<[^>]*>/g, "")}
                      </p>

                      {/* Footer */}
                      <div className="note-footer">
                        <span className="note-date">
                          {formatDate(note.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* New Note Button */}
                  <button
                    className="new-note-button"
                    onClick={handleCreateNote}
                  >
                    <span className="new-note-text">+ New note</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Todos View */}
          {activeTab === "todos" && (
            <div className="todos-container">
              {isLoading ? (
                <div className="todos-loading">
                  <p>Loading todos...</p>
                </div>
              ) : error ? (
                <div className="todos-error">
                  <p>{error}</p>
                </div>
              ) : handleFilteredTodos.length === 0 ? (
                <div className="todos-empty">
                  <p>No todos yet. Create one to get started!</p>
                </div>
              ) : (
                <div className="todos-list">
                  {handleFilteredTodos.map((todo) => (
                    <div key={todo.id} className="todo-item">
                      <div className="todo-content">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => {
                            handleCompletedChange(todo.id);
                          }}
                          className="todo-checkbox"
                        />
                        <div className="todo-text-wrapper">
                          <div
                            className={`todo-title ${todo.completed ? "completed" : ""}`}
                          >
                            {todo.content}
                          </div>
                        </div>
                      </div>
                      <div className="todo-actions">
                        <span className="todo-date">
                          {formatDate(todo.createdAt)}
                        </span>
                        <button
                          className="todo-delete-btn"
                          onClick={() => {
                            handleDeleteTodo(todo.id);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* New Todo Button - Fixed at bottom */}
              <button className="new-todo-button" onClick={handleCreateTodo}>
                + New todo
              </button>
            </div>
          )}

          {/* Review View */}
          {activeTab === "review" && (
            <div className="review-container">
              <p>Review section coming soon</p>
            </div>
          )}
        </div>
      </div>
      {/* Create todo Modal */}
      <CreateTodo
        isOpen={showCreateTodoModal}
        onClose={() => setShowCreateTodoModal(false)}
        onSave={() => {
          setShowCreateTodoModal(false);
          fetchData();
        }}
      />

      {/* Create/Edit Note Modal */}
      <CreateNote
        isOpen={showModal}
        selectedFolder={selectedFolder}
        onClose={() => setShowModal(false)}
        onSave={() => {
          setShowModal(false);
          setEditingNote(null);
          fetchData();
        }}
        note={editingNote || undefined}
      />

      {/* Create Folder Modal */}
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
