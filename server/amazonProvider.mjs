import { createHash, createHmac } from 'node:crypto';

const DEFAULT_HOST = 'webservices.amazon.com';
const DEFAULT_MARKETPLACE = 'www.amazon.com';
const DEFAULT_REGION = 'us-east-1';
const DEFAULT_LANGUAGE = 'en_US';
const MAX_ITEMS_PER_REQUEST = 10;
const MAX_BATCH_ITEMS = 100;
const ASIN_PATTERN = /^[A-Z0-9]{10}$/;

const PAAPI_TARGET = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems';
const PAAPI_SERVICE = 'ProductAdvertisingAPI';
const PAAPI_PATH = '/paapi5/getitems';

const PRODUCT_RESOURCES = [
  'Images.Primary.Large',
  'Images.Primary.Medium',
  'Images.Primary.Small',
  'ItemInfo.Title',
  'ItemInfo.ByLineInfo',
  'ItemInfo.Classifications',
  'ItemInfo.Features',
  'ItemInfo.ManufactureInfo',
  'ItemInfo.ProductInfo',
  'BrowseNodeInfo.BrowseNodes',
  'BrowseNodeInfo.BrowseNodes.SalesRank',
  'BrowseNodeInfo.WebsiteSalesRank',
  'OffersV2.Listings.Availability',
  'OffersV2.Listings.Condition',
  'OffersV2.Listings.IsBuyBoxWinner',
  'OffersV2.Listings.MerchantInfo',
  'OffersV2.Listings.Price',
  'OffersV2.Listings.Type'
];

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

const valueFromEnv = (env, keys) => {
  for (const key of keys) {
    const value = env?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

const readPaapiConfig = (env = process.env) => {
  const accessKey = valueFromEnv(env, ['AMAZON_PAAPI_ACCESS_KEY', 'PAAPI_ACCESS_KEY']);
  const secretKey = valueFromEnv(env, ['AMAZON_PAAPI_SECRET_KEY', 'PAAPI_SECRET_KEY']);
  const partnerTag = valueFromEnv(env, ['AMAZON_PAAPI_PARTNER_TAG', 'PAAPI_PARTNER_TAG']);

  if (!accessKey || !secretKey || !partnerTag) {
    throw new HttpError(
      503,
      'Amazon product sync is not configured. Set AMAZON_PAAPI_ACCESS_KEY, AMAZON_PAAPI_SECRET_KEY, and AMAZON_PAAPI_PARTNER_TAG on the server.',
      {
        missing: [
          !accessKey && 'AMAZON_PAAPI_ACCESS_KEY',
          !secretKey && 'AMAZON_PAAPI_SECRET_KEY',
          !partnerTag && 'AMAZON_PAAPI_PARTNER_TAG'
        ].filter(Boolean)
      }
    );
  }

  return {
    accessKey,
    secretKey,
    partnerTag,
    host: valueFromEnv(env, ['AMAZON_PAAPI_HOST']) || DEFAULT_HOST,
    marketplace: valueFromEnv(env, ['AMAZON_PAAPI_MARKETPLACE']) || DEFAULT_MARKETPLACE,
    region: valueFromEnv(env, ['AMAZON_PAAPI_REGION']) || DEFAULT_REGION,
    language: valueFromEnv(env, ['AMAZON_PAAPI_LANGUAGE']) || DEFAULT_LANGUAGE
  };
};

const sha256 = (value) => createHash('sha256').update(value, 'utf8').digest('hex');
const hmac = (key, value, encoding) => createHmac('sha256', key).update(value, 'utf8').digest(encoding);

const getSignatureKey = (secretKey, dateStamp, regionName, serviceName) => {
  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, regionName);
  const kService = hmac(kRegion, serviceName);
  return hmac(kService, 'aws4_request');
};

const toAmazonDate = (date = new Date()) => date.toISOString().replace(/[:-]|\.\d{3}/g, '');

const buildSignedHeaders = ({ body, config }) => {
  const amzDate = toAmazonDate();
  const dateStamp = amzDate.slice(0, 8);
  const headers = {
    'content-encoding': 'amz-1.0',
    'content-type': 'application/json; charset=utf-8',
    host: config.host,
    'x-amz-date': amzDate,
    'x-amz-target': PAAPI_TARGET
  };
  const headerKeys = Object.keys(headers).sort();
  const canonicalHeaders = headerKeys.map((key) => `${key}:${headers[key]}\n`).join('');
  const signedHeaders = headerKeys.join(';');
  const canonicalRequest = [
    'POST',
    PAAPI_PATH,
    '',
    canonicalHeaders,
    signedHeaders,
    sha256(body)
  ].join('\n');
  const credentialScope = `${dateStamp}/${config.region}/${PAAPI_SERVICE}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256(canonicalRequest)
  ].join('\n');
  const signingKey = getSignatureKey(config.secretKey, dateStamp, config.region, PAAPI_SERVICE);
  const signature = hmac(signingKey, stringToSign, 'hex');

  return {
    ...headers,
    authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  };
};

export const normalizeAsins = (values) => {
  const raw = Array.isArray(values) ? values : String(values || '').split(/[\s,]+/);
  const normalized = raw
    .map((value) => String(value || '').trim().toUpperCase())
    .filter(Boolean);
  return [...new Set(normalized)];
};

const validateAsins = (asins, maxItems = MAX_BATCH_ITEMS) => {
  if (asins.length === 0) {
    throw new HttpError(400, 'Provide at least one ASIN.');
  }
  if (asins.length > maxItems) {
    throw new HttpError(413, `Too many ASINs. The maximum batch size is ${maxItems}.`);
  }

  const invalid = asins.filter((asin) => !ASIN_PATTERN.test(asin));
  if (invalid.length > 0) {
    throw new HttpError(400, `Invalid ASIN format: ${invalid.slice(0, 5).join(', ')}`);
  }
};

const chunk = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const toNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const displayValue = (node) => node?.DisplayValue || node?.displayValue || '';

const firstValue = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return '';
};

const pickImage = (item) =>
  firstValue(
    item?.Images?.Primary?.Large?.URL,
    item?.Images?.Primary?.Medium?.URL,
    item?.Images?.Primary?.Small?.URL
  );

const pickPrice = (item) => {
  const offerV2 = item?.OffersV2?.Listings?.find((listing) => listing?.IsBuyBoxWinner) || item?.OffersV2?.Listings?.[0];
  const offer = item?.Offers?.Listings?.find((listing) => listing?.IsBuyBoxWinner) || item?.Offers?.Listings?.[0];
  const summary = item?.Offers?.Summaries?.[0];
  const price =
    offerV2?.Price?.Money ||
    offerV2?.Price ||
    offer?.Price ||
    summary?.LowestPrice ||
    summary?.HighestPrice ||
    {};

  return {
    amount: toNumber(price.Amount ?? price.amount),
    display: firstValue(price.DisplayAmount, price.displayAmount),
    currency: firstValue(price.Currency, price.currency)
  };
};

const pickOfferCount = (item) => {
  const summaries = item?.Offers?.Summaries;
  if (!Array.isArray(summaries)) return 0;
  return summaries.reduce((total, summary) => total + toNumber(summary?.OfferCount), 0);
};

const pickAvailability = (item) => {
  const offerV2 = item?.OffersV2?.Listings?.find((listing) => listing?.IsBuyBoxWinner) || item?.OffersV2?.Listings?.[0];
  const offer = item?.Offers?.Listings?.find((listing) => listing?.IsBuyBoxWinner) || item?.Offers?.Listings?.[0];
  return firstValue(
    offerV2?.Availability?.Message,
    offerV2?.Availability?.DisplayValue,
    offer?.Availability?.Message,
    offer?.Availability?.Type
  );
};

const pickFulfillment = (item) => {
  const offerV2 = item?.OffersV2?.Listings?.find((listing) => listing?.IsBuyBoxWinner) || item?.OffersV2?.Listings?.[0];
  const offer = item?.Offers?.Listings?.find((listing) => listing?.IsBuyBoxWinner) || item?.Offers?.Listings?.[0];
  if (offer?.DeliveryInfo?.IsAmazonFulfilled) return 'FBA';
  return firstValue(offerV2?.Type, offer?.MerchantInfo?.Name);
};

const pickCategory = (item) => {
  const classification = item?.ItemInfo?.Classifications;
  const browseNodes = item?.BrowseNodeInfo?.BrowseNodes || [];
  const websiteRank = item?.BrowseNodeInfo?.WebsiteSalesRank;
  return {
    category: firstValue(
      displayValue(classification?.ProductGroup),
      websiteRank?.ContextFreeName,
      browseNodes[0]?.ContextFreeName,
      browseNodes[0]?.DisplayName,
      'Amazon'
    ),
    subCategory: firstValue(browseNodes[0]?.DisplayName, browseNodes[0]?.ContextFreeName)
  };
};

const pickSalesRank = (item) => {
  const websiteRank = item?.BrowseNodeInfo?.WebsiteSalesRank;
  const browseNodes = item?.BrowseNodeInfo?.BrowseNodes || [];
  const rankedNode = browseNodes.find((node) => toNumber(node?.SalesRank) > 0);
  return toNumber(websiteRank?.SalesRank || rankedNode?.SalesRank);
};

const mapPaapiItemToProduct = (item) => {
  const asin = item?.ASIN || '';
  const price = pickPrice(item);
  const byLineInfo = item?.ItemInfo?.ByLineInfo || {};
  const productInfo = item?.ItemInfo?.ProductInfo || {};
  const features = item?.ItemInfo?.Features?.DisplayValues || [];
  const { category, subCategory } = pickCategory(item);

  return {
    id: asin,
    asin,
    name: displayValue(item?.ItemInfo?.Title) || `Amazon product ${asin}`,
    brand: firstValue(displayValue(byLineInfo.Brand), displayValue(byLineInfo.Manufacturer), 'Unknown'),
    category,
    subCategory,
    price: price.amount,
    priceDisplay: price.display,
    currency: price.currency,
    image: pickImage(item),
    rating: 0,
    reviews: 0,
    trend: 0,
    description: Array.isArray(features) ? features.join(' ') : '',
    priceHistory: [],
    bsrHistory: [],
    bsr: pickSalesRank(item),
    estimatedSales: 0,
    isEstimatedSales: false,
    referralFee: 0,
    fbaFee: 0,
    storageFee: 0,
    weight: displayValue(productInfo.ItemDimensions?.Weight) || '',
    dimensions: '',
    sellers: pickOfferCount(item),
    isHazmat: false,
    isIpRisk: false,
    isOversized: false,
    riskDataAvailable: false,
    seasonalityTags: [],
    availability: pickAvailability(item),
    fulfillmentChannel: pickFulfillment(item),
    detailUrl: item?.DetailPageURL || (asin ? `https://www.amazon.com/dp/${asin}` : ''),
    dataSource: 'amazon-paapi',
    lastSyncedAt: new Date().toISOString()
  };
};

const callPaapiGetItems = async ({ asins, config }) => {
  const body = JSON.stringify({
    ItemIds: asins,
    ItemIdType: 'ASIN',
    LanguagesOfPreference: [config.language],
    Marketplace: config.marketplace,
    PartnerTag: config.partnerTag,
    PartnerType: 'Associates',
    Resources: PRODUCT_RESOURCES
  });
  const headers = buildSignedHeaders({ body, config });
  const response = await fetch(`https://${config.host}${PAAPI_PATH}`, {
    method: 'POST',
    headers,
    body
  });
  const rawText = await response.text();
  let payload = {};

  try {
    payload = rawText ? JSON.parse(rawText) : {};
  } catch {
    payload = { raw: rawText };
  }

  if (!response.ok) {
    const apiMessage =
      payload?.Errors?.[0]?.Message ||
      payload?.message ||
      rawText.slice(0, 240) ||
      'Amazon Product Advertising API request failed.';
    throw new HttpError(response.status, apiMessage, payload?.Errors || payload);
  }

  return payload;
};

export const fetchAmazonProducts = async (values, env = process.env) => {
  const asins = normalizeAsins(values);
  validateAsins(asins);
  const config = readPaapiConfig(env);
  const products = [];

  for (const asinChunk of chunk(asins, MAX_ITEMS_PER_REQUEST)) {
    const payload = await callPaapiGetItems({ asins: asinChunk, config });
    const items = payload?.ItemsResult?.Items || payload?.ItemResults?.Items || [];
    products.push(...items.map(mapPaapiItemToProduct).filter((product) => product.asin));
  }

  return products;
};

export const getFeaturedAsins = (env = process.env) =>
  normalizeAsins(valueFromEnv(env, ['FEATURED_ASINS', 'AMAZON_FEATURED_ASINS']));

export const readJsonBody = async (req) => {
  if (Buffer.isBuffer(req.body)) {
    const rawBody = req.body.toString('utf8').trim();
    return rawBody ? JSON.parse(rawBody) : {};
  }
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    return req.body.trim() ? JSON.parse(req.body) : {};
  }

  const chunks = [];
  for await (const chunkPart of req) {
    chunks.push(Buffer.isBuffer(chunkPart) ? chunkPart : Buffer.from(chunkPart));
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? JSON.parse(raw) : {};
};

export const sendJson = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.end(JSON.stringify(payload));
};

export const sendError = (res, error) => {
  const status = error?.status || 500;
  sendJson(res, status, {
    error: error?.message || 'Unexpected server error.',
    details: error?.details
  });
};

export const handleAmazonApiRequest = async (req, res, env = process.env) => {
  const url = new URL(req.url || '/', 'http://localhost');
  const path = url.pathname;

  try {
    if (req.method === 'GET' && path === '/api/products/featured') {
      const asins = getFeaturedAsins(env);
      if (asins.length === 0) {
        sendJson(res, 200, []);
        return true;
      }

      const products = await fetchAmazonProducts(asins, env);
      sendJson(res, 200, products);
      return true;
    }

    const productMatch = path.match(/^\/api\/products\/([^/]+)$/);
    if (req.method === 'GET' && productMatch) {
      const asin = decodeURIComponent(productMatch[1] || '');
      const products = await fetchAmazonProducts([asin], env);
      if (!products[0]) {
        throw new HttpError(404, `Amazon product not found or not accessible: ${asin}`);
      }

      sendJson(res, 200, products[0]);
      return true;
    }

    if (req.method === 'POST' && path === '/api/batch/analyze') {
      const body = await readJsonBody(req);
      const products = await fetchAmazonProducts(body?.asins || [], env);
      sendJson(res, 200, products);
      return true;
    }

    if (
      path === '/api/products/featured' ||
      path.startsWith('/api/products/') ||
      path === '/api/batch/analyze'
    ) {
      throw new HttpError(405, 'Method not allowed.');
    }
  } catch (error) {
    sendError(res, error);
    return true;
  }

  return false;
};
