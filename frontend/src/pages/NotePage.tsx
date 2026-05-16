import { useState, useEffect } from "react";
import { noteApi, folderApi } from "../api/client";
import { NoteEditor } from "../components/NoteEditor";
import type { Note, Folder } from "../types";
import { useToast, useConfirm } from "../toast";

export const NotePage = () => {
  const toast = useToast();
  const confirm = useConfirm();

  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingContent, setEditingContent] = useState("");

  // Fetch notes and folders on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [notesResponse, foldersResponse] = await Promise.all([
          noteApi.getNotes(),
          folderApi.getFolders(),
        ]);
        setNotes(notesResponse.data);
        setFolders(foldersResponse.data);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        toast.error("Failed to load notes. Please try again.");
      }
    };
    fetchData();
  }, []);

  // Update editing state when selected note changes
  useEffect(() => {
    if (selectedNoteId) {
      const note = notes.find((n) => n.id === selectedNoteId);
      if (note) {
        setEditingTitle(note.title);
        setEditingContent(note.content);
      }
    }
  }, [selectedNoteId, notes]);

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
        setNotes(notes.filter((note) => note.id !== noteId));
        setSelectedNoteId(null);
        toast.success("Note deleted.");
      } catch (err) {
        console.error("Failed to delete note:", err);
        toast.error("Failed to delete the note. Please try again.");
      }
    }
  };

  const handleMoveNoteToFolder = async (
    noteId: string,
    folderId: string | null,
  ) => {
    try {
      await noteApi.moveNoteToFolder(noteId, folderId);
      setNotes(
        notes.map((note) =>
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

  const handleSaveNote = async () => {
    if (!selectedNoteId) return;

    const note = notes.find((n) => n.id === selectedNoteId);
    if (!note) return;

    try {
      await noteApi.updateNote(
        selectedNoteId,
        editingTitle,
        editingContent,
        note.folderId,
        note.tags,
        note.videoUrl,
        note.videoItems,
      );

      // Update the notes in state
      setNotes(
        notes.map((n) =>
          n.id === selectedNoteId
            ? { ...n, title: editingTitle, content: editingContent }
            : n,
        ),
      );
    } catch (err) {
      console.error("Failed to autosave note:", err);
    }
  };

  return (
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
            const folderNotes = notes.filter((n) => n.folderId === folder.id);
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
                    ? note.content.replace(/<[^>]*>/g, "").substring(0, 100)
                    : note.videoUrl
                      ? `📹 ${note.videoUrl}`
                      : "(No content)"}
                </p>
              </div>
            ))}
        </div>
      </div>

      <div className="note-detail-panel">
        {selectedNoteId && notes.find((n) => n.id === selectedNoteId) ? (
          (() => {
            const note = notes.find((n) => n.id === selectedNoteId)!;
            return (
              <div className="note-detail-editor-wrapper">
                <NoteEditor
                  key={note.id}
                  note={note}
                  onTitleChange={setEditingTitle}
                  onContentChange={setEditingContent}
                  onSave={handleSaveNote}
                  initialTitle={editingTitle}
                />
                <div className="note-detail-actions">
                  <button
                    className="note-detail-action-btn"
                    onClick={() => handleMoveNoteToFolder(note.id, null)}
                  >
                    Move to Inbox
                  </button>
                  <button
                    className="note-detail-action-btn danger"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="note-detail-empty">
            <p>Select a note to view and edit</p>
          </div>
        )}
      </div>
    </div>
  );
};
