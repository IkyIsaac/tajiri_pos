"use client";
import React from "react";
import { Table } from "@tanstack/react-table";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "./../tremor/Popover";
import { Button } from "./../tremor/Button";
import { Checkbox } from "./../tremor/Checkbox";
import { Label } from "./../tremor/Label";
import { RiEqualizer2Line, RiDraggable } from "@remixicon/react";
import { cn } from "./../lib/utilsTremor";

/* ---- DND-KIT ---- */
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ViewOptionsProps<TData> {
  table: Table<TData>;
}

/** -------- Single Row Component for DnD + Checkbox ---------- */
function SortableColumnOption({
  column,
  toggle,
}: {
  column: any;
  toggle: (id: string, visible: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const displayName =
    (column.columnDef.meta as { displayName?: string })?.displayName ??
    column.id;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={style}
      className={cn(
        "flex items-center justify-between gap-1 py-1 px-1 rounded-md hover:bg-gray-50 select-none",
        isDragging && "opacity-70"
      )}
    >
      <div className="flex items-center gap-2">
        <Checkbox
          checked={column.getIsVisible()}
          onCheckedChange={(checked) => toggle(column.id, Boolean(checked))}
        />
        <span className="text-sm truncate max-w-[140px]">{displayName}</span>
      </div>

      {/* only this button starts the drag */}
      <DragHandle listeners={listeners} />
    </div>
  );
}

// Small reusable handle
function DragHandle({ listeners }: { listeners: any }) {
  return (
    <button
      type="button"
      {...listeners}
      className="cursor-grab p-1 rounded hover:bg-gray-100"
      onClick={(e) => e.preventDefault()}
    >
      <RiDraggable className="size-4 text-gray-400" />
    </button>
  );
}

/** -------- Popover View Options ---------- */
export function ViewOptions<TData>({ table }: ViewOptionsProps<TData>) {
  const [open, setOpen] = React.useState(false);
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);

  // sensors for mouse / touch / keyboard
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor)
  );

  /** keep the list synced to the table */
  React.useEffect(() => {
    const cols = table.getAllLeafColumns();
    if (!cols || cols.length === 0) return;

    setColumnOrder((prev) => {
      const next = cols.map((c) => c.id);
      return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
    });
  }, [table.getAllLeafColumns().length]);

  /** toggle visibility (controlled table) */
  const toggle = (id: string, visible: boolean) => {
    const state = table.getState().columnVisibility;
    const next = { ...state, [id]: visible };
    table.options.onColumnVisibilityChange?.(next);
  };

  /** Drag completed -> reorder */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const oldIndex = columnOrder.indexOf(active.id as string);
    const newIndex = columnOrder.indexOf(over.id as string);
    const next = arrayMove(columnOrder, oldIndex, newIndex);

    setColumnOrder(next);
    table.setColumnOrder(next);
  };

  /** ordered column refs */
  const orderedColumns = columnOrder
    .map((id) => table.getAllLeafColumns().find((c) => c.id === id))
    .filter(Boolean);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className="hidden lg:flex gap-x-2 px-2 py-1.5 text-sm sm:text-xs"
        >
          <RiEqualizer2Line className="size-4" />
          View
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={6}
        forceMount
        className="z-50 w-64 p-3 space-y-2 border bg-white shadow-md rounded-md"
      >
        <Label className="text-sm font-semibold">Visible columns</Label>

        {orderedColumns.length === 0 ? (
          <div className="text-muted-foreground text-sm py-4 text-center">
            No columns detected…
          </div>
        ) : (
          <div className="flex flex-col gap-1 max-h-[260px] overflow-y-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={columnOrder}
                strategy={verticalListSortingStrategy}
              >
                {orderedColumns.map((col) => (
                  <SortableColumnOption
                    key={col!.id}
                    column={col!}
                    toggle={toggle}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}

        <Button
          variant="secondary"
          className="w-full mt-2 text-sm"
          onClick={() => {
            const next = table
              .getAllLeafColumns()
              .reduce<
                Record<string, boolean>
              >((acc, c) => ({ ...acc, [c.id]: true }), {});
            table.setColumnVisibility(next);
          }}
        >
          Show All
        </Button>
      </PopoverContent>
    </Popover>
  );
}
