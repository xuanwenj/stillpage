import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { noteApi, folderApi } from "../api/client";
import { CreateNote } from "../components/CreateNote";
import type { Note, Folder } from "../types";

type TabType = "notes" | "todos" | "review";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // State management
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("notes");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Fetch notes and folders
  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch notes and folders in parallel
      const [notesResponse, foldersResponse] = await Promise.all([
        noteApi.getNotes(),
        folderApi.getFolders(),
      ]);

      setNotes(notesResponse.data);
      setFolders(foldersResponse.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load your notes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchNotes();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCreateNote = () => {
    setShowModal(true);
    console.log("Create note clicked");
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
        {/* Left Sidebar - Folders */}
        <div className="dashboard-sidebar">
          <h2 className="sidebar-title">Folders</h2>

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

          {/* Notes Grid */}
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
                    {/* Title */}
                    <h3 className="note-title">{note.title}</h3>

                    {/* Preview */}
                    <p className="note-preview">
                      {note.content.replace(/<[^>]*>/g, "")}
                    </p>

                    {/* Footer */}
                    <div className="note-footer">
                      <span className="note-date">
                        {formatDate(note.createdAt)}
                      </span>
                      <span className="note-todos">0 todos</span>
                    </div>
                  </div>
                ))}

                {/* New Note Button */}
                <button className="new-note-button" onClick={handleCreateNote}>
                  <span className="new-note-text">+ New note</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Note Modal */}
      <CreateNote
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={() => {
          setShowModal(false);
          fetchNotes();
        }}
      />
    </div>
  );
};
