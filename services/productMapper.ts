import { Product } from '../types';

export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22 viewBox=%220 0 400 400%22%3E%3Crect width=%22400%22 height=%22400%22 fill=%22%23f8fafc%22/%3E%3Cpath d=%22M112 142h176v116H112z%22 fill=%22%23e2e8f0%22/%3E%3Cpath d=%22M140 174h120v16H140zm0 34h92v16h-92z%22 fill=%22%2394a3b8%22/%3E%3Ctext x=%22200%22 y=%22308%22 text-anchor=%22middle%22 font-family=%22Arial,sans-serif%22 font-size=%2220%22 fill=%22%2364758b%22%3ENo image%3C/text%3E%3C/svg%3E';

const SEASON_TAGS = new Set<Product['seasonalityTags'][number]>([
  'Q1',
  'Q2',
  'Q3',
  'Q4',
  'Evergreen',
  'Summer',
  'Back to School'
]);

const toNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toString = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const pick = (...values: unknown[]) => {
  for (const value of values) {
    const text = toString(value);
    if (text) return text;
  }
  return '';
};

const normalizeSeasonality = (value: unknown): Product['seasonalityTags'] => {
  const raw = Array.isArray(value) ? value : [];
  return raw.filter((tag): tag is Product['seasonalityTags'][number] => SEASON_TAGS.has(tag));
};

export const normalizeExternalProduct = (data: Record<string, any>, fallbackAsin = ''): Product => {
  const asin = pick(data.asin, data.ASIN, data.id, fallbackAsin).toUpperCase();
  const price = toNumber(data.price ?? data.buyBoxPrice ?? data.offerPrice);

  return {
    id: pick(data.id, asin),
    asin,
    name: pick(data.title, data.name, data.productName, asin ? `Amazon product ${asin}` : 'Amazon product'),
    brand: pick(data.brand, data.manufacturer, 'Unknown'),
    category: pick(data.category, data.productGroup, 'Amazon'),
    subCategory: pick(data.subCategory, data.subcategory) || undefined,
    price,
    priceDisplay: pick(data.priceDisplay, data.displayPrice),
    currency: pick(data.currency),
    image: pick(data.image, data.imageUrl, data.primaryImage) || PLACEHOLDER_IMAGE,
    rating: toNumber(data.rating),
    reviews: toNumber(data.reviews ?? data.reviewCount),
    trend: toNumber(data.trend),
    description: pick(data.description),
    priceHistory: Array.isArray(data.priceHistory) ? data.priceHistory : [],
    bsrHistory: Array.isArray(data.bsrHistory) ? data.bsrHistory : [],
    bsr: toNumber(data.bsr ?? data.salesRank ?? data.rank),
    estimatedSales: toNumber(data.estSales ?? data.estimatedSales),
    isEstimatedSales: Boolean(data.isEstimatedSales),
    referralFee: toNumber(data.referralFee),
    fbaFee: toNumber(data.fbaFee),
    storageFee: toNumber(data.storageFee),
    weight: pick(data.weight),
    dimensions: pick(data.dimensions),
    sellers: toNumber(data.sellers ?? data.offerCount),
    isHazmat: Boolean(data.isHazmat),
    isIpRisk: Boolean(data.isIpRisk),
    isOversized: Boolean(data.isOversized),
    riskDataAvailable: data.riskDataAvailable !== undefined ? Boolean(data.riskDataAvailable) : undefined,
    seasonalityTags: normalizeSeasonality(data.seasonalityTags),
    supplierUrl: pick(data.supplierUrl) || undefined,
    targetRoi: data.targetRoi !== undefined ? toNumber(data.targetRoi) : undefined,
    notes: pick(data.notes) || undefined,
    analysis: data.analysis || undefined,
    detailUrl: pick(data.detailUrl, data.detailPageUrl, data.url),
    dataSource: pick(data.dataSource, data.source),
    lastSyncedAt: pick(data.lastSyncedAt, data.syncedAt),
    availability: pick(data.availability),
    fulfillmentChannel: pick(data.fulfillmentChannel)
  };
};

export const normalizeExternalProducts = (items: unknown[]): Product[] =>
  items
    .filter((item): item is Record<string, any> => Boolean(item && typeof item === 'object'))
    .map((item) => normalizeExternalProduct(item, item.asin || item.ASIN || item.id || ''))
    .filter((product) => product.asin);
