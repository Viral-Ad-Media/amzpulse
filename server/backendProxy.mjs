export const proxyToBackend = async (req, res, env = process.env) => {
  const send = (status, payload) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(payload));
  };
  try {
    const base = env.AMZPULSE_BACKEND_URL;
    if (!base) return send(503, { error: "Backend URL is not configured" });
    const target = new URL(base);
    if (
      target.protocol !== "https:" &&
      !(
        env.NODE_ENV !== "production" &&
        ["localhost", "127.0.0.1"].includes(target.hostname)
      )
    )
      return send(503, { error: "Invalid backend URL" });
    const incoming = new URL(req.url || "/", "http://gateway");
    if (
      !incoming.pathname.startsWith("/api/") ||
      incoming.pathname === "/api/billing/webhook"
    )
      return send(404, { error: "Not found" });
    if (!["GET", "POST", "DELETE"].includes(req.method))
      return send(405, { error: "Method not allowed" });
    let body;
    if (req.method === "POST") {
      if (req.body !== undefined)
        body = Buffer.isBuffer(req.body)
          ? req.body
          : typeof req.body === "string"
            ? req.body
            : JSON.stringify(req.body);
      else {
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += Buffer.byteLength(chunk);
          if (size > 65536) return send(413, { error: "Request too large" });
          chunks.push(chunk);
        }
        body = Buffer.concat(chunks);
      }
      if (Buffer.byteLength(body || "") > 65536)
        return send(413, { error: "Request too large" });
    }
    const headers = { "Content-Type": "application/json" };
    if (typeof req.headers?.authorization === "string")
      headers.Authorization = req.headers.authorization;
    if (typeof req.headers?.["x-api-key"] === "string")
      headers["X-API-Key"] = req.headers["x-api-key"];
    const response = await fetch(
      new URL(incoming.pathname + incoming.search, target.origin),
      {
        method: req.method,
        headers,
        body,
        signal: AbortSignal.timeout(240000),
        redirect: "error",
      },
    );
    const payload = await response.text();
    res.statusCode = response.status;
    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "application/json",
    );
    res.setHeader("Cache-Control", "no-store");
    const retry = response.headers.get("retry-after");
    if (retry) res.setHeader("Retry-After", retry);
    res.end(payload);
  } catch {
    return send(502, { error: "Backend unavailable. Try again later." });
  }
};
export default proxyToBackend;
