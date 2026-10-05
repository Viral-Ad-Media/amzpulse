// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import AppWorkspace from "../components/AppWorkspace";
const mocks = vi.hoisted(() => ({
  featured: vi.fn(async () => []),
  trending: vi.fn(async () => []),
  best: vi.fn(async () => []),
  watchlist: vi.fn(async () => [
    {
      id: "watch1",
      productId: "B08N5WRWNW",
      product: { asin: "B08N5WRWNW", name: "Saved after reload", price: 20 },
    },
  ]),
}));
vi.mock("../services/apiClient", () => ({
  getFeaturedProducts: mocks.featured,
  getTrendingProducts: mocks.trending,
  getBestSellerProducts: mocks.best,
  getWatchlist: mocks.watchlist,
  me: vi.fn(async () => ({
    user: { email: "test@example.com" },
    role: "owner",
    plan: "free",
  })),
  getUsage: vi.fn(async () => ({ asinsAnalyzed: 0, plan: "free" })),
  setAuthToken: vi.fn(),
  addToWatchlist: vi.fn(),
  createCheckoutSession: vi.fn(),
  fetchProduct: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  removeFromWatchlist: vi.fn(),
}));
vi.mock("../components/Sidebar", () => ({
  default: ({ setView }: any) => (
    <button onClick={() => setView("watchlist")}>Open saved</button>
  ),
}));
vi.mock("../components/OnboardingTour", () => ({
  default: () => null,
  ONBOARDING_STORAGE_KEY: "tour",
}));
vi.mock("../components/FilterBar", () => ({ default: () => null }));
vi.mock("../components/ProductCard", () => ({
  ProductCard: ({ product }: any) => <div>{product.name}</div>,
}));
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});
it("reload hydrates saved products and avoids automatic paid discovery", async () => {
  localStorage.setItem("amzpulse_token", "saved-token");
  render(
    <React.StrictMode>
      <AppWorkspace />
    </React.StrictMode>,
  );
  await waitFor(() => expect(mocks.watchlist).toHaveBeenCalled());
  fireEvent.click(screen.getByText("Open saved"));
  expect(await screen.findByText("Saved after reload")).toBeTruthy();
  expect(mocks.trending).not.toHaveBeenCalled();
  expect(mocks.best).not.toHaveBeenCalled();
});
