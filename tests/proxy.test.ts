import { afterEach, expect, it, vi } from "vitest";
import { proxyToBackend } from "../server/backendProxy.mjs";
const response = () => ({
  statusCode: 0,
  headers: {} as Record<string, string>,
  body: "",
  setHeader(key: string, value: string) {
    this.headers[key] = value;
  },
  end(body: string) {
    this.body = body;
  },
});
afterEach(() => vi.unstubAllGlobals());
it("forwards all API routes to the fixed backend, preserves auth, drops spoofed IP", async () => {
  const fetch = vi.fn(
    async (_url: any, _init: any) =>
      new Response('{"token":"ok"}', { status: 201 }),
  );
  vi.stubGlobal("fetch", fetch);
  const res = response();
  await proxyToBackend(
    {
      url: "/api/auth/login",
      method: "POST",
      body: { email: "test@example.com" },
      headers: { authorization: "Bearer abc", "x-forwarded-for": "evil" },
    },
    res,
    { AMZPULSE_BACKEND_URL: "https://api.example.com", NODE_ENV: "production" },
  );
  expect(res.statusCode).toBe(201);
  expect(res.headers["Cache-Control"]).toBe("no-store");
  expect(String(fetch.mock.calls[0][0])).toBe(
    "https://api.example.com/api/auth/login",
  );
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe("Bearer abc");
  expect(fetch.mock.calls[0][1].headers["x-forwarded-for"]).toBeUndefined();
});
it("blocks webhook forwarding, insecure production URLs and oversized requests", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const cases: Array<[any, Record<string, string>, number]> = [
    [
      { url: "/api/billing/webhook", method: "POST" },
      { AMZPULSE_BACKEND_URL: "https://api.example.com" },
      404,
    ],
    [
      { url: "/api/auth/login", method: "POST" },
      { AMZPULSE_BACKEND_URL: "http://localhost:3001", NODE_ENV: "production" },
      503,
    ],
    [
      { url: "/api/auth/login", method: "POST", body: "x".repeat(70000) },
      { AMZPULSE_BACKEND_URL: "https://api.example.com" },
      413,
    ],
  ];
  for (const [req, env, status] of cases) {
    const res = response();
    await proxyToBackend(req, res, env);
    expect(res.statusCode).toBe(status);
  }
  expect(fetch).not.toHaveBeenCalled();
});
