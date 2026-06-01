import { CheckedIcon, UncheckedIcon } from "./TodoIcons";
import type { Todo } from "../../types";

interface TodoItemProps {
  todo: Todo;
  onCompleted: (todoId: string) => void; //callback function
  onDelete: (todoId: string) => void;
  showCheckbox?: boolean;
}

export const TodoItem = ({
  todo,
  onCompleted,
  onDelete,
  showCheckbox = true,
}: TodoItemProps) => {
  return (
    <div className="todo-item">
      <div className="todo-content">
        {showCheckbox && (
          <button
            className={`todo-circle-btn ${todo.completed ? "checked" : ""}`}
            onClick={() => {
              onCompleted(todo.id);
            }}
            aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
          >
            {todo.completed ? <CheckedIcon /> : <UncheckedIcon />}
          </button>
        )}
        <span className={`todo-title ${todo.completed ? "completed" : ""}`}>
          {todo.content}
        </span>
      </div>
      <div className="todo-actions">
        <button
          className="todo-delete-btn"
          onClick={() => {
            onDelete(todo.id);
            console.log("Delete button clicked for todo:", todo.id);
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};
