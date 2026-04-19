import { useState } from "react";
import { todoApi } from "../api/client";

interface CreateTodoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
}

export const CreateTodo = ({ isOpen, onClose, onSave }: CreateTodoProps) => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!content.trim()) {
      setError("Todo content cannot be empty");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await todoApi.createTodo(content);
      setContent("");
      onSave(content);
      onClose();
    } catch (err) {
      console.error("Failed to create todo:", err);
      setError("Failed to create todo. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setContent("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Create Todo</h2>

        {error && <div className="modal-error">{error}</div>}

        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What do you want to do?"
          className="modal-input"
          disabled={isLoading}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !isLoading) {
              handleSave();
            }
          }}
        />

        <div className="modal-buttons">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="modal-save-btn"
          >
            {isLoading ? "Creating..." : "Create"}
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="modal-cancel-btn"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
