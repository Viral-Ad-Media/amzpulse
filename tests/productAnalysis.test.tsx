// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ProductAnalysis from "../components/ProductAnalysis";
import { normalizeExternalProduct } from "../services/productMapper";
import {
  getProductUserData,
  setProductDataScope,
} from "../services/localProductData";
const analyze = vi.hoisted(() => vi.fn());
vi.mock("../services/geminiService", () => ({
  analyzeProductSellPotential: analyze,
}));
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});
it("does not run AI on mount and preserves a note when the modal immediately closes", () => {
  setProductDataScope("seller-org");
  const product = normalizeExternalProduct({
    asin: "B08N5WRWNW",
    name: "Product",
    price: 20,
  });
  const { unmount } = render(
    <React.StrictMode>
      <ProductAnalysis
        product={product}
        onClose={() => {}}
        isSaved={false}
        onToggleSave={() => {}}
      />
    </React.StrictMode>,
  );
  expect(analyze).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Profit & ROI"));
  expect(screen.getByRole("status").textContent).toContain("unavailable");
  fireEvent.change(
    screen.getByPlaceholderText("Sourcing terms, MOQ, lead time, red flags..."),
    { target: { value: "Do not lose this note" } },
  );
  unmount();
  expect(getProductUserData(product.asin).notes).toBe("Do not lose this note");
});
