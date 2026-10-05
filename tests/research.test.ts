// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  mergeHistory,
  csvCell,
  calculateProfit,
  safeWebUrl,
} from "../services/researchMath";
import {
  normalizeExternalProducts,
  normalizeExternalProduct,
} from "../services/productMapper";
import {
  getProductUserData,
  saveProductUserData,
  setProductDataScope,
} from "../services/localProductData";

describe("research data integrity", () => {
  it("joins sparse histories by timestamp without inventing points", () => {
    expect(
      mergeHistory(
        [
          { date: "2026-01-03", price: 30 },
          { date: "2026-01-01", price: 10 },
        ],
        [
          { date: "2026-01-02", rank: 200 },
          { date: "2026-01-03", rank: 300 },
        ],
      ),
    ).toEqual([
      { date: "2026-01-01", price: 10, rank: null },
      { date: "2026-01-02", price: null, rank: 200 },
      { date: "2026-01-03", price: 30, rank: 300 },
    ]);
  });
  it("requires known nonnegative fees before calculating profit", () => {
    expect(calculateProfit(30, 10, [null, 5])).toBeNull();
    expect(calculateProfit(30, 10, [-1, 5])).toBeNull();
    expect(calculateProfit(30, 10, [3, 5, 0])).toEqual({
      profit: 12,
      roi: 120,
      margin: 40,
    });
  });
  it("does not map per-ASIN errors to successful products", () => {
    expect(
      normalizeExternalProducts([
        { asin: "B08N5WRWNW", error: "failed" },
        { asin: "B07FZ8S74R", price: 20 },
      ]).map((p) => p.asin),
    ).toEqual(["B07FZ8S74R"]);
  });
  it("unknown, invalid or negative fees and unknown risk stay unavailable", () => {
    const p = normalizeExternalProduct({
      asin: "B08N5WRWNW",
      fbaFee: "invalid",
      storageFee: -1,
    });
    expect(p.referralFee).toBeNull();
    expect(p.fbaFee).toBeNull();
    expect(p.storageFee).toBeNull();
    expect(p.riskDataAvailable).toBe(false);
  });
  it("escapes spreadsheet formulas and quote delimiters", () => {
    for (const text of ["=1+1", "+SUM(A1)", "-1+1", "@SUM(A1)", "\t=1+1"])
      expect(csvCell(text).startsWith("\"'")).toBe(true);
    expect(csvCell('A "quoted" title')).toBe('"A ""quoted"" title"');
  });
  it("rejects executable supplier links", () => {
    expect(safeWebUrl("javascript:alert(1)")).toBe("");
    expect(safeWebUrl("https://supplier.example/item")).toBe(
      "https://supplier.example/item",
    );
  });
});
describe("account-scoped local persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    setProductDataScope(null);
  });
  it("saves immediately and keeps user/organization notes separate", () => {
    setProductDataScope("alice-org1");
    saveProductUserData("b08n5wrwnw", { notes: "Alice private note" });
    expect(getProductUserData("B08N5WRWNW").notes).toBe("Alice private note");
    setProductDataScope("bob-org1");
    expect(getProductUserData("B08N5WRWNW")).toEqual({});
    setProductDataScope("alice-org2");
    expect(getProductUserData("B08N5WRWNW")).toEqual({});
    setProductDataScope("alice-org1");
    expect(getProductUserData("B08N5WRWNW").notes).toBe("Alice private note");
  });
});
