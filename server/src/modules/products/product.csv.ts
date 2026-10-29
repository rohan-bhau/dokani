import { createProductSchema, type CreateProductInput } from '@dokani/shared';

export interface CsvParseResult {
  validRows: CreateProductInput[];
  errors: Array<{
    row: number;
    errors: string[];
    data: Record<string, string>;
  }>;
}

export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

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
      } else if (char === ',') {
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

  const headers = headerRow.map((h) => h.toLowerCase().trim());
  const validRows: CreateProductInput[] = [];
  const errors: CsvParseResult['errors'] = [];

  for (let index = 0; index < dataRows.length; index++) {
    const row = dataRows[index];
    if (!row) continue;

    const rowNum = index + 2; // 1-indexed, skipping header
    const rowRecord: Record<string, string> = {};

    headers.forEach((header, colIndex) => {
      rowRecord[header] = row[colIndex] ?? '';
    });

    const candidate: Record<string, unknown> = {
      name: rowRecord.name,
      nameBn: rowRecord.namebn || undefined,
      sku: rowRecord.sku,
      barcode: rowRecord.barcode || undefined,
      categoryId: rowRecord.categoryid || undefined,
      unit: rowRecord.unit || 'pcs',
      costPrice: rowRecord.costprice ? Number(rowRecord.costprice) : 0,
      sellPrice: rowRecord.sellprice ? Number(rowRecord.sellprice) : 0,
      vatRate: rowRecord.vatrate ? Number(rowRecord.vatrate) : 0,
      reorderLevel: rowRecord.reorderlevel ? Number(rowRecord.reorderlevel) : 5,
      initialStock: rowRecord.initialstock ? Number(rowRecord.initialstock) : 0,
    };

    const parsed = createProductSchema.safeParse(candidate);

    if (!parsed.success) {
      errors.push({
        row: rowNum,
        errors: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
        data: rowRecord,
      });
    } else {
      validRows.push(parsed.data);
    }
  }

  return { validRows, errors };
}
