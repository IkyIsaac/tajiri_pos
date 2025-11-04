//--------------------------------------------------------------
// utils/tables/generateFilters.ts
//--------------------------------------------------------------
import { isValid, parseISO } from "date-fns";

export type FilterType = "search" | "select" | "number" | "date" | "year";

export type GeneratedFilter = {
  key: string;
  title: string;
  type: FilterType;
  options?: { label: string; value: any }[];
};

type Overrides = Partial<
  Record<
    string,
    { type: FilterType; options?: { label: string; value: any }[] }
  >
>;

/*─────────────────────────── helpers ───────────────────────────*/

function looksLikeADate(v: unknown): boolean {
  if (v instanceof Date) return isValid(v);
  if (typeof v === "string") return isValid(parseISO(v));
  return false;
}

/** Produce a short, human‑friendly preview for UI purposes only */
export function previewValue(v: any): string {
  if (v == null) return "";
  if (["string", "number", "boolean"].includes(typeof v)) return String(v);
  if (looksLikeADate(v)) return new Date(v).toLocaleDateString();
  if (Array.isArray(v)) return v.map(previewValue).join(", ");

  if (typeof v === "object") {
    for (const k of ["name", "title", "label", "code", "id"]) {
      if (v[k]) return String(v[k]);
    }
    try {
      const json = JSON.stringify(v);
      return json.length > 40 ? json.slice(0, 37) + "…" : json;
    } catch {
      return "Object";
    }
  }
  return "—";
}

/** Compares two items using previewed string value */
export function matchFilter(rowVal: any, filterVal: any): boolean {
  if (rowVal === filterVal) return true;
  const r = previewValue(rowVal).toLowerCase().trim();
  const f = previewValue(filterVal).toLowerCase().trim();
  return r === f;
}

/*───────────────────────── generator ───────────────────────────*/

export function generateFilters<T extends Record<string, any>>(
  data: T[],
  overrides?: Overrides
): GeneratedFilter[] {
  if (!data.length) return [];

  return Object.keys(data[0]!).map((key) => {
    const values = data
      .map((row) => row[key])
      .filter((v) => v !== null && v !== undefined);

    const previews = values.map(previewValue);
    const uniquesForDetection = Array.from(new Set(previews));

    let type: FilterType = "search";
    let options: { label: string; value: any }[] | undefined;

    // ---------------- intelligent type detection ----------------
    if (typeof values[0] === "number") {
      const allIntegers = values.every((v) => Number.isInteger(v));
      const inYearRange = values.every(
        (v) => v >= 1900 && v <= new Date().getFullYear() + 1
      );
      type = allIntegers && inYearRange ? "year" : "number";
    } else if (looksLikeADate(values[0])) {
      type = "date";
    } else {
      const looksCategorical =
        uniquesForDetection.length > 0 &&
        uniquesForDetection.length <= 10 &&
        uniquesForDetection.every((u) => u.length <= 30);

      if (looksCategorical) {
        type = "select";

        // Build pairs
        const rawOptions = values.map((v) => ({
          label: previewValue(v) || "—",
          value: v,
        }));

        // Deduplicate by label (case‑insensitive)
        const seen = new Set<string>();

        options = rawOptions
          .filter((opt) => {
            const normalized = opt.label.toLowerCase();
            if (seen.has(normalized)) return false;
            seen.add(normalized);
            return true;
          })
          .map((opt) => ({
            label: opt.label,
            value:
              opt.value !== null &&
              typeof opt.value === "object" &&
              !Array.isArray(opt.value)
                ? opt.label
                : opt.value,
          }));
      } else {
        type = "search";
      }
    }

    // --------------- apply manual overrides ----------------
    if (overrides?.[key]) {
      const override = overrides[key]!;
      type = override.type;
      if (["select", "year"].includes(type)) {
        options = override.options ?? options;
      }

      if (type === "select" && !options) {
        const uniqueLabels = Array.from(
          new Set(values.map((v) => previewValue(v)))
        );
        options = uniqueLabels.map((label) => ({ label, value: label }));
      }
    }

    const result = {
      key,
      title: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      type,
      options,
    };
    // console.log("generated filter →", result);
    return result;

  });
}
