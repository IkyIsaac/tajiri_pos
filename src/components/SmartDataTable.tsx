"use client";

import * as React from "react";

import { getCycleColumns } from "./../components/ui/data-table/columns";
import { Filterbar } from "./../components/ui/data-table/DataTableFilterbar";
import { Table as ReactTable } from "@tanstack/react-table";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
} from "@tabler/icons-react";
import {
  CellContext,
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  RowSelectionState,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { boolean, z } from "zod";

import { Badge } from "./../components/ui/badge";
import { Button } from "./../components/ui/button";
import { Checkbox } from "./../components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./../components/ui/dropdown-menu";
import { Label } from "./../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./../components/ui/table";
import { TooltipTrigger, Tooltip, TooltipContent } from "./../components/ui/tooltip";
import { matchFilter } from "./tables/generateFilters";

export const schema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
});

// Drag handle component
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({ id });
  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

// Draggable row
function DraggableRow<T extends { id: any }>({ row }: { row: Row<T> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 hover:bg-gray-50 "
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          className="max-w-[200px] px-2 py-2  truncate whitespace-nowrap overflow-hidden text-ellipsis"
        >
          {(() => {
            const content = flexRender(
              cell.column.columnDef.cell,
              cell.getContext()
            );

            // console.log("📦 Row data:", row.original);
            // console.log(
            //   "📦 Visible cells in row:",
            //   row.getVisibleCells().map((c) => c.column.id)
            // );

            // If content is nullish or string "null"/"undefined", return an empty space
            if (
              content === null ||
              content === undefined ||
              content === "null" ||
              content === "undefined"
            ) {
              return " ";
            }

            return typeof content === "string" && content.trim() === ""
              ? " "
              : content;
          })()}
        </TableCell>
      ))}
    </TableRow>
  );
}

export interface DataTableProps<T extends { id: any }> {
  data: T[];
  initialSelectedRowIds?: string[];
  isLoading?: boolean;
  onSelectionChange?: (ids: string[]) => void;
  actionColumn?: {
    visible?: boolean;
    icon?: React.ElementType;
    actions?: {
      view?: {
        onClick: (row: any) => void;
        visible?: boolean;
        icon?: React.ElementType;
        disabled?: boolean;
      };
      edit?: {
        onClick: (row: any) => void;
        visible?: boolean;
        icon?: React.ElementType;
        disabled?: boolean;
      };
      delete?: {
        onClick: (row: any) => void;
        visible?: boolean;
        icon?: React.ElementType;
        disabled?: boolean;
      };
      extras?: (row: T) => {
        label: string;
        icon?: React.ElementType;
        onClick: (row: T) => void;
        variant?: "default" | "destructive";
        disabled?: boolean;
        tooltip?: string;
      }[];
    };
  };
  visibleFilters?: string[];
  customFilters?: Partial<
    Record<
      string,
      {
        type: "search" | "select" | "number" | "date" | "year";
        options?: { label: string; value: string }[];
        dateMode?: "single" | "range";
      }
    >
  >;
  showFilterBar?: boolean;
  message?: string;
  showSelect?: boolean;
  showEdit?: boolean;
  showControls?: boolean;
  onExport?: (rows: T[]) => void;
  showExport?: boolean;
  customRenderers?: Partial<
    Record<keyof T, (ctx: CellContext<T, unknown>) => React.ReactNode>
  >;
  extraColumnsBefore?: ColumnDef<T>[];
  extraColumnsAfter?: ColumnDef<T>[];
  columnOrder?: (keyof T)[];
  hiddenColumns?: (keyof T)[];
}

export function SmartTable<T extends { id: any }>({
  data: initialData,
  isLoading = false,
  initialSelectedRowIds = [],
  showSelect = true,
  showEdit = false,
  showFilterBar = false,
  message,
  onSelectionChange,
  visibleFilters = [],
  customFilters = {},
  actionColumn = { visible: true },
  showControls = true,
  customRenderers = {},
  extraColumnsBefore = [],
  extraColumnsAfter = [],
  columnOrder,
  onExport,
  showExport = true,
  hiddenColumns = [],
}: DataTableProps<T>) {
  const [data, setData] = React.useState(() => initialData);
  React.useEffect(() => {
    // console.log("Syncing data state from initialData");
    setData(initialData);
  }, [initialData]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const lastSelectionRef = React.useRef<string[]>([]);
  // --- column visibility state ---
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );
  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  );
  // console.log(" [DataTable] Received data:", initialData);

  const columns = React.useMemo(() => {
    if (!initialData || initialData.length === 0) return [];

    const mergedRenderers = { ...customRenderers };

    return getCycleColumns({
      data: initialData,
      showSelect,
      showEdit,
      showControls,
      customRenderers: mergedRenderers,
      customFilters: customFilters as Partial<
        Record<
          keyof T,
          {
            type: "search" | "select" | "number";
            options?: { label: string; value: string }[];
          }
        >
      >,
      extraColumnsBefore: [
        ...(showSelect
          ? [
              {
                id: "select",
                header: ({ table }: { table: ReactTable<T> }) => (
                  <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) =>
                      table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label="Select all"
                  />
                ),
                cell: ({ row }: { row: Row<T> }) => (
                  <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                  />
                ),
                enableSorting: false,
                enableHiding: false,
              },
            ]
          : []),
        ...extraColumnsBefore,
      ],
      extraColumnsAfter: [
        ...extraColumnsAfter,
        ...(actionColumn?.visible
          ? [
              {
                id: "actions",
                header: "Actions",
                cell: ({ row }: any) => {
                  const r = row.original;
                  const act = actionColumn?.actions || {};

                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                        >
                          <IconDotsVertical />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-36">
                        {/* --- core built‑ins --- */}
                        {act.view?.visible !== false && (
                          <DropdownMenuItem
                            disabled={!!act.view?.disabled}
                            onClick={() =>
                              !act.view?.disabled && act.view?.onClick(r)
                            }
                          >
                            {act.view?.icon && (
                              <span className="mr-2 text-muted-foreground">
                                {React.createElement(act.view.icon, {
                                  size: 16,
                                })}
                              </span>
                            )}
                            View
                          </DropdownMenuItem>
                        )}

                        {act.edit?.visible !== false && (
                          <DropdownMenuItem
                            disabled={!!act.edit?.disabled}
                            onClick={() =>
                              !act.edit?.disabled && act.edit?.onClick(r)
                            }
                          >
                            Edit
                          </DropdownMenuItem>
                        )}

                        {act.delete?.visible !== false && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={!!act.delete?.disabled}
                              variant="destructive"
                              onClick={() =>
                                !act.delete?.disabled && act.delete?.onClick(r)
                              }
                            >
                              {act.delete?.icon && (
                                <span className="mr-2 text-muted-foreground">
                                  {React.createElement(act.delete.icon, {
                                    size: 16,
                                  })}
                                </span>
                              )}
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}

                        {/* --- extras (with tooltips) --- */}
                        {(() => {
                          const extras =
                            typeof act.extras === "function"
                              ? act.extras(r)
                              : act.extras ?? [];

                          return extras.map((extra) => {
                            const content = (
                              <DropdownMenuItem
                                key={extra.label}
                                disabled={!!extra.disabled}
                                variant={extra.variant}
                                onClick={() =>
                                  !extra.disabled && extra.onClick(r)
                                }
                                className={
                                  extra.disabled
                                    ? "opacity-70 cursor-not-allowed"
                                    : ""
                                }
                              >
                                {extra.icon && (
                                  <span className="mr-2 text-muted-foreground">
                                    {React.createElement(extra.icon, {
                                      size: 16,
                                    })}
                                  </span>
                                )}
                                {extra.label}
                              </DropdownMenuItem>
                            );

                            // If item is disabled and has tooltip text → wrap with tooltip
                            return extra.disabled && extra.tooltip ? (
                              <Tooltip key={extra.label}>
                                <TooltipTrigger asChild>
                                  <span>{content}</span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-700 text-white text-xs">
                                  {extra.tooltip}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              // Normal enabled item
                              <span key={extra.label}>{content}</span>
                            );
                          });
                        })()}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                },
                enableSorting: false,
                enableHiding: false,
              },
            ]
          : []),
      ],
      columnOrder,
      hiddenColumns,
    });
  }, [
    initialData,
    showSelect,
    showEdit,
    showControls,
    customRenderers,
    extraColumnsBefore,
    extraColumnsAfter,
    columnOrder,
    hiddenColumns,
  ]);

  // --- initialize and sync column visibility when columns appear ---
  React.useEffect(() => {
    if (!columns || columns.length === 0) return;

    setColumnVisibility((prev) => {
      const next: VisibilityState = { ...prev };

      columns.forEach((col) => {
        if ("id" in col && col.id && !(col.id in next)) next[col.id] = true;
      });

      hiddenColumns?.forEach((id) => {
        next[id as string] = false;
      });

      Object.keys(next).forEach((id) => {
        if (!columns.find((c) => "id" in c && c.id === id)) delete next[id];
      });

      if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
      return next;
    });
  }, [columns, hiddenColumns]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },

    //  Register your custom MultiSelect filter function
    filterFns: {
      multiSelectIncludes: (row, columnId, filterValues: string[]) => {
        const cellValue = row.getValue(columnId);

        if (!Array.isArray(filterValues) || filterValues.length === 0)
          return true;

        // if cell itself is array (e.g. tags)
        if (Array.isArray(cellValue)) {
          return filterValues.some((filter) =>
            cellValue.some((val) => matchFilter(val, filter))
          );
        }

        // any other value: just compare via stringifyValue
        return filterValues.some((filter) => matchFilter(cellValue, filter));
      },

      // date / range filter
      dateBetween: (row, colId, v) => {
        if (!v) return true;

        const raw = row.getValue(colId);
        const val = raw as string | number | Date;
        const cell = new Date(val);

        if (v instanceof Date) return cell.toDateString() === v.toDateString();

        const { from, to } = v as { from?: Date; to?: Date };
        if (from && to) return cell >= from && cell <= to;
        if (from) return cell >= from;
        return true;
      },

      yearEquals: (row, columnId, filterValue: string | number) => {
        if (!filterValue) return true;
        const raw = row.getValue(columnId) as
          | string
          | number
          | Date
          | undefined;
        if (!raw) return false;
        // const cell = new Date(raw);
        const cellYear = new Date(raw).getFullYear();
        return cellYear === Number(filterValue);
      },
    },

    getFilteredRowModel: getFilteredRowModel(),

    getRowId: (row) => {
      if (typeof row.id !== "undefined") return String(row.id);
      const index = data.findIndex((d) => d === row);
      return `row-${index}`;
    },

    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,

    getCoreRowModel: getCoreRowModel(),
    // getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Notify parent *only when actual change*
  React.useEffect(() => {
    if (!onSelectionChange) return;

    const selectedIds = Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => table.getRowModel().rowsById[key]?.original.id);

    const last = JSON.stringify(lastSelectionRef.current);
    const next = JSON.stringify(selectedIds);

    if (last !== next) {
      lastSelectionRef.current = selectedIds;
      onSelectionChange(selectedIds);
    }
  }, [rowSelection]);

  // Preselect rows, but only run when ids actually change
  React.useEffect(() => {
    if (!initialSelectedRowIds.length) {
      if (Object.keys(rowSelection).length) setRowSelection({});
      return;
    }

    const newSelection: Record<string, boolean> = {};
    initialSelectedRowIds.forEach((id) => {
      newSelection[id] = true;
    });

    if (JSON.stringify(rowSelection) !== JSON.stringify(newSelection)) {
      setRowSelection(newSelection);
    }
  }, [initialSelectedRowIds]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Filter bar */}
      <div className="">
        {showFilterBar !== false && (
          <div className="w-full flex flex-wrap gap-2 pr-4">
            <Filterbar
              table={table}
              data={data}
              visibleFilters={visibleFilters}
              customFilters={customFilters}
              onExport={onExport}
              showExport={showExport}
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-none ">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
        >
          <Table className="min-w-full border-t border-b">
            <TableHeader className="bg-none border-t-b !h-2 sticky ">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className="max-w-[200px] px-2 truncate text-sm font-bold whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      {/* simple spinner */}
                      <div className="size-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                      <span className="animate-pulse text-sm">
                        Loading data…
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                <SortableContext
                  items={dataIds}
                  strategy={verticalListSortingStrategy}
                >
                  {table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} />
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {message ?? "No results."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Footer pagination */}
      <div className="flex items-center justify-between px-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
