import { useDraggable } from "@dnd-kit/core";
import type { Todo } from "../../../types";

interface TodoItemWrapperProps {
  todo: Todo;
  children: (dragHandleProps: any) => React.ReactNode;
}
export function TodoItemWrapper({ todo, children }: TodoItemWrapperProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: todo.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners })}
    </div>
  );
}
