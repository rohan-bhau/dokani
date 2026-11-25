import { createProductSchema, type CreateProductInput } from '@dokani/shared';

export interface ParsedCsvProductRow {
  rowNumber: number;
  input: CreateProductInput;
  categoryName?: string;
}

export interface CsvParseResult {
  validRows: ParsedCsvProductRow[];
  errors: Array<{
    row: number;
    errors: string[];
    data: Record<string, string>;
  }>;
}

function normalizeHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function parseNumericField(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const cleaned = raw.replace(/[৳,\s]/g, '');
  if (!cleaned) return fallback;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.round(parsed) : Number.NaN;
}

export function parseCsvRows(csvText: string): string[][] {
  const sanitized = csvText.replace(/^\uFEFF/, '');
  const firstLine = sanitized.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = !firstLine.includes(',') && firstLine.includes(';') ? ';' : ',';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < sanitized.length; i++) {
    const char = sanitized[i];
    const nextChar = sanitized[i + 1];

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        // Ignore carriage return
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export function parseAndValidateProductCsv(csvContent: string): CsvParseResult {
  const rawRows = parseCsvRows(csvContent);
  if (rawRows.length < 2) {
    return {
      validRows: [],
      errors: [
        {
          row: 1,
          errors: ['CSV file must contain a header row and at least one data row.'],
          data: {},
        },
      ],
    };
  }

  const [headerRow, ...dataRows] = rawRows;
  if (!headerRow) {
    return { validRows: [], errors: [] };
  }

  const headers = headerRow.map(normalizeHeader);
  const validRows: ParsedCsvProductRow[] = [];
  const errors: CsvParseResult['errors'] = [];

  for (let index = 0; index < dataRows.length; index++) {
    const row = dataRows[index];
    if (!row) continue;

    const rowNum = index + 2; // 1-indexed, skipping header
    const rowRecord: Record<string, string> = {};

    headers.forEach((header, colIndex) => {
      if (header) {
        rowRecord[header] = row[colIndex] ?? '';
      }
    });

    const name = rowRecord.name || rowRecord.productname || rowRecord.nameenglish || '';
    const nameBn = rowRecord.namebn || rowRecord.banglaname || rowRecord.namebangla || undefined;
    const sku = rowRecord.sku || rowRecord.skucode || '';
    const barcode = rowRecord.barcode || undefined;
    const categoryName = rowRecord.category || rowRecord.categoryname || undefined;

    const candidate: Record<string, unknown> = {
      name,
      nameBn,
      sku,
      barcode,
      categoryId: rowRecord.categoryid || undefined,
      unit: rowRecord.unit || rowRecord.unitofmeasure || 'pcs',
      costPrice: parseNumericField(rowRecord.costprice ?? rowRecord.cost, 0),
      sellPrice: parseNumericField(
        rowRecord.sellprice ?? rowRecord.sellingprice ?? rowRecord.price,
        0
      ),
      vatRate: parseNumericField(rowRecord.vatrate ?? rowRecord.vat, 0),
      reorderLevel: parseNumericField(rowRecord.reorderlevel ?? rowRecord.reorderthreshold, 5),
      initialStock: parseNumericField(
        rowRecord.initialstock ?? rowRecord.openingstock ?? rowRecord.stock,
        0
      ),
    };

    const parsed = createProductSchema.safeParse(candidate);

    if (!parsed.success) {
      errors.push({
        row: rowNum,
        errors: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
        data: rowRecord,
      });
    } else {
      validRows.push({
        rowNumber: rowNum,
        input: parsed.data,
        ...(categoryName ? { categoryName } : {}),
      });
    }
  }

  return { validRows, errors };
}
