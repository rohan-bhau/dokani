import type { CreateProductInput, QueryProductInput, UpdateProductInput } from '@dokani/shared';
import { ConflictError, NotFoundError } from '../../common/errors.js';
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

    // Filter out rows with duplicates within the tenant
    const rowsToInsert: CreateProductInput[] = [];
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]!;
      const existingSku = await this.repo.findBySku(tenantId, row.sku);
      if (existingSku) {
        errors.push({
          row: i + 2,
          errors: [`SKU '${row.sku}' already exists.`],
          data: { sku: row.sku },
        });
        continue;
      }

      if (row.barcode) {
        const existingBarcode = await this.repo.findByBarcode(tenantId, row.barcode);
        if (existingBarcode) {
          errors.push({
            row: i + 2,
            errors: [`Barcode '${row.barcode}' already exists.`],
            data: { barcode: row.barcode },
          });
          continue;
        }
      }

      rowsToInsert.push(row);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serializeProduct(product: any) {
    return {
      ...product,
      costPrice: Number(product.costPrice),
      sellPrice: Number(product.sellPrice),
      stock: product.stockLevel ? product.stockLevel.quantity : 0,
    };
  }
}

export const productService = new ProductService();
