import { todoApi } from "../../api/client";
import type { Todo } from "../../types";
import { TodoItem } from "./TodoItem";
import { DndContext, useDroppable } from "@dnd-kit/core";
import { TodoItemWrapper } from "./TodoTools/TodoItemWrapper";

interface TodoPanelProps {
  isLoading: boolean;
  todayTodos: Todo[];
  upcomingTodos: Todo[];
  onTodoCompleted: (todoId: string) => void;
  onTodoDeleted: (todoId: string) => void;
  onCreateTodayTodo: () => void;
  onCreateUpcomingTodo: () => void;
  onRefresh: () => void;
  onDragged: (todoId: string) => void;
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
  onDragged,
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
                    <TodoItemWrapper key={todo.id} todo={todo}>
                      {(dragHandleProps) => (
                        <TodoItem
                          todo={todo}
                          onCompleted={onTodoCompleted}
                          onDelete={onTodoDeleted}
                          showCheckbox={true}
                          onDragged={onDragged}
                          dragHandleProps={dragHandleProps}
                        />
                      )}
                    </TodoItemWrapper>
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
                    <TodoItemWrapper key={todo.id} todo={todo}>
                      {(dragHandleProps) => (
                        <TodoItem
                          todo={todo}
                          onCompleted={onTodoCompleted}
                          onDelete={onTodoDeleted}
                          showCheckbox={true}
                          onDragged={onDragged}
                          dragHandleProps={dragHandleProps}
                        />
                      )}
                    </TodoItemWrapper>
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
