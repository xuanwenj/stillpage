import { useState, useEffect } from "react";
import { folderApi } from "../api/client";

interface CreateFolderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const CreateFolder = ({
  isOpen,
  onClose,
  onSave,
}: CreateFolderProps) => {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setError(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!name.trim()) {
        setError("Folder name is required");
        return;
      }

      // Create new folder
      await folderApi.createFolder(name.trim());

      // Clear form
      setName("");

      // Call parent callback to refresh folders
      onSave();
    } catch (err) {
      console.error("Failed to create folder:", err);
      setError("Failed to create folder. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>Create New Folder</h2>
          <button className="modal-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}

          <input
            type="text"
            placeholder="Folder name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="note-input-title"
            disabled={isLoading}
            autoFocus
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
            {isLoading ? "Creating..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};
