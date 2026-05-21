import { parseCsv, nestCsvMetadata } from "./csv.js";
import { parseJsonImport } from "./json.js";
import { parseXmlImport } from "./xml.js";
import type { ImportFormat } from "../types.js";

export type FileParseResult =
  | { ok: true; rows: Record<string, unknown>[] }
  | { ok: false; message: string };

export function detectFormat(
  hint: string | undefined,
  contentType: string | undefined,
  filename: string | undefined,
): ImportFormat | undefined {
  const normalized = hint?.trim().toLowerCase();
  if (normalized === "csv" || normalized === "json" || normalized === "xml") {
    return normalized;
  }

  const ct = contentType?.split(";")[0]?.trim().toLowerCase();
  if (ct === "text/csv" || ct === "application/csv") return "csv";
  if (ct === "application/json" || ct === "text/json") return "json";
  if (ct === "application/xml" || ct === "text/xml") return "xml";

  const ext = filename?.split(".").pop()?.toLowerCase();
  if (ext === "csv") return "csv";
  if (ext === "json") return "json";
  if (ext === "xml") return "xml";

  return undefined;
}

export function parseImportFile(format: ImportFormat, content: string): FileParseResult {
  switch (format) {
    case "csv": {
      const result = parseCsv(content);
      if (!result.ok) return result;
      return { ok: true, rows: nestCsvMetadata(result.rows) };
    }
    case "json":
      return parseJsonImport(content);
    case "xml":
      return parseXmlImport(content);
    default:
      return { ok: false, message: "Unsupported format" };
  }
}
