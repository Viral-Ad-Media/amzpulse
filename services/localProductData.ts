// Per-product sourcing data (supplier link, target ROI, notes) and calculator inputs.
// Stored locally per browser — types.ts already documents these Product fields as
// "User Specific Data (Stored locally)"; there's no watchlist-sync backend in this repo
// for them to round-trip through, so localStorage is the real persistence layer, not a
// placeholder for one.
export interface ProductUserData {
  fulfillmentMode?: "FBA" | "FBM";
  salePrice?: number;
  buyCost?: number;
  prepCost?: number;
  shippingToAmz?: number;
  shippingCostFbm?: number;
  supplierUrl?: string;
  targetRoi?: number;
  notes?: string;
  updatedAt?: string;
  referralFee?: number | null;
  fbaFee?: number | null;
  storageFee?: number | null;
}

let scope = "guest";
export const setProductDataScope = (identity: string | null) => {
  scope = identity || "guest";
};
const storageKey = () =>
  `amzpulse_product_data_v2:${encodeURIComponent(scope)}`;

type Store = Record<string, ProductUserData>;

const readStore = (): Store => {
  try {
    const raw = localStorage.getItem(storageKey());
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
};

const writeStore = (store: Store) => {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(store));
  } catch (err) {
    console.warn("Failed to save product data locally", err);
  }
};

export const getProductUserData = (asin: string): ProductUserData => {
  if (!asin) return {};
  return readStore()[asin.toUpperCase()] || {};
};

export const saveProductUserData = (
  asin: string,
  patch: Partial<ProductUserData>,
) => {
  if (!asin) return;
  const store = readStore();
  const key = asin.toUpperCase();
  store[key] = { ...store[key], ...patch, updatedAt: new Date().toISOString() };
  writeStore(store);
};

export const clearProductUserData = (asin: string) => {
  if (!asin) return;
  const store = readStore();
  delete store[asin.toUpperCase()];
  writeStore(store);
};

// Cheap enough to call per-card in a product grid — used to badge cards the user has
// already tracked sourcing info for.
export const hasProductUserData = (asin: string): boolean => {
  const data = getProductUserData(asin);
  return Boolean(
    data.notes?.trim() ||
    data.supplierUrl?.trim() ||
    data.targetRoi ||
    data.buyCost,
  );
};
