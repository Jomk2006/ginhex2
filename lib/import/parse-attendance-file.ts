import "server-only";
import ExcelJS from "exceljs";

export interface ParsedRow {
  [key: string]: string | number | undefined;
}

// Small cap on purpose: uploads come from signed-in staff, but parsing is still
// done on untrusted bytes, so keep the blast radius small.
const MAX_IMPORT_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 5000;

/** Minimal RFC 4180 CSV parser (quotes, escaped quotes, CRLF). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      if (rows.length > MAX_ROWS + 1) throw new Error("TOO_MANY_ROWS");
    } else field += c;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toObjects(table: string[][]): ParsedRow[] {
  const [header, ...body] = table;
  if (!header) return [];
  return body
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

function cellText(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "object") {
    if ("text" in v && typeof v.text === "string") return v.text;
    if ("result" in v && v.result != null) return String(v.result);
    if ("richText" in v) return v.richText.map((t) => t.text).join("");
    if (v instanceof Date) return v.toISOString();
    return "";
  }
  return String(v);
}

/** Accepts .xlsx (zip) or .csv. Legacy .xls is not supported. */
export async function parseAttendanceFile(buffer: ArrayBuffer): Promise<ParsedRow[]> {
  if (buffer.byteLength > MAX_IMPORT_FILE_SIZE_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }
  const bytes = new Uint8Array(buffer);
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b; // "PK"

  if (!isZip) {
    return toObjects(parseCsv(new TextDecoder("utf-8").decode(bytes)));
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  if (sheet.rowCount > MAX_ROWS + 1) throw new Error("TOO_MANY_ROWS");

  const table: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values = (row.values as ExcelJS.CellValue[]).slice(1); // exceljs is 1-indexed
    table.push(values.map(cellText));
  });
  return toObjects(table);
}

/** Normalizes whatever the file's header casing/spacing was into the fields we care about. */
export function extractRowFields(row: ParsedRow) {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[key.trim().toLowerCase()] = String(value ?? "").trim();
  }

  return {
    name: normalized["name"] ?? normalized["full name"] ?? normalized["full_name"] ?? "",
    email: normalized["email"] ?? "",
    genhexId: normalized["genhex id"] ?? normalized["genhex_id"] ?? normalized["student id"] ?? normalized["studentid"] ?? "",
    status: normalized["status"] ?? normalized["attendance"] ?? "",
  };
}
