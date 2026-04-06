import { useState } from "react";
import { noteApi } from "../api/client";

interface CreateNoteProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const CreateNote = ({ isOpen, onClose, onSave }: CreateNoteProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!title.trim()) {
        setError("Title is required");
        return;
      }

      await noteApi.createNote(title, content);

      // Clear form
      setTitle("");
      setContent("");

      // Call parent callback to refresh notes
      onSave();
    } catch (err) {
      console.error("Failed to create note:", err);
      setError("Failed to create note. Please try again.");
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
          <h2>Create New Note</h2>
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
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};
