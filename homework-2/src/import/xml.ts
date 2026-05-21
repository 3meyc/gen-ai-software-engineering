export type XmlParseResult =
  | { ok: true; rows: Record<string, unknown>[] }
  | { ok: false; message: string };

export function parseXmlImport(content: string): XmlParseResult {
  const trimmed = content.trim();
  if (!trimmed) {
    return { ok: false, message: "XML file is empty" };
  }

  const ticketsBlock = extractBlock(trimmed, "tickets");
  if (!ticketsBlock) {
    return { ok: false, message: "XML must contain a <tickets> root element" };
  }

  const ticketBlocks = extractAllBlocks(ticketsBlock, "ticket");
  if (ticketBlocks.length === 0) {
    return { ok: false, message: "XML contains no <ticket> elements" };
  }

  const rows: Record<string, unknown>[] = [];
  for (const block of ticketBlocks) {
    rows.push(parseTicketBlock(block));
  }

  return { ok: true, rows };
}

function parseTicketBlock(block: string): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  const scalarFields = [
    "customer_id",
    "customer_email",
    "customer_name",
    "subject",
    "description",
    "category",
    "priority",
    "status",
    "assigned_to",
    "resolved_at",
  ];

  for (const field of scalarFields) {
    const value = extractText(block, field);
    if (value !== undefined) {
      if (field === "resolved_at" && value.toLowerCase() === "null") {
        record[field] = null;
      } else {
        record[field] = value;
      }
    }
  }

  const tagsBlock = extractBlock(block, "tags");
  if (tagsBlock) {
    const tagValues = extractAllBlocks(tagsBlock, "tag").map((t) => extractDirectText(t));
    record.tags = tagValues.filter((t) => t.length > 0);
  }

  const metadataBlock = extractBlock(block, "metadata");
  if (metadataBlock) {
    const meta: Record<string, unknown> = {};
    for (const key of ["source", "browser", "device_type"]) {
      const v = extractText(metadataBlock, key);
      if (v !== undefined) meta[key] = v;
    }
    record.metadata = meta;
  }

  return record;
}

function extractBlock(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  return m ? m[1] : undefined;
}

function extractAllBlocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const blocks: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    blocks.push(m[1]!);
  }
  return blocks;
}

function extractText(xml: string, tag: string): string | undefined {
  const block = extractBlock(xml, tag);
  if (block === undefined) return undefined;
  const text = extractDirectText(block);
  return text.length > 0 ? text : "";
}

function extractDirectText(xml: string): string {
  return xml.replace(/<[^>]+>/g, "").trim();
}
