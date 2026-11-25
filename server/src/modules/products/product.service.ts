import type { CreateProductInput, QueryProductInput, UpdateProductInput } from '@dokani/shared';
import { ConflictError, NotFoundError } from '../../common/errors.js';
import { prisma } from '../../config/prisma.js';
import { parseAndValidateProductCsv } from './product.csv.js';
import { productRepository, type ProductRepository } from './product.repository.js';

export class ProductService {
  constructor(private readonly repo: ProductRepository = productRepository) {}

  async create(tenantId: string, input: CreateProductInput, userId?: string) {
    const existingSku = await this.repo.findBySku(tenantId, input.sku);
    if (existingSku) {
      throw new ConflictError(`Product with SKU '${input.sku}' already exists.`);
    }

    if (input.barcode) {
      const existingBarcode = await this.repo.findByBarcode(tenantId, input.barcode);
      if (existingBarcode) {
        throw new ConflictError(`Product with barcode '${input.barcode}' already exists.`);
      }
    }

    const product = await this.repo.create(tenantId, input, userId);
    return this.serializeProduct(product);
  }

  async getById(tenantId: string, id: string) {
    const product = await this.repo.findById(tenantId, id);
    if (!product) {
      throw new NotFoundError('Product not found.');
    }
    return this.serializeProduct(product);
  }

  async list(tenantId: string, query: QueryProductInput) {
    const result = await this.repo.search(tenantId, query);
    return {
      ...result,
      products: result.products.map((p) => this.serializeProduct(p)),
    };
  }

  async update(tenantId: string, id: string, input: UpdateProductInput) {
    const product = await this.repo.findById(tenantId, id);
    if (!product) {
      throw new NotFoundError('Product not found.');
    }

    if (input.sku && input.sku !== product.sku) {
      const existingSku = await this.repo.findBySku(tenantId, input.sku);
      if (existingSku && existingSku.id !== id) {
        throw new ConflictError(`Product with SKU '${input.sku}' already exists.`);
      }
    }

    if (input.barcode && input.barcode !== product.barcode) {
      const existingBarcode = await this.repo.findByBarcode(tenantId, input.barcode);
      if (existingBarcode && existingBarcode.id !== id) {
        throw new ConflictError(`Product with barcode '${input.barcode}' already exists.`);
      }
    }

    const updated = await this.repo.update(tenantId, id, input);
    return this.serializeProduct(updated);
  }

  async delete(tenantId: string, id: string) {
    const product = await this.repo.findById(tenantId, id);
    if (!product) {
      throw new NotFoundError('Product not found.');
    }

    await this.repo.softDelete(tenantId, id);
  }

  async importCsv(tenantId: string, csvContent: string, userId?: string) {
    const { validRows, errors } = parseAndValidateProductCsv(csvContent);

    if (validRows.length === 0) {
      return {
        importedCount: 0,
        errors,
      };
    }

    // Filter out rows with duplicates (against DB and within the same CSV) and resolve category names
    const rowsToInsert: CreateProductInput[] = [];
    const seenSkus = new Set<string>();
    const seenBarcodes = new Set<string>();
    const categoryCache = new Map<string, string>();

    for (const parsedRow of validRows) {
      const { rowNumber, input, categoryName } = parsedRow;
      const normalizedSku = input.sku.toLowerCase();

      if (seenSkus.has(normalizedSku)) {
        errors.push({
          row: rowNumber,
          errors: [`Duplicate SKU '${input.sku}' inside CSV file.`],
          data: { sku: input.sku },
        });
        continue;
      }

      const existingSku = await this.repo.findBySku(tenantId, input.sku);
      if (existingSku) {
        errors.push({
          row: rowNumber,
          errors: [`SKU '${input.sku}' already exists.`],
          data: { sku: input.sku },
        });
        continue;
      }

      if (input.barcode) {
        const normalizedBarcode = input.barcode.toLowerCase();
        if (seenBarcodes.has(normalizedBarcode)) {
          errors.push({
            row: rowNumber,
            errors: [`Duplicate barcode '${input.barcode}' inside CSV file.`],
            data: { barcode: input.barcode },
          });
          continue;
        }

        const existingBarcode = await this.repo.findByBarcode(tenantId, input.barcode);
        if (existingBarcode) {
          errors.push({
            row: rowNumber,
            errors: [`Barcode '${input.barcode}' already exists.`],
            data: { barcode: input.barcode },
          });
          continue;
        }
        seenBarcodes.add(normalizedBarcode);
      }

      seenSkus.add(normalizedSku);

      if (!input.categoryId && categoryName) {
        const catKey = categoryName.trim().toLowerCase();
        const cachedId = categoryCache.get(catKey);
        if (cachedId) {
          input.categoryId = cachedId;
        } else {
          const cat = await prisma.category.upsert({
            where: { tenantId_name: { tenantId, name: categoryName.trim() } },
            update: {},
            create: { tenantId, name: categoryName.trim() },
            select: { id: true },
          });
          categoryCache.set(catKey, cat.id);
          input.categoryId = cat.id;
        }
      }

      rowsToInsert.push(input);
    }

    const created =
      rowsToInsert.length > 0
        ? await this.repo.bulkCreate(tenantId, rowsToInsert, userId)
        : [];

    return {
      importedCount: created.length,
      errors,
    };
  }

  private serializeProduct<
    T extends {
      costPrice: bigint;
      sellPrice: bigint;
      stockLevel?: { quantity: number } | null;
      [key: string]: unknown;
    },
  >(product: T) {
    return {
      ...product,
      costPrice: Number(product.costPrice),
      sellPrice: Number(product.sellPrice),
      stock: product.stockLevel ? product.stockLevel.quantity : 0,
    };
  }
}

export const productService = new ProductService();
