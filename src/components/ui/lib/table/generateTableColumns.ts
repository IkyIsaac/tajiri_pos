import {
  ColumnDef,
  createColumnHelper,
  CellContext,
} from "@tanstack/react-table";
import { ReactNode } from "react";

export function generateColumns<T extends Record<string, any>>(
  keys: Array<Extract<keyof T, string>>,
  customRenderers?: Partial<
    Record<keyof T, (ctx: CellContext<T, unknown>) => ReactNode>
  >
): ColumnDef<T>[] {
  const columnHelper = createColumnHelper<T>();

  return keys.map((key) =>
    columnHelper.accessor(key as any, {
      id: String(key),
      header: () =>
        String(key)
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
      cell: (ctx) =>
        customRenderers?.[key]
          ? customRenderers[key]!(ctx)
          : (String(ctx.getValue?.()) ?? ""),
      meta: {
        displayName: String(key),
        className: "text-left",
      },
    })
  );
}
