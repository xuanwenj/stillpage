import { useState, useEffect, KeyboardEvent } from "react";
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
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = !!note;

  // Pre-fill form when editing
  useEffect(() => {
    if (isOpen && note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags ?? []);
      setTagInput("");
    } else if (isOpen) {
      setTitle("");
      setContent("");
      setTags([]);
      setTagInput("");
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
        await noteApi.updateNote(note.id, title, content, selectedFolder, tags);
      } else {
        await noteApi.createNote(title, content, selectedFolder, tags);
      }

      // Clear form
      setTitle("");
      setContent("");
      setTags([]);
      setTagInput("");

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
    setTags([]);
    setTagInput("");
    setError(null);
    onClose();
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = tagInput.trim().replace(/,$/, "");
      if (!trimmed) return;
      if (tags.length >= 3) {
        setError("Maximum 3 tags allowed");
        return;
      }
      if (tags.includes(trimmed)) {
        setTagInput("");
        return;
      }
      setTags([...tags, trimmed]);
      setTagInput("");
      setError(null);
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
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

          {/* Tag Input */}
          <div className="tag-selector">
            <span className="tag-selector-label">Tags (max 3)</span>
            <div className="tag-input-wrapper">
              {tags.map((tag, i) => (
                <span key={i} className="tag-pill tag-pill-active">
                  {tag}
                  <button
                    type="button"
                    className="tag-pill-remove"
                    onClick={() => removeTag(i)}
                    disabled={isLoading}
                  >
                    ✕
                  </button>
                </span>
              ))}
              {tags.length < 3 && (
                <input
                  type="text"
                  className="tag-input"
                  placeholder={
                    tags.length === 0
                      ? "Add a tag, press Enter..."
                      : "Add another..."
                  }
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  disabled={isLoading}
                />
              )}
            </div>
          </div>
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
