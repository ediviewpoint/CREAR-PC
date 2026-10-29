"use client";
import { Children, isValidElement, type ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
function Item({ id, children }: { id: string; children: ReactNode }) {
  const { setNodeRef, setActivatorNodeRef, transform, transition, attributes, listeners } =
    useSortable({ id });
  return (
    <div
      className="elite-sortable-item"
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label="Arrastrar para reordenar"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={15} />
      </button>
      <div>{children}</div>
    </div>
  );
}
export function Reordenable({
  children,
  onMove,
}: {
  children: ReactNode;
  onMove: (from: number, to: number) => void;
}) {
  const list = Children.toArray(children);
  const ids = list.map((child, index) =>
    String(isValidElement(child) ? (child.key ?? index) : index),
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id)
          onMove(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {list.map((child, index) => (
          <Item key={ids[index]} id={ids[index]!}>
            {child}
          </Item>
        ))}
      </SortableContext>
    </DndContext>
  );
}
