import React from "react";
import {
  CircleCheck,
  CircleX,
  Clock,
  AlertCircle,
  FileClock,
  BadgeCheck,
  Flag,
  Archive,
  TimerReset,
  LoaderCircle,
  CircleSlash,
  Loader2,
  FileCheck,
  ClipboardCheck,
  FileCog,
} from "lucide-react";

interface LegacyStatusBadgeProps {
  status: string | null | undefined;
  className?: string;
  withIcon?: boolean;
}

// Issue-style + legacy statuses
const legacyStatusStyles: Record<
  string,
  { color: string; icon?: React.ReactNode }
> = {
  NOT_STARTED: {
    color: "bg-zinc-500 text-white ",
    icon: <Clock className="size-3 mr-1" />,
  },
  OPEN: {
    color: "bg-blue-600 text-white ",
    icon: <AlertCircle className="size-3 mr-1" />,
  },
  IN_PROGRESS_IMPLEMENTER: {
    color: "bg-yellow-500 text-white ",
    icon: <LoaderCircle className="size-3 mr-1" />,
  },
  IN_PROGRESS_OWNER: {
    color: "bg-amber-600 text-white ",
    icon: <LoaderCircle className="size-3 mr-1" />,
  },
  CLOSED_NOT_VERIFIED: {
    color: "bg-purple-600 text-white ",
    icon: <CircleSlash className="size-3 mr-1" />,
  },
  CLOSED_VERIFIED_BY_RISK: {
    color: "bg-teal-600 text-white ",
    icon: <BadgeCheck className="size-3 mr-1" />,
  },
  CLOSED_RISK_NA: {
    color: "bg-slate-600 text-white ",
    icon: <Flag className="size-3 mr-1" />,
  },
  CLOSED_RISK_ACCEPTED: {
    color: "bg-emerald-600 text-white ",
    icon: <CircleCheck className="size-3 mr-1" />,
  },
  CLOSED_VERIFIED_BY_AUDIT: {
    color: "bg-green-600 text-white ",
    icon: <CircleCheck className="size-3 mr-1" />,
  },

  STARTED: {
    color: "bg-green-500 text-white ",
    icon: <TimerReset className="size-3 mr-1" />,
  },
  ONGOING: {
    color: "bg-blue-500 text-white",
    icon: <Loader2 className="size-3 mr-1 " />,
  },
  ARCHIVED: {
    color: "bg-gray-500 text-white ",
    icon: <Archive className="size-3 mr-1" />,
  },
  COMPLETED: {
    color: "bg-green-500 text-white ",
    icon: <CircleCheck className="size-3 mr-1" />,
  },
  FAILED: {
    color: "bg-red-500 text-white ",
    icon: <CircleX className="size-3 mr-1" />,
  },
  PENDING: {
    color: "bg-amber-500 text-white",
    icon: <FileClock className="size-3 mr-1" />,
  },
  DRAFT: {
    color: "bg-yellow-400 text-gray-900",
    icon: <FileClock className="size-3 mr-1" />,
  },
  PREPARED: {
    color: "bg-orange-500 text-white",
    icon: <FileCog className="size-3 mr-1" />,
  },
  REVIEWED: {
    color: "bg-green-600 text-white",
    icon: <ClipboardCheck className="size-3 mr-1" />,
  },
};

// Fix unpredictable inputs like "In Progress -> Implementer"
function normalizeStatusKey(status: string): string {
  return status
    .trim()
    .toUpperCase()
    .replace(/\s*->\s*/g, "_") // "In Progress -> Implementer" to "IN_PROGRESS_IMPLEMENTER"
    .replace(/\s+/g, "_") // Extra whitespace to underscores
    .replace(/-/g, "_"); // Dashes to underscores for safety
}

// Beautify label for display
function formatLabel(status: string): string {
  return status
    .replace(/\s*->\s*/g, "→") // Render arrow nicely
    .replace(/_/g, " ") // Replace underscores
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize words
}

export const LegacyStatusBadge: React.FC<LegacyStatusBadgeProps> = ({
  status,
  className = "",
  withIcon = true,
}) => {
  if (!status) return null;

  const normalizedKey = normalizeStatusKey(status);
  const style = legacyStatusStyles[normalizedKey] ?? {
    color: "bg-gray-500 text-white",
    icon: withIcon ? <AlertCircle className="size-3 mr-1" /> : null,
  };

  return (
    <span
      className={`inline-flex items-center text-center justify-center  w-[170px] truncate  rounded px-2 py-1 text-xs font-semibold ${style.color} ${className}`}
    >
      {withIcon && style.icon}
      {formatLabel(status)}
    </span>
  );
};
