import { createHash, createHmac } from 'node:crypto';
import { createClient as createRedisClient } from 'redis';

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

// --- CAPTCHA solver helpers ---
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const solveCaptcha2Captcha = async (apiKey, siteKey, pageUrl, { timeout = 120000, interval = 5000 } = {}) => {
  // submit
  const params = new URLSearchParams();
  params.set('key', apiKey);
  params.set('method', 'userrecaptcha');
  params.set('googlekey', siteKey);
  params.set('pageurl', pageUrl);
  params.set('json', '1');

  const submitRes = await fetch('http://2captcha.com/in.php', { method: 'POST', body: params });
  const submitJson = await submitRes.json().catch(() => null);
  if (!submitJson || submitJson.status !== 1) {
    throw new Error('2captcha submit failed');
  }

  const requestId = submitJson.request;
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    await sleep(interval);
    const res = await fetch(`http://2captcha.com/res.php?key=${apiKey}&action=get&id=${requestId}&json=1`);
    const json = await res.json().catch(() => null);
    if (!json) continue;
    if (json.status === 1 && json.request) return json.request;
    if (json.request === 'CAPCHA_NOT_READY') continue;
    throw new Error('2captcha error: ' + JSON.stringify(json));
  }

  throw new Error('Captcha solving timed out');
};

const solveCaptcha = async (provider, apiKey, siteKey, pageUrl, options = {}) => {
  provider = (provider || '2captcha').toLowerCase();
  if (provider === '2captcha') {
    return await solveCaptcha2Captcha(apiKey, siteKey, pageUrl, options);
  }
  if (provider === 'anticaptcha' || provider === 'anti-captcha' || provider === 'antiCaptcha') {
    // Anti-Captcha (anti-captcha.com) implementation
    const clientKey = apiKey;
    // createTask
    const createRes = await fetch('https://api.anti-captcha.com/createTask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientKey, task: { type: 'NoCaptchaTaskProxyless', websiteURL: pageUrl, websiteKey: siteKey } })
    });
    const createJson = await createRes.json().catch(() => null);
    if (!createJson || createJson.errorId) throw new Error('Anti-Captcha createTask failed');
    const taskId = createJson.taskId;
    const deadline = Date.now() + (options.timeout || 120000);
    while (Date.now() < deadline) {
      await sleep(options.interval || 5000);
      const resultRes = await fetch('https://api.anti-captcha.com/getTaskResult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientKey, taskId })
      });
      const resultJson = await resultRes.json().catch(() => null);
      if (resultJson && resultJson.status === 'ready' && resultJson.solution) {
        return resultJson.solution.gRecaptchaResponse || resultJson.solution.code || '';
      }
    }
    throw new Error('Anti-Captcha solving timed out');
  }

  if (provider === 'capsolver' || provider === 'capSolver') {
    // CapSolver: use CAPSOLVER_API_URL + CAPSOLVER_API_KEY from env for a simple integration.
    const capUrl = valueFromEnv(process.env, ['CAPSOLVER_API_URL']);
    const capKey = apiKey;
    if (!capUrl) throw new Error('CAPSOLVER_API_URL not configured');
    // Expect the external CapSolver endpoint to accept { apiKey, siteKey, pageUrl }
    const res = await fetch(capUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: capKey, siteKey, pageUrl })
    });
    const json = await res.json().catch(() => null);
    if (!json || !json.token) throw new Error('CapSolver failed');
    return json.token;
  }

  throw new Error('Unsupported captcha provider: ' + provider);
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

// Minimal Playwright-based scraper fallback for a single ASIN.
// Uses `PROXY_URL` or `PROXY_POOL_URL` from env if provided.
export const scrapeAsin = async (asin, env = process.env) => {
  if (!ASIN_PATTERN.test(asin)) {
    throw new HttpError(400, `Invalid ASIN format: ${asin}`);
  }

  const proxy = valueFromEnv(env, ['PROXY_URL', 'PROXY_POOL_URL']);
  const marketplace = valueFromEnv(env, ['AMAZON_PAAPI_MARKETPLACE']) || DEFAULT_MARKETPLACE;
  const url = `https://${marketplace}/dp/${asin}`;

  let browser;
  try {
    const playwright = await import('playwright');
    const launchOptions = { headless: true };
    if (proxy) launchOptions.proxy = { server: proxy };

    browser = await playwright.chromium.launch(launchOptions);
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36'
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Wait for typical product selectors; don't fail hard if missing.
    await page.waitForSelector('#productTitle, #title', { timeout: 10000 }).catch(() => {});

    // Detect common CAPTCHA markers
    const pageContent = await page.content();
    const isCaptcha = /recaptcha|g-recaptcha|h-captcha|captcha|robot check/i.test(pageContent) ||
      (await page.title()).toLowerCase().includes('robot check');

    if (isCaptcha) {
      const captchaKey = valueFromEnv(env, ['CAPTCHA_API_KEY', 'CAPTCHA_KEY']);
      const captchaProvider = valueFromEnv(env, ['CAPTCHA_PROVIDER']) || '2captcha';
      if (captchaKey) {
        // try to extract sitekey from known iframe or div attributes
        const siteKey =
          (await page.$eval('[data-sitekey]', (el) => el.getAttribute('data-sitekey')).catch(() => '')) ||
          (await page.$eval('div.g-recaptcha', (el) => el.getAttribute('data-sitekey')).catch(() => '')) ||
          (await page.$eval('iframe[src*="recaptcha"]', (el) => {
            const src = el.getAttribute('src') || '';
            const m = src.match(/[?&]k=([A-Za-z0-9_-]+)/);
            return m ? m[1] : '';
          }).catch(() => '')) || '';

        let injected = false;
        if (siteKey) {
          try {
            solverMetrics.attempts[captchaProvider] = (solverMetrics.attempts[captchaProvider] || 0) + 1;
            const token = await solveCaptcha(captchaProvider, captchaKey, siteKey, url);
            if (token) {
              solverMetrics.successes[captchaProvider] = (solverMetrics.successes[captchaProvider] || 0) + 1;
              // inject token into g-recaptcha-response or h-captcha-response and attempt submit
              await page.evaluate((t) => {
                const el = document.querySelector('textarea[name="g-recaptcha-response"]') || document.querySelector('textarea[name="h-captcha-response"]');
                if (el) {
                  el.style.display = 'block';
                  el.value = t;
                  el.dispatchEvent(new Event('input', { bubbles: true }));
                  el.dispatchEvent(new Event('change', { bubbles: true }));
                }
                try { window.grecaptcha && window.grecaptcha.execute && window.grecaptcha.execute(); } catch (e) {}
              }, token);
              // give page a moment to process the token
              await page.waitForTimeout(3000);
              injected = true;
            }
          } catch (err) {
            solverMetrics.failures[captchaProvider] = (solverMetrics.failures[captchaProvider] || 0) + 1;
          }
        }

        if (!injected) {
          // Create a manual solve task and wait for a human to provide the token (short timeout)
          const manual = createManualTask(asin, url);
          const manualTimeout = Number(valueFromEnv(env, ['MANUAL_SOLVE_TIMEOUT_MS'])) || 120000; // default 2 minutes
          const pollInterval = 3000;
          const deadline = Date.now() + manualTimeout;
          while (Date.now() < deadline) {
            const current = manualSolveTasks.get(manual.id);
            if (current && current.token) {
              try {
                await page.evaluate((t) => {
                  const el = document.querySelector('textarea[name="g-recaptcha-response"]') || document.querySelector('textarea[name="h-captcha-response"]');
                  if (el) {
                    el.style.display = 'block';
                    el.value = t;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                  }
                  try { window.grecaptcha && window.grecaptcha.execute && window.grecaptcha.execute(); } catch (e) {}
                }, current.token);
                await page.waitForTimeout(2000);
                break;
              } catch (e) {
                break;
              }
            }
            await sleep(pollInterval);
          }
        }
      }
    }

    const title = (await page.$eval('#productTitle', (el) => el.textContent.trim()).catch(() => '')) || '';
    const price = (await page
      .$eval('#priceblock_ourprice, #priceblock_dealprice, .a-price .a-offscreen', (el) => el.textContent.trim())
      .catch(() => '')) || '';
    const image = (await page.$eval('#imgTagWrapperId img', (img) => img.src).catch(() => '')) || `https://${marketplace}/dp/${asin}`;

    await context.close();
    await browser.close();

    return {
      id: asin,
      asin,
      name: title || `Amazon product ${asin}`,
      brand: 'Unknown',
      category: 'Amazon',
      price: toNumber(price),
      priceDisplay: price,
      currency: '',
      image,
      rating: 0,
      reviews: 0,
      description: '',
      bsr: 0,
      sellers: 0,
      availability: '',
      detailUrl: url,
      dataSource: 'amazon-scrape',
      lastSyncedAt: new Date().toISOString()
    };
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    throw new HttpError(502, 'Scraper failed', { message: err?.message });
  }
};

export const fetchAmazonProducts = async (values, env = process.env) => {
  const asins = normalizeAsins(values);
  validateAsins(asins);
  let config = null;
  try {
    config = readPaapiConfig(env);
  } catch (err) {
    config = null; // PA-API not configured, we'll fall back to scraping
  }

  const products = [];

  if (config) {
    try {
      for (const asinChunk of chunk(asins, MAX_ITEMS_PER_REQUEST)) {
        const payload = await callPaapiGetItems({ asins: asinChunk, config });
        const items = payload?.ItemsResult?.Items || payload?.ItemResults?.Items || [];
        products.push(...items.map(mapPaapiItemToProduct).filter((product) => product.asin));
      }
      // If PA-API returned results for all ASINs, return early.
      if (products.length === asins.length) return products;
      // Otherwise, attempt to fill missing ASINs via scraper below.
      const foundAsins = new Set(products.map((p) => p.asin));
      const missing = asins.filter((a) => !foundAsins.has(a));
      if (missing.length === 0) return products;
      // fall through to scraper for "missing"
      for (const m of missing) {
        try {
          const scraped = await scrapeAsin(m, env);
          if (scraped) products.push(scraped);
        } catch (e) {
          // ignore individual scrape failures; continue
        }
      }
      if (products.length > 0) return products;
      // If we got here, PA-API was configured but returned nothing; fall through to full-scrape below.
    } catch (err) {
      // PA-API call failed (auth, network, rate limit), fall back to scraper for each ASIN.
    }
  }

  // Fallback: try Playwright scraper per ASIN (conservative parallelism)
  const scrapeResults = await Promise.all(
    asins.map(async (a) => {
      try {
        return await scrapeAsin(a, env);
      } catch (e) {
        return null;
      }
    })
  );

  products.push(...scrapeResults.filter(Boolean));

  if (products.length === 0) {
    throw new HttpError(502, 'No products available via PA-API or scraper.');
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

// Manual solver persistence and metrics (Redis-backed when available)
const solverMetrics = { attempts: {}, successes: {}, failures: {}, manualCreated: 0 };

let redisClient = null;
let redisAvailable = false;
const REDIS_URL = valueFromEnv(process.env, ['REDIS_URL', 'REDIS']) || '';
if (REDIS_URL) {
  try {
    redisClient = createRedisClient({ url: REDIS_URL });
    // Connect asynchronously but don't block module load; set flag on success
    redisClient.connect().then(() => {
      redisAvailable = true;
    }).catch(() => {
      redisAvailable = false;
      redisClient = null;
    });
  } catch (e) {
    redisClient = null;
    redisAvailable = false;
  }
}

const inMemoryManual = new Map();
let nextManualId = 1;

const createManualTask = async (asin, pageUrl) => {
  solverMetrics.manualCreated = (solverMetrics.manualCreated || 0) + 1;
  if (redisAvailable && redisClient) {
    const idNum = await redisClient.incr('scraper:manual:nextid');
    const id = String(idNum);
    const task = { id, asin, pageUrl, createdAt: new Date().toISOString(), token: '', status: 'pending' };
    await redisClient.set(`scraper:manual:${id}`, JSON.stringify(task));
    await redisClient.lPush('scraper:manual:ids', id);
    return task;
  }

  const id = String(nextManualId++);
  const task = { id, asin, pageUrl, createdAt: new Date().toISOString(), token: '', status: 'pending' };
  inMemoryManual.set(id, task);
  return task;
};

const listManualTasks = async () => {
  if (redisAvailable && redisClient) {
    const ids = await redisClient.lRange('scraper:manual:ids', 0, -1);
    const tasks = [];
    for (const id of ids) {
      const raw = await redisClient.get(`scraper:manual:${id}`);
      if (raw) tasks.push(JSON.parse(raw));
    }
    return tasks;
  }
  return Array.from(inMemoryManual.values());
};

const getManualTask = async (id) => {
  if (redisAvailable && redisClient) {
    const raw = await redisClient.get(`scraper:manual:${id}`);
    return raw ? JSON.parse(raw) : null;
  }
  return inMemoryManual.get(id) || null;
};

const setManualSolveToken = async (id, token) => {
  if (redisAvailable && redisClient) {
    const raw = await redisClient.get(`scraper:manual:${id}`);
    if (!raw) return null;
    const task = JSON.parse(raw);
    task.token = token;
    task.status = 'solved';
    await redisClient.set(`scraper:manual:${id}`, JSON.stringify(task));
    return task;
  }
  const task = inMemoryManual.get(id);
  if (!task) return null;
  task.token = token;
  task.status = 'solved';
  inMemoryManual.set(id, task);
  return task;
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

    // Scraper admin endpoints
    // Protect admin endpoints with ADMIN_UI_TOKEN
    const adminToken = valueFromEnv(env, ['ADMIN_UI_TOKEN']);
    const isAdminAuthorized = (req) => {
      if (!adminToken) return false;
      const header = req.headers?.['x-admin-token'] || req.headers?.['x-admin-token'.toLowerCase()];
      if (header && String(header) === adminToken) return true;
      const auth = req.headers?.authorization || req.headers?.Authorization;
      if (auth && String(auth).startsWith('Bearer ')) {
        return String(auth).slice(7) === adminToken;
      }
      return false;
    };

    if (path === '/api/scraper/metrics' && req.method === 'GET') {
      if (!isAdminAuthorized(req)) throw new HttpError(401, 'Unauthorized');
      sendJson(res, 200, solverMetrics);
      return true;
    }

    if (path === '/api/scraper/manual-tasks' && req.method === 'GET') {
      if (!isAdminAuthorized(req)) throw new HttpError(401, 'Unauthorized');
      const tasks = await listManualTasks();
      sendJson(res, 200, tasks);
      return true;
    }

    if (path === '/api/scraper/manual-request' && req.method === 'POST') {
      if (!isAdminAuthorized(req)) throw new HttpError(401, 'Unauthorized');
      const body = await readJsonBody(req);
      const asin = String(body?.asin || '').trim().toUpperCase();
      const pageUrl = String(body?.pageUrl || `https://${valueFromEnv(env, ['AMAZON_PAAPI_MARKETPLACE']) || DEFAULT_MARKETPLACE}/dp/${asin}`);
      if (!ASIN_PATTERN.test(asin)) {
        throw new HttpError(400, 'Invalid ASIN for manual request');
      }
      const task = await createManualTask(asin, pageUrl);
      sendJson(res, 200, task);
      return true;
    }

    if (path === '/api/scraper/manual-solve' && req.method === 'POST') {
      if (!isAdminAuthorized(req)) throw new HttpError(401, 'Unauthorized');
      const body = await readJsonBody(req);
      const id = String(body?.id || '');
      const token = String(body?.token || '');
      const task = await setManualSolveToken(id, token);
      if (!task) throw new HttpError(404, 'Manual task not found');
      sendJson(res, 200, { ok: true, task });
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
