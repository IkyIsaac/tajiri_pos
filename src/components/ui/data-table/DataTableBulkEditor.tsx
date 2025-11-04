"use client"

import { RowSelectionState, Table } from "@tanstack/react-table"
import { CommandBar, CommandBarBar, CommandBarValue, CommandBarSeperator, CommandBarCommand } from "../tremor/CommandBar"

export type BulkEditorAction<TData> = {
  label: string
  action: (rows: TData[]) => void
  shortcut?: { shortcut: string; label?: string }
}

type DataTableBulkEditorProps<TData> = {
  table: Table<TData>
  rowSelection: RowSelectionState
  actions?: BulkEditorAction<TData>[]
}

export function DataTableBulkEditor<TData>({
  table,
  actions = [],
}: DataTableBulkEditorProps<TData>) {
  const selectedRows = table
    .getSelectedRowModel()
    .rows.map((r) => r.original) as TData[]
  const hasSelectedRows = selectedRows.length > 0

  return (
    <CommandBar open={hasSelectedRows}>
      <CommandBarBar>
        <CommandBarValue>{selectedRows.length} selected</CommandBarValue>
        <CommandBarSeperator />

        {actions.map((act, i) => (
          <div key={i} className="flex items-center">
            <CommandBarCommand
              label={act.label}
              action={() => act.action(selectedRows)}
              shortcut={act.shortcut ?? { shortcut: "", label: "" }}
            />
            <CommandBarSeperator />
          </div>
        ))}

        <CommandBarCommand
          label="Reset"
          action={() => table.resetRowSelection()}
          shortcut={{ shortcut: "Escape", label: "esc" }}
        />
      </CommandBarBar>
    </CommandBar>
  )
}
