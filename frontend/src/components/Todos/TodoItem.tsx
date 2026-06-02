import { CheckedIcon, UncheckedIcon } from "./TodoTools/TodoIcons";
import type { Todo } from "../../types";

interface TodoItemProps {
  todo: Todo;
  onCompleted: (todoId: string) => void; //callback function
  onDelete: (todoId: string) => void;
  showCheckbox?: boolean;
  dragHandleProps: any;
}

export const TodoItem = ({
  todo,
  onCompleted,
  onDelete,
  showCheckbox = true,
  dragHandleProps,
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
          }}
        >
          ✕
        </button>
        <button
          className="todo-drag-btn"
          {...dragHandleProps.attributes}
          {...dragHandleProps.listeners}
        >
          ≡
        </button>
      </div>
    </div>
  );
};
