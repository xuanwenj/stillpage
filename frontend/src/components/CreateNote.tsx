import { useState, useEffect } from "react";
import { noteApi } from "../api/client";
import type { Note } from "../types";

interface CreateNoteProps {
  isOpen: boolean;
  selectedFolder: string | null;
  onClose: () => void;
  onSave: () => void;
  note?: Note; // Optional - if provided, we're in edit mode
}

export const CreateNote = ({
  isOpen,
  selectedFolder,
  onClose,
  onSave,
  note,
}: CreateNoteProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = !!note;

  // Pre-fill form when editing
  useEffect(() => {
    if (isOpen && note) {
      setTitle(note.title);
      setContent(note.content);
    } else if (isOpen) {
      // Clear form for create mode
      setTitle("");
      setContent("");
    }
  }, [isOpen, note]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!title.trim()) {
        setError("Title is required");
        return;
      }

      if (isEditMode && note) {
        // Edit mode - update existing note
        await noteApi.updateNote(note.id, title, content, selectedFolder);
      } else {
        // Create mode - create new note
        await noteApi.createNote(title, content, selectedFolder);
      }

      // Clear form
      setTitle("");
      setContent("");

      // Call parent callback to refresh notes
      onSave();
    } catch (err) {
      console.error("Failed to save note:", err);
      setError("Failed to save note. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setContent("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>{isEditMode ? "Edit Note" : "Create New Note"}</h2>
          <button className="modal-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}

          <input
            type="text"
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="note-input-title"
            disabled={isLoading}
          />

          <textarea
            placeholder="Note content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="note-input-content"
            disabled={isLoading}
          />
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            onClick={handleClose}
            className="modal-button modal-button-cancel"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="modal-button modal-button-save"
            disabled={isLoading}
          >
            {isLoading
              ? isEditMode
                ? "Updating..."
                : "Saving..."
              : isEditMode
                ? "Update"
                : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};
