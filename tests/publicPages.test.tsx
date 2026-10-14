// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import App from "../App";
import type { BillingPlan } from "../services/apiClient";

const mocks = vi.hoisted(() => ({
  plans: vi.fn<() => Promise<BillingPlan[]>>(async () => {
    throw new Error("backend unavailable");
  }),
}));

vi.mock("../services/apiClient", () => ({
  getBillingPlans: mocks.plans,
  setAuthToken: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}));

const setRoute = (path: string) => {
  window.location.hash = path;
};

beforeEach(() => {
  mocks.plans.mockImplementation(async () => {
    throw new Error("backend unavailable");
  });
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
  setRoute("/");
});

describe("public marketing pages", () => {
  it("renders the home page with primary navigation and fallback plan limits", async () => {
    setRoute("/");
    render(<App />);

    expect(
      await screen.findByRole("heading", { level: 1, name: /find products worth sourcing/i }),
    ).toBeTruthy();

    const nav = screen.getByRole("navigation", { name: /primary/i });
    for (const label of ["Features", "Pricing", "About", "Contact"]) {
      expect(within(nav).getByRole("link", { name: label })).toBeTruthy();
    }

    expect(screen.getAllByText("300 ASINs per month").length).toBeGreaterThan(0);
    expect(screen.getAllByText("100 ASINs per batch").length).toBeGreaterThan(0);
    expect(document.title).toContain("AmzPulse");
  });

  it("marks the active route in the navigation and swaps page metadata", async () => {
    setRoute("/pricing");
    render(<App />);

    expect(await screen.findByRole("heading", { level: 1, name: /simple plans/i })).toBeTruthy();
    const nav = screen.getByRole("navigation", { name: /primary/i });
    expect(within(nav).getByRole("link", { name: "Pricing" }).getAttribute("aria-current")).toBe("page");
    expect(within(nav).getByRole("link", { name: "Features" }).getAttribute("aria-current")).toBeNull();
    await waitFor(() => expect(document.title).toBe("Pricing | AmzPulse"));
  });

  it("uses live plans from the API when they are available", async () => {
    mocks.plans.mockImplementation(async () => [
      { name: "free", monthlyAsinQuota: 10, maxBatchSize: 2, price: 0, description: "Tiny" },
      { name: "pro", monthlyAsinQuota: 9000, maxBatchSize: 500, price: 149, description: "Big" },
    ]);
    setRoute("/pricing");
    render(<App />);

    expect(await screen.findByText("$149")).toBeTruthy();
    expect(screen.getAllByText("9,000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("500").length).toBeGreaterThan(0);
  });

  it("renders the remaining static routes and a not-found fallback", async () => {
    const cases: Array<[string, RegExp]> = [
      ["/features", /shaped around how amazon research/i],
      ["/about", /manual friction/i],
      ["/contact", /right place/i],
      ["/privacy", /^privacy policy$/i],
      ["/terms", /^terms of service$/i],
      ["/billing/success", /billing update was received/i],
      ["/billing/cancel", /canceled before completion/i],
      ["/does-not-exist", /could not find that page/i],
    ];

    for (const [path, heading] of cases) {
      setRoute(path);
      const view = render(<App />);
      expect(await screen.findByRole("heading", { level: 1, name: heading })).toBeTruthy();
      view.unmount();
    }
  });
});
