export type CsvParseResult =
  | { ok: true; rows: Record<string, unknown>[] }
  | { ok: false; message: string };

/** Parse CSV with header row; supports quoted fields. */
export function parseCsv(content: string): CsvParseResult {
  const trimmed = content.trim();
  if (!trimmed) {
    return { ok: false, message: "CSV file is empty" };
  }

  const lines = splitCsvLines(trimmed);
  if (lines.length < 2) {
    return { ok: false, message: "CSV must include a header row and at least one data row" };
  }

  const headers = parseCsvRow(lines[0]).map((h) => h.trim());
  if (headers.some((h) => h.length === 0)) {
    return { ok: false, message: "CSV header row contains empty column names" };
  }

  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCsvRow(line);
    const record: Record<string, unknown> = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c]!;
      const raw = values[c] ?? "";
      record[key] = coerceCsvValue(key, raw);
    }
    rows.push(record);
  }

  if (rows.length === 0) {
    return { ok: false, message: "CSV contains no data rows" };
  }

  return { ok: true, rows };
}

function coerceCsvValue(key: string, raw: string): unknown {
  const v = raw.trim();
  if (v === "") return "";
  if (key === "tags") {
    return v
      .split(/[|;]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }
  if (key === "resolved_at" && v.toLowerCase() === "null") return null;
  if (key.startsWith("metadata.")) {
    return v;
  }
  return v;
}

function splitCsvLines(text: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      if (current.length > 0 || lines.length > 0) lines.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

function parseCsvRow(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  fields.push(current);
  return fields;
}

/** Flatten metadata.col keys into nested metadata object. */
export function nestCsvMetadata(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    const meta: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (key.startsWith("metadata.")) {
        meta[key.slice("metadata.".length)] = value;
      } else {
        out[key] = value;
      }
    }
    if (Object.keys(meta).length > 0) {
      out.metadata = meta;
    }
    return out;
  });
}
