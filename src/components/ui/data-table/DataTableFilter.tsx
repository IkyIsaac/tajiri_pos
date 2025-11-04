"use client";

import {
  RiAddLine,
  RiArrowDownSLine,
  RiCornerDownRightLine,
} from "@remixicon/react";
import { Column } from "@tanstack/react-table";

import { Button } from "./../button";
import { Checkbox } from "./../checkbox";
import { Input } from "./../input";
import { Label } from "./../label";
import { Popover, PopoverContent, PopoverTrigger } from "./../popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./../select";
import { cn, focusRing } from "./../lib/utilsTremor";
import React from "react";
import { MultiSelect } from "../multi-select";
import DatePickerComponent from "./../DatePicker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
export type ConditionFilter = {
  condition: string;
  value: [number | string, number | string];
};

type FilterType = "select" | "checkbox" | "number" | "date" | "year";

interface DataTableFilterProps<TData, TValue> {
  column: Column<TData, TValue> | undefined;
  title?: string;
  options?: {
    label: string;
    value: string;
  }[];
  type?: FilterType;
  dateMode?: "single" | "range";
  formatter?: (value: any) => string;
}

const ColumnFiltersLabel = ({
  columnFilterLabels,
  className,
}: {
  columnFilterLabels: string[] | undefined;
  className?: string;
}) => {
  if (!columnFilterLabels) return null;

  if (columnFilterLabels.length < 3) {
    return (
      <span className={cn("truncate", className)}>
        {columnFilterLabels.map((value, index) => (
          <span key={value} className="font-semibold">
            {value}
            {index < columnFilterLabels.length - 1 && ", "}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span className={cn("font-semibold", className)}>
      {columnFilterLabels[0]} and {columnFilterLabels.length - 1} more
    </span>
  );
};

type FilterValues =
  | string
  | string[]
  | ConditionFilter
  | Date // single-date filter
  | DateRange // range filter  ( { from?: Date; to?: Date } )
  | undefined;

export function DataTableFilter<TData, TValue>({
  column,
  title,
  options,
  dateMode,
  type = "select",
  formatter = (value) => value.toString(),
}: DataTableFilterProps<TData, TValue>) {
  const columnFilters = column?.getFilterValue() as FilterValues;
  const [selectedValues, setSelectedValues] =
    React.useState<FilterValues>(columnFilters);
  const [open, setOpen] = React.useState(false);
  const columnFilterLabels = React.useMemo(() => {
    if (!selectedValues) return undefined;

    /* array-based filters (select / checkbox) */
    if (Array.isArray(selectedValues)) {
      return selectedValues.map((v) => formatter(v));
    }

    /* single string (plain search) */
    if (typeof selectedValues === "string") {
      return [formatter(selectedValues)];
    }

    /* number filter object */
    if (typeof selectedValues === "object" && "condition" in selectedValues) {
      const conditionLbl = options?.find(
        (o) => o.value === selectedValues.condition
      )?.label;
      if (!conditionLbl) return undefined;
      if (!selectedValues.value?.[0] && !selectedValues.value?.[1])
        return [conditionLbl];
      if (!selectedValues.value?.[1])
        return [`${conditionLbl} ${formatter(selectedValues.value?.[0])}`];
      return [
        `${conditionLbl} ${formatter(
          selectedValues.value?.[0]
        )} and ${formatter(selectedValues.value?.[1])}`,
      ];
    }

    /* --------- NEW: date / range cases ---------- */
    if (selectedValues instanceof Date) {
      return [format(selectedValues, "PPP")]; // single-date
    }

    if (selectedValues && "from" in selectedValues) {
      // DateRange
      const { from, to } = selectedValues as DateRange;
      if (from && to) return [`${format(from, "PPP")} – ${format(to, "PPP")}`];
      if (from) return [`${format(from, "PPP")} – …`];
    }

    return undefined;
  }, [selectedValues, options, formatter]);

  const getDisplayedFilter = () => {
    switch (type) {
      case "select":
        return (
          <MultiSelect
            inlineMode
            options={
              options?.map((opt) => ({
                label: opt.label,
                value: opt.value,
              })) || []
            }
            value={(selectedValues as string[]) ?? []}
            onValueChange={(newValues) => {
              setSelectedValues(newValues);
              // column?.setFilterValue(newValues);
            }}
            onApply={() => setOpen(false)}
            placeholder={`Select ${title?.toLowerCase()}`}
            className="bg-gray-100 hover:bg-gray-50"
            variant="inverted"
          />
        );
      case "checkbox":
        return (
          <div className="mt-2 space-y-2 overflow-y-auto sm:max-h-36">
            {options?.map((option) => (
              <div key={option.label} className="flex items-center gap-2">
                <Checkbox
                  id={option.value}
                  checked={(selectedValues as string[])?.includes(option.value)}
                  onCheckedChange={(checked) => {
                    setSelectedValues((prev) => {
                      if (checked) {
                        return prev
                          ? [...(prev as string[]), option.value]
                          : [option.value];
                      } else {
                        return (prev as string[]).filter(
                          (value) => value !== option.value
                        );
                      }
                    });
                  }}
                />
                <Label htmlFor={option.value} className="text-base sm:text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      case "number":
        const isBetween =
          (selectedValues as ConditionFilter)?.condition === "is-between";
        return (
          <div className="space-y-2">
            <Select
              value={(selectedValues as ConditionFilter)?.condition}
              onValueChange={(value) => {
                setSelectedValues((prev) => ({
                  condition: value,
                  value: [
                    value !== "" ? (prev as ConditionFilter)?.value?.[0] : "",
                    "",
                  ],
                }));
              }}
            >
              <SelectTrigger className="mt-2 sm:py-1">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                {options?.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex w-full items-center gap-2">
              <RiCornerDownRightLine
                className="size-4 shrink-0 text-gray-500"
                aria-hidden="true"
              />
              <Input
                disabled={!(selectedValues as ConditionFilter)?.condition}
                type="number"
                placeholder="$0"
                className="sm:[&>input]:py-1"
                value={(selectedValues as ConditionFilter)?.value?.[0]}
                onChange={(e) =>
                  setSelectedValues((prev) => ({
                    condition: (prev as ConditionFilter)?.condition,
                    value: [
                      e.target.value,
                      isBetween ? (prev as ConditionFilter)?.value?.[1] : "",
                    ],
                  }))
                }
              />
              {isBetween && (
                <>
                  <span className="text-xs font-medium text-gray-500">and</span>
                  <Input
                    disabled={!(selectedValues as ConditionFilter)?.condition}
                    type="number"
                    placeholder="$0"
                    className="sm:[&>input]:py-1"
                    value={(selectedValues as ConditionFilter)?.value?.[1]}
                    onChange={(e) =>
                      setSelectedValues((prev) => ({
                        condition: (prev as ConditionFilter)?.condition,
                        value: [
                          (prev as ConditionFilter)?.value?.[0],
                          e.target.value,
                        ],
                      }))
                    }
                  />
                </>
              )}
            </div>
          </div>
        );

      case "year":
        // Build a year list, newest first
        const currentYear = new Date().getFullYear();
        const yearOptions = Array.from(
          { length: 15 },
          (_, i) => currentYear + 5 - i
        );

        return (
          <Select
            value={(selectedValues as string) ?? ""}
            onValueChange={(year) => setSelectedValues(year)}
          >
            <SelectTrigger className="mt-2 sm:py-1 w-full">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "date":
        return (
          <DatePickerComponent
            type={dateMode ?? "range"}
            label={title!}
            selectedDate={selectedValues as any}
            setSelectedDate={(d: Date | DateRange | undefined) =>
              setSelectedValues(d)
            }
          />
        );
    }
  };
  React.useEffect(() => {
    setSelectedValues(columnFilters);
  }, [columnFilters]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center text-sm gap-2 whitespace-nowrap rounded-md border border-gray-300 px-4 py-1.5 font-medium text-gray-600 hover:bg-gray-50 sm:w-fit sm:text-xs dark:border-gray-700 dark:text-gray-400 hover:dark:bg-gray-900",
            selectedValues &&
              ((typeof selectedValues === "object" &&
                "condition" in selectedValues &&
                selectedValues.condition !== "") ||
                (typeof selectedValues === "string" && selectedValues !== "") ||
                (Array.isArray(selectedValues) && selectedValues.length > 0))
              ? ""
              : "border-dashed",
            focusRing
          )}
        >
          <span
            aria-hidden="true"
            onClick={(e) => {
              if (selectedValues) {
                e.stopPropagation();
                column?.setFilterValue("");
                setSelectedValues("");
              }
            }}
          >
            <RiAddLine
              className={cn(
                "-ml-px size-3.5 shrink-0 transition sm:size-4",
                selectedValues && "rotate-45 hover:text-red-500"
              )}
              aria-hidden="true"
            />
          </span>
          {columnFilterLabels && columnFilterLabels.length > 0 ? (
            <span>{title}</span>
          ) : (
            <span className="w-full text-left  sm:w-fit">{title}</span>
          )}
          {columnFilterLabels && columnFilterLabels.length > 0 && (
            <span
              className="h-4 w-px bg-gray-300 dark:bg-gray-700"
              aria-hidden="true"
            />
          )}
          <ColumnFiltersLabel
            columnFilterLabels={columnFilterLabels}
            className="w-full text-left sm:w-fit text-blue-500"
          />
          <RiArrowDownSLine
            className="size-4 shrink-0 text-gray-500 sm:size-4"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        avoidCollisions
        className={cn(
          "z-50 rounded-md border bg-white shadow-lg p-4",
          type === "date" ? "w-auto" : "w-64 max-w-xs"
        )}
        onInteractOutside={() => {
          if (
            !columnFilters ||
            (typeof columnFilters === "string" && columnFilters === "") ||
            (Array.isArray(columnFilters) && columnFilters.length === 0) ||
            (typeof columnFilters === "object" &&
              "condition" in columnFilters &&
              columnFilters.condition === "")
          ) {
            column?.setFilterValue("");
            setSelectedValues(
              type === "checkbox"
                ? []
                : type === "number"
                ? { condition: "", value: ["", ""] }
                : ""
            );
          }
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            column?.setFilterValue(selectedValues);
          }}
        >
          <div className="space-y-2">
            <div>
              <Label className="text-base font-medium sm:text-sm">
                Filter by <span className="text-gray-500">{title}</span>
              </Label>
              {getDisplayedFilter()}
            </div>
            {type !== "select" && (
              <Button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  column?.setFilterValue(selectedValues);
                  setOpen(false);
                }}
                className="w-full h-9 sm:py-1"
              >
                Apply
              </Button>
            )}
            {columnFilterLabels && columnFilterLabels.length > 0 && (
              <Button
                variant="secondary"
                className="w-full sm:py-1 "
                type="button"
                onClick={() => {
                  column?.setFilterValue("");
                  setSelectedValues(
                    type === "checkbox"
                      ? []
                      : type === "number"
                      ? { condition: "", value: ["", ""] }
                      : ""
                  );
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
