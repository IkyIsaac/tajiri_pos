"use client";

import { Button } from "./../tremor/Button";
import { Searchbar } from "./../tremor/Searchbar";
import { Table } from "@tanstack/react-table";
import { DataTableFilter } from "./DataTableFilter";
import { generateFilters } from "./../utils/tables/generateFilters";
import { RiDownloadLine } from "@remixicon/react";
import { ViewOptions } from "./DataTableViewOptions";

interface FilterbarProps<TData extends Record<string, any>> {
  table: Table<TData>;
  data: TData[];
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
  onExport?: (rows: TData[]) => void;
  showExport?: boolean;
}

export function Filterbar<TData extends Record<string, any>>({
  table,
  data,
  visibleFilters,
  customFilters,
  onExport,
  showExport = true,
}: FilterbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const allFilters = generateFilters(data, customFilters);

  const filtersToShow = visibleFilters
    ? allFilters.filter((f) => visibleFilters.includes(f.key))
    : allFilters;

  // columns you *never* want to export
  const COLUMN_BLACKLIST = ["actions", "select"];

  // ---------- helper to stringify any value ----------
  function serializeCell(v: unknown): string {
    if (v === null || v === undefined) return "";
    if (v instanceof Date) return v.toISOString(); // or format(v,"PPP")
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  }

  // ---------- safe CSV builder -----------------------
  function rowsToCsv<T extends Record<string, unknown>>(rows: T[]): string {
    if (!rows.length) return "";

    // collect the union of ALL keys present in the data
    const headerKeys: string[] = Array.from(
      rows.reduce((set, r) => {
        Object.keys(r as Record<string, unknown>).forEach((k) => set.add(k));
        return set;
      }, new Set<string>())
    ).filter((k) => !COLUMN_BLACKLIST.includes(k));

    const header = headerKeys.join(",");

    const body = rows
      .map((row) =>
        headerKeys
          .map((key) => {
            const escaped = serializeCell(row[key]).replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(",")
      )
      .join("\n");

    return `${header}\n${body}`;
  }

  function downloadCsv(csv: string, filename = "export.csv") {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const handleExport = () => {
    const rows = table.getFilteredRowModel().rows.map((r) => r.original);

    if (onExport) {
      onExport(rows); // custom handler path
      return;
    }

    // default CSV for all columns (minus blacklist)
    const csv = rowsToCsv(rows);
    downloadCsv(csv);
  };

  return (
    <div className="flex w-full items-end justify-between gap-2 sm:gap-4 overflow-hidden">
      {/* --- left side: filter controls --- */}
      <div
        className="
      flex items-center gap-2 sm:gap-3
      flex-wrap-reverse                 
       
    "
      >
        {filtersToShow.map((filter) => {
          const column = table.getColumn(filter.key);
          if (!column) return null;

          if (filter.type === "search") {
            return (
              <Searchbar
                key={filter.key}
                type="search"
                placeholder={`Search ${filter.title}`}
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(e) => column.setFilterValue(e.target.value)}
                className="min-w-[200px] sm:w-[250px] sm:[&>input]:h-[30px]"
              />
            );
          }

          return (
            <DataTableFilter
              key={filter.key}
              column={column}
              title={filter.title}
              type={filter.type}
              options={filter.options}
              dateMode={(customFilters?.[filter.key] as any)?.dateMode}
            />
          );
        })}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="border border-gray-200 px-2 font-semibold text-indigo-600 sm:border-none sm:py-1 dark:border-gray-800 dark:text-indigo-500"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* --- right side: actions --- */}
      <div className="flex flex-shrink-0 items-center gap-2">
        {showExport && (
          <Button
            variant="secondary"
            className="hidden gap-x-2 px-2 py-1.5 text-sm sm:text-xs lg:flex"
            onClick={handleExport}
            disabled={table.getFilteredRowModel().rows.length === 0}
          >
            <RiDownloadLine className="size-4 shrink-0" />
            Export
          </Button>
        )}

        <ViewOptions table={table} />
      </div>
    </div>
  );
}
