import { config } from "../config.js";

const PRODUCTS_CACHE_TTL_MS = 45_000;

export type Product = {
  id: number;
  name: string;
  brand: string | null;
  description: string | null;
  price: number;
  oldPrice: number | null;
  category: string | null;
  imageUrl: string | null;
  inStock: boolean;
  stockQuantity: number | null;
  isFeatured: boolean;
  sortOrder: number;
};

export type PublicProduct = {
  id: number;
  name: string;
  brand: string | null;
  description: string | null;
  price: number;
  oldPrice: number | null;
  category: string | null;
  imageUrl: string | null;
  stockQuantity: number | null;
  isFeatured: boolean;
};

type SupabaseProductRow = {
  id: unknown;
  name: unknown;
  brand: unknown;
  description: unknown;
  price: unknown;
  old_price: unknown;
  category: unknown;
  image_url: unknown;
  in_stock: unknown;
  stock_quantity: unknown;
  is_featured: unknown;
  sort_order: unknown;
};

let productsCache:
  | {
      expiresAt: number;
      products: Product[];
    }
  | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function toNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toPositiveInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }

  return null;
}

function normalizeProductRow(value: unknown): Product | null {
  if (!isRecord(value)) {
    return null;
  }

  const row = value as SupabaseProductRow;

  const id = toPositiveInteger(row.id);

  if (
    !id ||
    typeof row.name !== "string" ||
    typeof row.price !== "number" ||
    typeof row.in_stock !== "boolean"
  ) {
    return null;
  }

  return {
    id,
    name: row.name,
    brand: toNullableString(row.brand),
    description: toNullableString(row.description),
    price: row.price,
    oldPrice: toNullableNumber(row.old_price),
    category: toNullableString(row.category),
    imageUrl: toNullableString(row.image_url),
    inStock: row.in_stock,
    stockQuantity: toNullableNumber(row.stock_quantity),
    isFeatured: typeof row.is_featured === "boolean" ? row.is_featured : false,
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0
  };
}

function toPublicProduct(product: Product): PublicProduct {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    description: product.description,
    price: product.price,
    oldPrice: product.oldPrice,
    category: product.category,
    imageUrl: product.imageUrl,
    stockQuantity: product.stockQuantity,
    isFeatured: product.isFeatured
  };
}

async function fetchSupabaseProducts(query: string): Promise<Product[]> {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/products?${query}`, {
    headers: {
      apikey: config.supabaseServiceRoleKey,
      Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`supabase_products_error_${response.status}: ${details}`);
  }

  const value: unknown = await response.json();

  if (!Array.isArray(value)) {
    throw new Error("supabase_products_invalid_response");
  }

  return value.map(normalizeProductRow).filter((product): product is Product => product !== null);
}

export async function getActiveProducts(): Promise<Product[]> {
  const now = Date.now();

  if (productsCache && productsCache.expiresAt > now) {
    return productsCache.products;
  }

  const query = new URLSearchParams({
    select:
      "id,name,brand,description,price,old_price,category,image_url,in_stock,stock_quantity,is_featured,sort_order",
    in_stock: "eq.true",
    order: "sort_order.asc,name.asc"
  });

  const products = await fetchSupabaseProducts(query.toString());

  productsCache = {
    expiresAt: now + PRODUCTS_CACHE_TTL_MS,
    products
  };

  return products;
}

export async function getPublicProducts(): Promise<PublicProduct[]> {
  const products = await getActiveProducts();
  return products.map(toPublicProduct);
}

export async function getActiveProductsByIds(ids: number[]): Promise<Map<number, Product>> {
  const uniqueIds = [...new Set(ids)];

  if (!uniqueIds.length) {
    return new Map();
  }

  const products = await getActiveProducts();
  const cachedProducts = products.filter((product) => uniqueIds.includes(product.id));

  if (cachedProducts.length === uniqueIds.length) {
    return new Map(cachedProducts.map((product) => [product.id, product]));
  }

  const query = [
    "select=id,name,brand,description,price,old_price,category,image_url,in_stock,stock_quantity,is_featured,sort_order",
    `id=in.(${uniqueIds.join(",")})`,
    "in_stock=eq.true",
    "order=sort_order.asc,name.asc"
  ].join("&");

  const freshProducts = await fetchSupabaseProducts(query);
  return new Map(freshProducts.map((product) => [product.id, product]));
}
