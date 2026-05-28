import { useState, useEffect } from "react";
import { todoApi, brainDumpApi } from "../api/client";
import { CreateTodo } from "../components/CreateTodo";
import type { Todo, BrainDump } from "../types";
import { useToast, useConfirm } from "../toast";
import { FocusTimer } from "../components/FocusTimer";

export const DailyPage = () => {
  const toast = useToast();
  const confirm = useConfirm();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTodoModal, setShowCreateTodoModal] = useState(false);
  const [brainDump, setBrainDump] = useState<BrainDump | null>(null);
  const [brainDumpContent, setBrainDumpContent] = useState("");
  const [brainDumpSaving, setBrainDumpSaving] = useState(false);
  const [clockTime, setClockTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  });
  const [clockDay, setClockDay] = useState(() =>
    new Date().toLocaleDateString("en-US", { weekday: "long" }),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setClockTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
      setClockDay(now.toLocaleDateString("en-US", { weekday: "long" }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch todos and brain dump data
  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch todos and brain dump in parallel
      const [todosResponse, brainDumpResponse] = await Promise.all([
        todoApi.getAllTodos(),
        brainDumpApi.get(),
      ]);

      setTodos(todosResponse.data);
      setBrainDump(brainDumpResponse.data.entry);
      setBrainDumpContent(brainDumpResponse.data.entry?.content ?? "");
    } catch (err) {
      console.error("Failed to fetch data:", err);
      toast.error("Failed to load your data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteTodo = async (todoId: string) => {
    const ok = await confirm({
      title: "Delete Todo",
      message: "Are you sure you want to delete this todo?",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (ok) {
      try {
        await todoApi.deleteTodo(todoId);
        setTodos((prev) => prev.filter((t) => t.id !== todoId));
        toast.success("Todo deleted.");
      } catch (err) {
        console.error("Failed to delete todo:", err);
        toast.error("Failed to delete the todo. Please try again.");
      }
    }
  };

  const handleCreateTodo = () => {
    setShowCreateTodoModal(true);
  };

  const handleCompletedChange = async (todoId: string) => {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;
    const newCompleted = !todo.completed;
    await todoApi.updateTodo(todoId, undefined, newCompleted);
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todoId ? { ...t, completed: newCompleted } : t,
      ),
    );
  };

  const handleBrainDumpBlur = async () => {
    const saved = brainDump?.content ?? "";
    if (brainDumpContent === saved) return;
    setBrainDumpSaving(true);
    try {
      const res = await brainDumpApi.upsert(brainDumpContent);
      setBrainDump(res.data.entry);
    } catch (err) {
      console.error("Failed to save brain dump:", err);
    } finally {
      setBrainDumpSaving(false);
    }
  };

  const todayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayTodos = todos.filter((t) => t.date === todayString());
  const pendingTodos = todos.filter(
    (t) => t.date !== todayString() && !t.completed,
  );

  return (
    <div className="dashboard-main">
      {/* Brain Dump Column */}
      <div className="notes-column">
        {/* Brain Dump */}
        <div className="panel brain-dump-panel">
          <div className="brain-dump-header">
            <h2 className="panel-label">Brain Dump</h2>
            {brainDumpSaving && (
              <span className="brain-dump-saving">saving…</span>
            )}
          </div>
          <textarea
            className="brain-dump-textarea"
            placeholder="Quick capture, no need to organise..."
            value={brainDumpContent}
            onChange={(e) => setBrainDumpContent(e.target.value)}
            onBlur={handleBrainDumpBlur}
          />
        </div>
      </div>

      {/* Todos Panel */}
      <div className="panel">
        <h2 className="panel-label">TODOS</h2>
        {isLoading ? (
          <p className="panel-empty">Loading...</p>
        ) : (
          <>
            {todayTodos.length > 0 && (
              <div className="todo-section">
                <h3 className="todo-section-label">Today</h3>
                {todayTodos.map((todo) => (
                  <div key={todo.id} className="todo-item">
                    <div className="todo-content">
                      <button
                        className={`todo-circle-btn ${todo.completed ? "checked" : ""}`}
                        onClick={() => handleCompletedChange(todo.id)}
                        aria-label={
                          todo.completed ? "Mark incomplete" : "Mark complete"
                        }
                      >
                        {todo.completed ? (
                          <svg
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle cx="10" cy="10" r="10" />
                            <path
                              d="M6 10.5l2.5 2.5 5.5-5.5"
                              stroke="white"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              fill="none"
                            />
                          </svg>
                        ) : (
                          <svg
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle
                              cx="10"
                              cy="10"
                              r="9"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                          </svg>
                        )}
                      </button>
                      <span
                        className={`todo-title ${todo.completed ? "completed" : ""}`}
                      >
                        {todo.content}
                      </span>
                    </div>
                    <div className="todo-actions">
                      <button
                        className="todo-delete-btn"
                        onClick={() => handleDeleteTodo(todo.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="todo-section">
              {!isLoading && (
                <button className="new-item-button" onClick={handleCreateTodo}>
                  + New todo
                </button>
              )}
              <h3 className="todo-section-label">Upcoming</h3>
              {pendingTodos.length === 0 ? (
                <p className="panel-empty">Nothing upcoming</p>
              ) : (
                pendingTodos.map((todo) => (
                  <div key={todo.id} className="todo-item">
                    <div className="todo-content">
                      <span className="todo-title">{todo.content}</span>
                    </div>
                    <div className="todo-actions">
                      <button
                        className="todo-delete-btn"
                        onClick={() => handleDeleteTodo(todo.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {todayTodos.length === 0 && (
              <p className="panel-empty">No todos for today</p>
            )}
          </>
        )}
      </div>

      {/* Right Panel */}
      <div className="right-panel">
        {/* Clock */}
        <div className="clock-card">
          <div className="clock-time">{clockTime}</div>
          <div className="clock-day">{clockDay}</div>
        </div>
        <div className="timer-card"></div>
        <p className="focus-timer">Focus</p>
        <FocusTimer />
      </div>

      {/* Modals */}
      <CreateTodo
        isOpen={showCreateTodoModal}
        onClose={() => setShowCreateTodoModal(false)}
        onSave={() => {
          setShowCreateTodoModal(false);
          fetchData();
        }}
      />
    </div>
  );
};
