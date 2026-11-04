// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import {
  getProductUserData,
  saveProductUserData,
} from "../services/localProductData";
vi.stubGlobal("__APP_API_BASE__", "");
const api = await import("../services/apiClient");
afterEach(() => {
  api.setAuthToken(null);
  localStorage.clear();
  vi.restoreAllMocks();
});
it("opaque sessions scope private notes from the verified profile, without decoding claims", () => {
  api.setAuthToken("opaque-session-one");
  api.setSessionIdentity({ user: { id: "alice" }, organizationId: "org1" });
  saveProductUserData("B08N5WRWNW", { notes: "Alice private note" });
  api.setAuthToken("opaque-session-two");
  expect(getProductUserData("B08N5WRWNW").notes).toBeUndefined();
  api.setSessionIdentity({ user: { id: "bob" }, organizationId: "org1" });
  expect(getProductUserData("B08N5WRWNW").notes).toBeUndefined();
  api.setSessionIdentity({ user: { id: "alice" }, organizationId: "org1" });
  expect(getProductUserData("B08N5WRWNW").notes).toBe("Alice private note");
});
it("logout sends the current bearer session to the revocation endpoint", async () => {
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(null, { status: 204 }));
  api.setAuthToken("opaque-session");
  await api.logout();
  const [url, opts] = fetch.mock.calls[0];
  expect(String(url)).toContain("/api/auth/logout");
  expect(opts?.method).toBe("POST");
  expect((opts?.headers as Record<string, string>).Authorization).toBe(
    "Bearer opaque-session",
  );
});
