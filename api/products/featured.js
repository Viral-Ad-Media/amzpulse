import { fetchAmazonProducts, getFeaturedAsins, HttpError, sendError, sendJson } from '../../server/amazonProvider.mjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendError(res, new HttpError(405, 'Method not allowed.'));
    return;
  }

  try {
    const asins = getFeaturedAsins();
    if (asins.length === 0) {
      sendJson(res, 200, []);
      return;
    }

    const products = await fetchAmazonProducts(asins);
    sendJson(res, 200, products);
  } catch (error) {
    sendError(res, error);
  }
}
