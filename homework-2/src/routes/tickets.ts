import { Hono } from "hono";
import { detectFormat, parseImportFile } from "../import/index.js";
import { applyPartialUpdate, filterTickets, finalizeTicket } from "../ticket-logic.js";
import type { TicketStore } from "../store.js";
import type { ImportFormat, ImportSummary } from "../types.js";
import { parseTicketRecord } from "../validation.js";

async function readJsonBody(c: {
  req: { json: () => Promise<unknown> };
}): Promise<
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; response: Response }
> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Request body must be a JSON object" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
  return { ok: true, body: body as Record<string, unknown> };
}

async function readImportContent(c: {
  req: {
    header: (name: string) => string | undefined;
    query: (key: string) => string | undefined;
    parseBody: () => Promise<
      | Record<string, string | File>
      | { [key: string]: string | File | (string | File)[] }
    >;
    text: () => Promise<string>;
  };
}): Promise<
  | { ok: true; content: string; format?: ImportFormat; filename?: string }
  | { ok: false; error: string }
> {
  const contentType = c.req.header("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const body = await c.req.parseBody();
    const fileField = body.file ?? body["file"];
    const file = Array.isArray(fileField) ? fileField[0] : fileField;
    if (!(file instanceof File)) {
      return { ok: false, error: 'Multipart upload requires a "file" field' };
    }
    const content = await file.text();
    const formatHint = typeof body.format === "string" ? body.format : c.req.query("format");
    return { ok: true, content, format: detectFormat(formatHint, file.type, file.name), filename: file.name };
  }

  const content = await c.req.text();
  const formatHint = c.req.query("format");
  return {
    ok: true,
    content,
    format: detectFormat(formatHint, contentType, undefined),
  };
}

export function createTicketRoutes(store: TicketStore) {
  const r = new Hono();

  r.post("/import", async (c) => {
    const payload = await readImportContent(c);
    if (!payload.ok) {
      return c.json({ error: payload.error }, 400);
    }

    const format =
      payload.format ??
      detectFormat(undefined, c.req.header("content-type"), payload.filename);

    if (!format) {
      return c.json(
        {
          error: "Validation failed",
          details: [
            {
              field: "format",
              message: "Specify format via query ?format=csv|json|xml, Content-Type, or file extension",
            },
          ],
        },
        400,
      );
    }

    const parsed = parseImportFile(format, payload.content);
    if (!parsed.ok) {
      return c.json({ error: parsed.message }, 400);
    }

    const summary: ImportSummary = {
      total: parsed.rows.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    parsed.rows.forEach((row, index) => {
      const rowNum = format === "csv" ? index + 2 : index + 1;
      const validated = parseTicketRecord(row, { partial: false });
      if (!validated.ok) {
        summary.failed += 1;
        const msg =
          validated.details.map((d) => `${d.field}: ${d.message}`).join("; ") || validated.error;
        summary.errors.push({ row: rowNum, message: msg });
        return;
      }
      store.add(finalizeTicket(validated.fields));
      summary.successful += 1;
    });

    return c.json(summary, 201);
  });

  r.get("/", (c) => {
    const params = new URL(c.req.url).searchParams;
    const result = filterTickets(store.list(), params);
    if (!result.ok) {
      return c.json({ error: result.error, details: result.details }, 400);
    }
    return c.json({ tickets: result.tickets }, 200);
  });

  r.get("/:id", (c) => {
    const ticket = store.get(c.req.param("id"));
    if (!ticket) {
      return c.json({ error: "Ticket not found" }, 404);
    }
    return c.json(ticket, 200);
  });

  r.post("/", async (c) => {
    const bodyResult = await readJsonBody(c);
    if (!bodyResult.ok) {
      return bodyResult.response;
    }

    const parsed = parseTicketRecord(bodyResult.body, { partial: false });
    if (!parsed.ok) {
      return c.json({ error: parsed.error, details: parsed.details }, 400);
    }

    const created = finalizeTicket(parsed.fields);
    store.add(created);
    return c.json(created, 201);
  });

  r.put("/:id", async (c) => {
    const existing = store.get(c.req.param("id"));
    if (!existing) {
      return c.json({ error: "Ticket not found" }, 404);
    }

    const bodyResult = await readJsonBody(c);
    if (!bodyResult.ok) {
      return bodyResult.response;
    }

    const parsed = parseTicketRecord(bodyResult.body, { partial: true, existing });
    if (!parsed.ok) {
      return c.json({ error: parsed.error, details: parsed.details }, 400);
    }

    const updated = applyPartialUpdate(existing, parsed.fields);
    store.update(existing.id, updated);
    return c.json(updated, 200);
  });

  r.delete("/:id", (c) => {
    const deleted = store.delete(c.req.param("id"));
    if (!deleted) {
      return c.json({ error: "Ticket not found" }, 404);
    }
    return c.body(null, 204);
  });

  return r;
}
