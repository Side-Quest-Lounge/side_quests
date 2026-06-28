/** Parse RDS Data API `ExecuteStatement` rows from drizzle `db.execute`. */
type RdsField = {
  stringValue?: string;
  longValue?: number;
  doubleValue?: number;
  booleanValue?: boolean;
  isNull?: boolean;
};

export function parseRdsRows<T extends Record<string, unknown>>(
  result: unknown,
  columns: (keyof T & string)[],
): T[] {
  const records = (result as { records?: RdsField[][] })?.records ?? [];
  return records.map((row) => {
    const obj = {} as T;
    columns.forEach((key, i) => {
      const f = row[i];
      if (!f || f.isNull) {
        (obj as Record<string, unknown>)[key] = null;
      } else if (f.longValue !== undefined) {
        (obj as Record<string, unknown>)[key] = f.longValue;
      } else if (f.doubleValue !== undefined) {
        (obj as Record<string, unknown>)[key] = f.doubleValue;
      } else if (f.booleanValue !== undefined) {
        (obj as Record<string, unknown>)[key] = f.booleanValue;
      } else {
        (obj as Record<string, unknown>)[key] = f.stringValue ?? null;
      }
    });
    return obj;
  });
}

/** pgvector may return as a string like "[0.1,0.2,...]" from RDS Data API. */
export function parseEmbedding(value: unknown): number[] | null {
  if (Array.isArray(value)) {
    return value.every((x) => typeof x === "number" && isFinite(x)) ? (value as number[]) : null;
  }
  if (typeof value !== "string" || !value.startsWith("[")) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return null;
    const nums = parsed.map(Number);
    return nums.every((x) => isFinite(x)) ? nums : null;
  } catch {
    return null;
  }
}

export function parseRdsCount(result: unknown, column = "n"): number {
  const row = parseRdsRows<Record<string, number | null>>(result, [column])[0];
  const n = row?.[column];
  return typeof n === "number" ? n : Number(n ?? 0) || 0;
}
