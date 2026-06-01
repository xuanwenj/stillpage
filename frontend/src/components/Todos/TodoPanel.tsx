import { todoApi } from "../../api/client";
import type { Todo } from "../../types";
import { TodoItem } from "./TodoItem";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";

interface TodoPanelProps {
  isLoading: boolean;
  todayTodos: Todo[];
  upcomingTodos: Todo[];
  onTodoCompleted: (todoId: string) => void;
  onTodoDeleted: (todoId: string) => void;
  onCreateTodayTodo: () => void;
  onCreateUpcomingTodo: () => void;
  onRefresh: () => void;
}

function DraggableTodo({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

function DroppableArea({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef}>{children}</div>;
}

export const TodoPanel = ({
  isLoading,
  todayTodos,
  upcomingTodos,
  onTodoCompleted,
  onTodoDeleted,
  onCreateTodayTodo,
  onCreateUpcomingTodo,
  onRefresh,
}: TodoPanelProps) => {
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (!over) return;

    const todoId = active.id;
    const newStatus = over.id as "today" | "upcoming";

    await todoApi.updateTodo(todoId, undefined, undefined, newStatus);
    onRefresh();
  };
  return (
    <div className="panel">
      <h2 className="panel-label">TODOS</h2>
      {isLoading ? (
        <p className="panel-empty">Loading...</p>
      ) : (
        <DndContext onDragEnd={handleDragEnd}>
          <>
            {/* Today Section */}
            <DroppableArea id="today">
              <div className="todo-section">
                <h3 className="todo-section-label">Today</h3>
                {todayTodos.length > 0 ? (
                  todayTodos.map((todo) => (
                    <DraggableTodo key={todo.id} id={todo.id}>
                      <TodoItem
                        todo={todo}
                        onCompleted={onTodoCompleted}
                        onDelete={onTodoDeleted}
                        showCheckbox={true}
                      />
                    </DraggableTodo>
                  ))
                ) : (
                  <p className="panel-empty">No todos for today</p>
                )}
                {!isLoading && (
                  <button
                    className="new-item-button"
                    onClick={onCreateTodayTodo}
                  >
                    + New todo
                  </button>
                )}
              </div>
            </DroppableArea>
            {/* Upcoming Section */}
            <DroppableArea id="upcoming">
              <div className="todo-section">
                <h3 className="todo-section-label">Upcoming</h3>
                {upcomingTodos.length === 0 ? (
                  <p className="panel-empty">Nothing upcoming</p>
                ) : (
                  upcomingTodos.map((todo) => (
                    <DraggableTodo key={todo.id} id={todo.id}>
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onCompleted={onTodoCompleted}
                        onDelete={onTodoDeleted}
                        showCheckbox={false}
                      />
                    </DraggableTodo>
                  ))
                )}
                {!isLoading && (
                  <button
                    className="new-item-button"
                    onClick={onCreateUpcomingTodo}
                  >
                    + New todo
                  </button>
                )}
              </div>
            </DroppableArea>
          </>
        </DndContext>
      )}
    </div>
  );
};
