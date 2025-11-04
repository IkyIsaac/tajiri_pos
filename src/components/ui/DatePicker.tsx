"use client";

import * as React from "react";
import { format, isAfter } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "./button";
import { Calendar } from "./calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import { cn } from "./lib/utils";
import { DateRange } from "react-day-picker";

/* ── Prop Types ────────────────────────────────────────────── */
interface SingleDatePickerProps {
  type: "single";
  selectedDate: Date | undefined;
  setSelectedDate: (d: Date | undefined) => void;
}
interface RangeDatePickerProps {
  type: "range";
  selectedDate: DateRange | undefined;
  setSelectedDate: (d: DateRange | undefined) => void;
}
type Props =
  | (SingleDatePickerProps & { label: string })
  | (RangeDatePickerProps & { label: string });

/* ── Helpers ───────────────────────────────────────────────── */
function formatRange(range: DateRange | undefined) {
  if (!range?.from) return "Pick a date";
  const { from, to } = range;
  if (from && to) return `${format(from, "PPP")} – ${format(to, "PPP")}`;
  return `${format(from, "PPP")} – …`;
}

/* ── Component ─────────────────────────────────────────────── */
const DatePickerComponent: React.FC<Props> = ({
  label,
  type,
  selectedDate,
  setSelectedDate,
}) => {
  const display = React.useMemo(() => {
    if (type === "single") {
      return selectedDate ? format(selectedDate as Date, "PPP") : "Pick a date";
    }
    return formatRange(selectedDate as DateRange);
  }, [type, selectedDate]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            /* min + max width + truncate inside */
            className={cn(
              "min-w-[220px] max-w-[380px] justify-start font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate flex-1">{display}</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={4}
          collisionPadding={8}
          className="w-auto p-0 z-50 rounded-md border bg-white shadow-lg"
        >
          <div className="max-h-[50vh] overflow-y-auto">
            {type === "single" ? (
              <Calendar
                mode="single"
                captionLayout="dropdown"
                fromYear={1992}
                toYear={new Date().getFullYear() + 5}
                selected={selectedDate as Date | undefined}
                onSelect={(d) => setSelectedDate(d || undefined)}
                initialFocus
              />
            ) : (
              <div className="flex gap-4">
                {/* FROM calendar */}
                <Calendar
                  mode="single"
                  numberOfMonths={1}
                  captionLayout="dropdown"
                  fromYear={1992}
                  toYear={new Date().getFullYear() + 5}
                  selected={(selectedDate as DateRange | undefined)?.from}
                  onSelect={(d) => {
                    if (!d) return;
                    const currTo = (selectedDate as DateRange | undefined)?.to;
                    const newRange: DateRange = { from: d, to: currTo };
                    if (currTo && isAfter(d, currTo)) newRange.to = undefined;
                    setSelectedDate(newRange);
                  }}
                  toDate={(selectedDate as DateRange | undefined)?.to}
                  initialFocus
                />

                {/* TO calendar */}
                <Calendar
                  mode="single"
                  numberOfMonths={1}
                  captionLayout="dropdown"
                  fromYear={1992}
                  toYear={new Date().getFullYear() + 5}
                  selected={(selectedDate as DateRange | undefined)?.to}
                  fromDate={(selectedDate as DateRange | undefined)?.from}
                  onSelect={(d) => {
                    if (!d) return;
                    const currFrom = (selectedDate as DateRange | undefined)?.from;
                    const newRange: DateRange = {
                      from: currFrom ?? d,
                      to: d,
                    };
                    setSelectedDate(newRange);
                  }}
                  initialFocus
                />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePickerComponent;