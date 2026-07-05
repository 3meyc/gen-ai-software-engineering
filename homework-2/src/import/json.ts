export type JsonParseResult =
  | { ok: true; rows: Record<string, unknown>[] }
  | { ok: false; message: string };

export function parseJsonImport(content: string): JsonParseResult {
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    return { ok: false, message: "Invalid JSON: unable to parse file" };
  }

  if (Array.isArray(data)) {
    if (!data.every((item) => item !== null && typeof item === "object" && !Array.isArray(item))) {
      return { ok: false, message: "JSON array must contain only objects" };
    }
    return { ok: true, rows: data as Record<string, unknown>[] };
  }

  if (data !== null && typeof data === "object" && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.tickets)) {
      const tickets = obj.tickets;
      if (!tickets.every((item) => item !== null && typeof item === "object" && !Array.isArray(item))) {
        return { ok: false, message: "tickets array must contain only objects" };
      }
      return { ok: true, rows: tickets as Record<string, unknown>[] };
    }
    return { ok: true, rows: [obj] };
  }

  return { ok: false, message: "JSON must be an array of tickets or { tickets: [...] }" };
}
