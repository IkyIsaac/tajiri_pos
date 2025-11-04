"use client";

import { Checkbox } from "./../tremor/Checkbox";
import { generateColumns } from "./../lib/table/generateTableColumns";
import {
  CellContext,
  ColumnDef,
  createColumnHelper,
} from "@tanstack/react-table";
import { DataTableRowActions } from "./DataTableRowActions";
import { JSX } from "react";
import { GeneratedFilter, generateFilters } from "../utils/tables/generateFilters";
import { LegacyStatusBadge } from "../statusBadge";

const columnHelper = createColumnHelper<any>();

// Default common cell renderers
const defaultRenderers: Partial<
  Record<string, (ctx: CellContext<any, unknown>) => JSX.Element>
> = {
  status: ({ getValue }) => {
    return (
      <LegacyStatusBadge status={getValue() as string | null | undefined} />
    );
  },

  created_at: ({ getValue }) => {
    const value = getValue();
    const date = new Date(String(value)).toLocaleDateString();
    return <span>{date}</span>;
  },
};

// Row actions column
function createEditColumn<T>(): ColumnDef<T> {
  return columnHelper.display({
    id: "actions",
    header: "Actions",
    enableSorting: false,
    enableHiding: false,
    meta: {
      className: "text-right",
      displayName: "Action",
    },
    cell: ({ row }) => <DataTableRowActions row={row} />,
  });
}

interface GetCycleColumnsOptions<T> {
  data: T[];
  showSelect?: boolean;
  showEdit?: boolean;
  showControls?: boolean;
  customRenderers?: Partial<Record<keyof T, (ctx: CellContext<T, unknown>) => React.ReactNode>>;
  customFilters?: Partial<Record<
    keyof T,
    { type: "search" | "select" | "number" | "date"; options?: { label: string; value: string }[] }
  >>;
  extraColumnsBefore?: ColumnDef<T>[];
  extraColumnsAfter?: ColumnDef<T>[];
  columnOrder?: (keyof T)[];
  hiddenColumns?: (keyof T)[];
}

export function getCycleColumns<T extends Record<string, any>>({
  data,
  showSelect = true,
  showEdit = true,
  showControls = true,
  customRenderers = {},
  customFilters = {},
  extraColumnsBefore = [],
  extraColumnsAfter = [],
  columnOrder,
  hiddenColumns = [],
}: GetCycleColumnsOptions<T>): ColumnDef<T>[] {
  if (!data?.length) return [];

  const firstRow = data[0]!;
  const keys = Object.keys(firstRow) as Extract<keyof T, string>[];
  const mergedRenderers = { ...defaultRenderers, ...customRenderers };

  /* ────────────────────
     1.  Build filter map
  ──────────────────────*/
  const autoFilters = generateFilters(data);
  const filterDefs: Record<string, GeneratedFilter> = Object.fromEntries(
    autoFilters.map((f) => [f.key, f])
  );

  // merge custom filters WITHOUT overwriting auto;
  // if key exists, combine/extend
  for (const k in customFilters) {
    const c = customFilters[k];
    if (!c) continue;
    filterDefs[k] = {
      ...filterDefs[k],
      ...c,
      options: [...(filterDefs[k]?.options ?? []), ...(c.options ?? [])],
    } as GeneratedFilter;
  }

  /* ────────────────────
     2.  Generate columns
  ──────────────────────*/
  const allDynamicColumns: ColumnDef<T>[] = generateColumns(keys, mergedRenderers).map(
    (col): ColumnDef<T> => {
      const key = col.id as string;
      const filter = filterDefs[key];

      let filterFn: "multiSelectIncludes" | "dateBetween" | undefined;
      if (filter?.type === "select") filterFn = "multiSelectIncludes";
      if (filter?.type === "date")   filterFn = "dateBetween";

      return {
        ...col,
        enableColumnFilter: showControls,
        enableSorting: showControls,
        enableHiding: showControls,
        ...(filterFn ? { filterFn } : {}),
      } as ColumnDef<T>;
    }
  );

  /* ────────────────────
     3.  Hide & Order
  ──────────────────────*/
  const visible = allDynamicColumns.filter(
    (c) => !hiddenColumns.includes(c.id as keyof T)
  );

  const columnMap = new Map<keyof T, ColumnDef<T>>();
  visible.forEach((c) => columnMap.set(c.id as keyof T, c));

  let ordered: ColumnDef<T>[] = [];
  if (columnOrder?.length) {
    ordered = columnOrder
      .map((k) => columnMap.get(k))
      .filter((c): c is ColumnDef<T> => !!c);

    const remaining = keys.filter(
      (k) => !columnOrder.includes(k) && !hiddenColumns.includes(k)
    );
    ordered.push(...remaining.map((k) => columnMap.get(k)!));
  } else {
    ordered = visible;
  }

  /* ────────────────────
     4.  Assemble extras
  ──────────────────────*/
  const cols: ColumnDef<T>[] = [];
  if (extraColumnsBefore.length) cols.push(...extraColumnsBefore);
  cols.push(...ordered);
  if (extraColumnsAfter.length) cols.push(...extraColumnsAfter);
  if (showEdit) cols.push(createEditColumn());

  return cols;
}