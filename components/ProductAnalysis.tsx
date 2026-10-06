import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  X,
  ShoppingCart,
  Activity,
  Copy,
  Save,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Calculator,
  Heart,
  Download,
  ExternalLink,
  Truck,
  Package,
  Box,
  Warehouse,
  AlertOctagon,
  Flame,
  Calendar,
  Loader2,
} from "lucide-react";
import { calculateProfit, safeWebUrl } from "../services/researchMath";
import { Product, AnalysisResult } from "../types";
import {
  getProductUserData,
  saveProductUserData,
} from "../services/localProductData";

const TrendChart = lazy(() => import("./TrendChart"));
type ProductAnalysisTab = "overview" | "calculator" | "history" | "risks";

interface ProductAnalysisProps {
  product: Product;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
}

const formatMoney = (product: Product) =>
  product.priceDisplay ||
  (product.price > 0 ? `$${product.price.toFixed(2)}` : "N/A");
const formatRank = (rank: number) =>
  rank > 0 ? `#${rank.toLocaleString()}` : "N/A";

const ProductAnalysis: React.FC<ProductAnalysisProps> = ({
  product,
  onClose,
  isSaved,
  onToggleSave,
}) => {
  // State for Analysis
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(
    product.analysis || null,
  );
  const [loading, setLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProductAnalysisTab>("overview");

  // State for Calculator V2 — lazily seeded from localStorage so reopening a product
  // restores what was there before (the modal fully unmounts on close, so a plain
  // useState initializer per mount is enough; no need to watch product.asin changes).
  const [stored] = useState(() => getProductUserData(product.asin));
  const [fulfillmentMode, setFulfillmentMode] = useState<"FBA" | "FBM">(
    stored.fulfillmentMode || "FBA",
  );
  const [salePrice, setSalePrice] = useState<number>(
    stored.salePrice ?? product.price,
  );
  const [buyCost, setBuyCost] = useState<number>(stored.buyCost ?? 0);
  const [prepCost, setPrepCost] = useState<number>(stored.prepCost ?? 0);
  const [shippingToAmz, setShippingToAmz] = useState<number>(
    stored.shippingToAmz ?? 0.5,
  ); // Default per unit inbound
  const [shippingCostFbm, setShippingCostFbm] = useState<number>(
    stored.shippingCostFbm ?? 0,
  ); // Outbound for FBM
  const [notes, setNotes] = useState<string>(stored.notes || "");
  const [supplierUrl, setSupplierUrl] = useState<string>(
    stored.supplierUrl || "",
  );
  const [targetRoi, setTargetRoi] = useState<number>(stored.targetRoi ?? 0);

  const [manualReferral, setManualReferral] = useState<number | null>(
    stored.referralFee ?? null,
  );
  const [manualFba, setManualFba] = useState<number | null>(
    stored.fbaFee ?? null,
  );
  const [manualStorage, setManualStorage] = useState<number | null>(
    stored.storageFee ?? null,
  );
  const referral =
    manualReferral ??
    (salePrice === product.price ? product.referralFee : null);
  const fba = manualFba ?? product.fbaFee;
  const storage = manualStorage ?? product.storageFee;
  const calculation = calculateProfit(
    salePrice,
    buyCost,
    fulfillmentMode === "FBA"
      ? [referral, fba, storage, prepCost, shippingToAmz]
      : [referral, prepCost, shippingCostFbm],
  );
  const profit = calculation?.profit ?? null,
    roi = calculation?.roi ?? null,
    margin = calculation?.margin ?? null;
  const riskDataUnavailable = product.riskDataAvailable !== true;
  const hasHistory =
    product.priceHistory.length > 0 || product.bsrHistory.length > 0;
  const amazonUrl =
    safeWebUrl(product.detailUrl || "") ||
    `https://www.amazon.com/dp/${product.asin}`;
  // Persist each edit immediately so closing the modal cannot discard a pending debounce.
  useEffect(() => {
    saveProductUserData(product.asin, {
      fulfillmentMode,
      salePrice,
      buyCost,
      prepCost,
      shippingToAmz,
      shippingCostFbm,
      notes,
      supplierUrl,
      targetRoi,
      referralFee: manualReferral,
      fbaFee: manualFba,
      storageFee: manualStorage,
    });
  }, [
    product.asin,
    fulfillmentMode,
    salePrice,
    buyCost,
    prepCost,
    shippingToAmz,
    shippingCostFbm,
    notes,
    supplierUrl,
    targetRoi,
    manualReferral,
    manualFba,
    manualStorage,
  ]);
  const handleAnalysis = async () => {
    if (loading) return;
    setLoading(true);
    setAnalysisError(null);
    try {
      const stats =
        buyCost > 0 && calculation
          ? { buyCost, profit: calculation.profit, roi: calculation.roi }
          : undefined;
      const { analyzeProductSellPotential } =
        await import("../services/geminiService");
      const result = await analyzeProductSellPotential(product, stats);
      setAnalysis(result);
      window.dispatchEvent(new Event("amzpulse-usage-updated"));
    } catch (error) {
      setAnalysis(null);
      setAnalysisError(
        (error as Error).message || "Analysis unavailable. Try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end md:justify-center p-0 md:p-4 bg-black/90 backdrop-blur-sm overflow-hidden">
      <div className="relative w-full h-full md:h-[90vh] md:max-w-6xl bg-slate-900 md:rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="w-12 h-12 bg-white rounded border border-slate-700 shrink-0 p-1">
              <img
                src={product.image}
                className="w-full h-full object-contain"
                alt="Product"
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-white font-bold text-lg truncate">
                {product.name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="font-mono bg-slate-800 px-1.5 rounded">
                  {product.asin}
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Box size={12} /> {product.category}
                </span>
                {product.brand && (
                  <span className="text-amz-accent font-bold">
                    {product.brand}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleSave(product.id)}
              className={`p-2 rounded-full border ${isSaved ? "bg-pink-500 text-white border-pink-500" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"}`}
            >
              <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50">
          {(
            [
              { id: "overview", label: "Overview", icon: Activity },
              { id: "calculator", label: "Profit & ROI", icon: Calculator },
              { id: "history", label: "History", icon: Calendar },
              { id: "risks", label: "Risks & Flags", icon: AlertOctagon },
            ] as {
              id: ProductAnalysisTab;
              label: string;
              icon: React.ComponentType<{ size?: number }>;
            }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === tab.id ? "border-amz-accent text-white bg-slate-800/50" : "border-transparent text-slate-500 hover:text-slate-300"}`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-900 p-6">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="grid md:grid-cols-12 gap-6">
              {/* Left Column: Key Metrics */}
              <div className="md:col-span-4 space-y-6">
                {/* Rank Box */}
                <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp size={64} className="text-amz-accent" />
                  </div>
                  <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">
                    Best Sellers Rank
                  </h3>
                  <div className="text-4xl font-black text-white mb-1">
                    {formatRank(product.bsr)}
                  </div>
                  <div className="inline-block bg-slate-700/60 text-slate-300 text-xs font-bold px-2 py-1 rounded">
                    {product.bsr > 0 ? "Amazon sales rank" : "Not provided"}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Est. Sales</span>
                    <span className="text-xl font-bold text-white">
                      {product.estimatedSales > 0
                        ? product.estimatedSales.toLocaleString()
                        : "N/A"}{" "}
                      {product.estimatedSales > 0 && (
                        <span className="text-xs text-slate-500 font-normal">
                          /mo
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Seller Box */}
                <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-slate-400 text-xs font-bold uppercase">
                      Competition Snapshot
                    </h3>
                    <div
                      className={`text-xs font-bold px-2 py-1 rounded ${product.sellers === 0 ? "bg-slate-700/70 text-slate-300" : product.sellers > 10 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}
                    >
                      {product.sellers === 0
                        ? "N/A"
                        : product.sellers > 10
                          ? "High"
                          : "Low"}{" "}
                      Comp
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Total Offers</span>
                      <span className="text-white font-bold">
                        {product.sellers > 0
                          ? product.sellers.toLocaleString()
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Buy Box Type</span>
                      <span className="text-white font-bold">
                        {product.fulfillmentChannel || "Not provided"}
                      </span>
                    </div>
                    {product.availability && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Availability</span>
                        <span
                          className="max-w-[12rem] truncate text-right text-white font-bold"
                          title={product.availability}
                        >
                          {product.availability}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Details Box */}
                <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                  <h3 className="text-slate-400 text-xs font-bold uppercase mb-4">
                    Product Details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Price</span>
                      <span className="text-white font-bold">
                        {formatMoney(product)}
                        {product.currency && product.currency !== "USD"
                          ? ` ${product.currency}`
                          : ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rating</span>
                      <span className="text-white font-bold">
                        {product.rating > 0
                          ? `${product.rating.toFixed(1)} ★`
                          : "N/A"}
                        {product.reviews > 0 && (
                          <span className="text-slate-400 font-normal">
                            {" "}
                            ({product.reviews.toLocaleString()})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Category</span>
                      <span
                        className="max-w-[12rem] truncate text-right text-white font-bold"
                        title={[product.category, product.subCategory]
                          .filter(Boolean)
                          .join(" › ")}
                      >
                        {[product.category, product.subCategory]
                          .filter(Boolean)
                          .join(" › ") || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Weight</span>
                      <span className="text-white font-bold">
                        {product.weight || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dimensions</span>
                      <span
                        className="max-w-[12rem] truncate text-right text-white font-bold"
                        title={product.dimensions}
                      >
                        {product.dimensions || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-700 pt-3 text-xs">
                      <span className="text-slate-500">Source</span>
                      <span className="font-mono text-slate-400">
                        {product.dataSource || "unknown"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                    <h3 className="text-slate-400 text-xs font-bold uppercase mb-3">
                      Description
                    </h3>
                    <p className="text-slate-300 text-sm leading-6 max-h-48 overflow-y-auto pr-1">
                      {product.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: AI Analysis */}
              <div className="md:col-span-8 space-y-4">
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold flex items-center gap-2">
                      <Activity className="text-amz-accent" /> Gemini
                      Intelligence
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAnalysis}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700"
                      >
                        <RefreshCw
                          size={16}
                          className={loading ? "animate-spin" : ""}
                        />
                      </button>
                    </div>
                  </div>

                  {analysisError && (
                    <p role="alert" className="text-red-300">
                      {analysisError}
                    </p>
                  )}
                  {!analysis && !loading && (
                    <button
                      onClick={handleAnalysis}
                      className="rounded bg-amz-accent px-4 py-2 text-slate-900"
                    >
                      Analyze product
                    </button>
                  )}
                  {loading ? (
                    <div className="text-slate-400 text-sm animate-pulse">
                      Analyzing market signals...
                    </div>
                  ) : analysis ? (
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="text-5xl font-black text-green-400">
                          {analysis.grade}
                        </div>
                        <div>
                          <div className="text-white font-bold">
                            Confidence: {analysis.score}/100
                          </div>
                          <p className="text-slate-300 text-sm mt-1">
                            {analysis.summary}
                          </p>
                        </div>
                      </div>

                      {/* NEW: Pros / Cons */}
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="bg-slate-900 p-3 rounded border border-slate-700">
                          <span className="text-xs text-amz-accent font-bold uppercase">
                            Pros
                          </span>
                          <ul className="mt-2 text-slate-300 text-sm list-disc list-inside">
                            {analysis.pros?.slice(0, 5).map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-slate-900 p-3 rounded border border-slate-700">
                          <span className="text-xs text-red-400 font-bold uppercase">
                            Cons
                          </span>
                          <ul className="mt-2 text-slate-300 text-sm list-disc list-inside">
                            {analysis.cons?.slice(0, 5).map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* NEW: FBA / FBM Viability */}
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="bg-slate-900 p-3 rounded border border-slate-700">
                          <span className="text-xs text-cyan-400 font-bold uppercase flex items-center gap-1">
                            <Truck size={12} /> FBA Viability
                          </span>
                          <p className="mt-2 text-slate-300 text-sm">
                            {analysis.fbaAnalysis || "Not provided"}
                          </p>
                        </div>
                        <div className="bg-slate-900 p-3 rounded border border-slate-700">
                          <span className="text-xs text-purple-400 font-bold uppercase flex items-center gap-1">
                            <Package size={12} /> FBM Viability
                          </span>
                          <p className="mt-2 text-slate-300 text-sm">
                            {analysis.fbmAnalysis || "Not provided"}
                          </p>
                        </div>
                      </div>

                      {/* NEW: Signals */}
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="bg-slate-900 p-3 rounded border border-slate-700 text-sm">
                          <div className="text-xs text-slate-400 uppercase font-bold">
                            Competition
                          </div>
                          <div className="text-white font-bold mt-1">
                            {analysis.competitionLevel}
                          </div>
                        </div>
                        <div className="bg-slate-900 p-3 rounded border border-slate-700 text-sm">
                          <div className="text-xs text-slate-400 uppercase font-bold">
                            Demand
                          </div>
                          <div className="text-white font-bold mt-1">
                            {analysis.demandLevel}
                          </div>
                        </div>
                        <div className="bg-slate-900 p-3 rounded border border-slate-700 text-sm">
                          <div className="text-xs text-slate-400 uppercase font-bold">
                            IP Risk
                          </div>
                          <div className="text-white font-bold mt-1">
                            {analysis.ipRiskAssessment}
                          </div>
                        </div>
                      </div>

                      {/* NEW: Seasonality & Suggested Action */}
                      <div className="bg-slate-900 p-4 rounded border border-slate-700 mt-4">
                        <div className="text-xs text-slate-400 uppercase font-bold">
                          Seasonality
                        </div>
                        <div className="text-slate-200 mt-1 text-sm">
                          {analysis.seasonalityInsight}
                        </div>
                        <div className="text-xs text-slate-400 uppercase font-bold mt-3">
                          Suggested Action
                        </div>
                        <div className="text-amz-accent font-bold mt-1">
                          {analysis.suggestedAction}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-400">Analysis unavailable.</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <a
                    href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(product.name)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg p-3 text-center text-sm font-bold text-white transition-colors"
                  >
                    Google Shop
                  </a>
                  <a
                    href={amazonUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-amz-accent/10 hover:bg-amz-accent/20 border border-amz-accent/50 rounded-lg p-3 text-center text-sm font-bold text-amz-accent transition-colors"
                  >
                    View on Amazon
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* CALCULATOR TAB */}
          {activeTab === "calculator" && (
            <div className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700 w-fit">
                    <button
                      onClick={() => setFulfillmentMode("FBA")}
                      className={`px-4 py-2 text-sm font-bold rounded transition-all ${fulfillmentMode === "FBA" ? "bg-amz-accent text-slate-900 shadow" : "text-slate-400"}`}
                    >
                      FBA Mode
                    </button>
                    <button
                      onClick={() => setFulfillmentMode("FBM")}
                      className={`px-4 py-2 text-sm font-bold rounded transition-all ${fulfillmentMode === "FBM" ? "bg-amz-accent text-slate-900 shadow" : "text-slate-400"}`}
                    >
                      FBM Mode
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-slate-400 text-xs uppercase font-bold">
                          Sell Price
                        </label>
                        <input
                          type="number"
                          value={salePrice}
                          onChange={(e) => {
                            setSalePrice(parseFloat(e.target.value) || 0);
                            setManualReferral(null);
                          }}
                          className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-amz-accent text-xs uppercase font-bold">
                          Buy Cost
                        </label>
                        <input
                          type="number"
                          value={buyCost}
                          onChange={(e) =>
                            setBuyCost(parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-slate-800 border border-amz-accent rounded p-2 text-white font-bold mt-1"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Secondary Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-slate-400 text-xs uppercase font-bold">
                          Prep / Unit
                        </label>
                        <input
                          type="number"
                          value={prepCost}
                          onChange={(e) =>
                            setPrepCost(parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-300 text-sm mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs uppercase font-bold">
                          {fulfillmentMode === "FBA"
                            ? "Inbound Ship"
                            : "Outbound Ship"}
                        </label>
                        <input
                          type="number"
                          value={
                            fulfillmentMode === "FBA"
                              ? shippingToAmz
                              : shippingCostFbm
                          }
                          onChange={(e) =>
                            fulfillmentMode === "FBA"
                              ? setShippingToAmz(
                                  parseFloat(e.target.value) || 0,
                                )
                              : setShippingCostFbm(
                                  parseFloat(e.target.value) || 0,
                                )
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-300 text-sm mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="bg-slate-800 rounded-lg p-4 space-y-2 text-sm border border-slate-700">
                    <div className="space-y-2 pb-3">
                      {!calculation && (
                        <p role="status" className="text-amber-300">
                          Profit and ROI are unavailable until all applicable
                          fees are supplied. Re-enter the referral fee when
                          changing the sale price.
                        </p>
                      )}
                      {(
                        [
                          ["Referral fee", manualReferral, setManualReferral],
                          ["FBA fee", manualFba, setManualFba],
                          ["Storage fee", manualStorage, setManualStorage],
                        ] as const
                      ).map(([label, value, setValue]) => (
                        <label className="block" key={label}>
                          {label} (manual override)
                          <input
                            aria-label={label}
                            type="number"
                            min="0"
                            value={value ?? ""}
                            onChange={(event) =>
                              setValue(
                                event.target.value === ""
                                  ? null
                                  : Number(event.target.value),
                              )
                            }
                            className="ml-2 w-24 bg-slate-900 p-1"
                            placeholder="Unknown"
                          />
                        </label>
                      ))}
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Referral Fee</span>{" "}
                      <span>
                        {referral !== null ? `-$${referral.toFixed(2)}` : "N/A"}
                      </span>
                    </div>
                    {fulfillmentMode === "FBA" && (
                      <>
                        <div className="flex justify-between text-slate-400">
                          <span>FBA Fee</span>{" "}
                          <span>
                            {fba !== null ? `-$${fba.toFixed(2)}` : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Storage (1mo)</span>{" "}
                          <span>
                            {storage !== null
                              ? `-$${storage.toFixed(2)}`
                              : "N/A"}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="border-t border-slate-700 pt-2 flex justify-between font-bold text-slate-200">
                      <span>Total Fees/Costs</span>
                      <span className="text-red-400">
                        {profit === null
                          ? "Unavailable"
                          : `-$${(salePrice - profit - buyCost).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Results */}
                <div className="flex flex-col justify-center gap-6">
                  <div className="text-center">
                    <div className="text-sm text-slate-400 uppercase font-bold mb-1">
                      Net Profit / Unit
                    </div>
                    <div
                      className={`text-5xl font-black ${profit > 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {profit === null
                        ? "Unavailable"
                        : `$${profit.toFixed(2)}`}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700">
                      <div
                        className={`text-2xl font-bold ${roi > 30 ? "text-green-400" : "text-yellow-400"}`}
                      >
                        {roi === null ? "Unavailable" : `${roi}%`}
                      </div>
                      <div className="text-xs text-slate-500 font-bold uppercase">
                        ROI
                      </div>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700">
                      <div
                        className={`text-2xl font-bold ${margin > 15 ? "text-green-400" : "text-yellow-400"}`}
                      >
                        {margin === null ? "Unavailable" : `${margin}%`}
                      </div>
                      <div className="text-xs text-slate-500 font-bold uppercase">
                        Margin
                      </div>
                    </div>
                  </div>
                  {targetRoi > 0 && roi !== null && (
                    <div
                      className={`rounded-lg border px-4 py-2 text-center text-xs font-bold ${roi >= targetRoi ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}
                    >
                      {roi >= targetRoi
                        ? `Meets your ${targetRoi}% target`
                        : `${(targetRoi - roi).toFixed(1)}pt below your ${targetRoi}% target`}
                    </div>
                  )}
                </div>
              </div>

              {/* Sourcing & Notes */}
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                    Sourcing &amp; Notes
                  </h3>
                  <span className="text-xs text-slate-500">
                    Saved locally on this device
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-slate-400 text-xs uppercase font-bold">
                      Supplier URL
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="url"
                        value={supplierUrl}
                        onChange={(e) => setSupplierUrl(e.target.value)}
                        placeholder="https://alibaba.com/..."
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amz-accent"
                      />
                      {safeWebUrl(supplierUrl) && (
                        <a
                          href={safeWebUrl(supplierUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 rounded bg-slate-700 p-2 text-slate-300 transition hover:text-white"
                          aria-label="Open supplier link"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs uppercase font-bold">
                      Target ROI %
                    </label>
                    <input
                      type="number"
                      value={targetRoi || ""}
                      onChange={(e) =>
                        setTargetRoi(parseFloat(e.target.value) || 0)
                      }
                      placeholder="30"
                      className="mt-1 w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amz-accent"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-slate-400 text-xs uppercase font-bold">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Sourcing terms, MOQ, lead time, red flags..."
                    className="mt-1 w-full resize-none bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-amz-accent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* RISKS TAB */}
          {activeTab === "risks" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div
                  className={`p-4 rounded-xl border ${riskDataUnavailable ? "bg-slate-800 border-slate-700 text-slate-400" : product.isIpRisk ? "bg-red-500/10 border-red-500 text-red-400" : "bg-green-500/10 border-green-500 text-green-400"}`}
                >
                  <div className="flex items-center gap-2 font-bold mb-2">
                    <ShieldCheck size={20} /> IP Complaints
                  </div>
                  <p className="text-sm opacity-80">
                    {riskDataUnavailable
                      ? "Not provided by the current Amazon provider."
                      : product.isIpRisk
                        ? "Warning: Brand known for IP claims."
                        : "Low Risk: No recent complaints detected."}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl border ${riskDataUnavailable ? "bg-slate-800 border-slate-700 text-slate-400" : product.isHazmat ? "bg-orange-500/10 border-orange-500 text-orange-400" : "bg-slate-800 border-slate-700 text-slate-400"}`}
                >
                  <div className="flex items-center gap-2 font-bold mb-2">
                    <Flame size={20} /> Hazmat Status
                  </div>
                  <p className="text-sm opacity-80">
                    {riskDataUnavailable
                      ? "Not provided by the current Amazon provider."
                      : product.isHazmat
                        ? "Warning: Product flagged as Hazmat."
                        : "Standard Product."}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl border ${riskDataUnavailable ? "bg-slate-800 border-slate-700 text-slate-400" : product.isOversized ? "bg-yellow-500/10 border-yellow-500 text-yellow-400" : "bg-slate-800 border-slate-700 text-slate-400"}`}
                >
                  <div className="flex items-center gap-2 font-bold mb-2">
                    <Box size={20} /> Size Tier
                  </div>
                  <p className="text-sm opacity-80">
                    {riskDataUnavailable
                      ? "Not provided by the current Amazon provider."
                      : product.isOversized
                        ? "Oversized: Higher FBA Fees."
                        : "Standard Size."}
                  </p>
                </div>
              </div>

              {/* Seasonality */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Calendar size={18} /> Seasonality
                </h3>
                <div className="flex gap-2 mb-4">
                  {product.seasonalityTags.length > 0 ? (
                    product.seasonalityTags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="bg-slate-700/60 text-slate-300 px-3 py-1 rounded-full text-xs font-bold border border-slate-600">
                      Not provided
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm">
                  {product.seasonalityTags.length > 0
                    ? `Historical data suggests this product performs best during ${product.seasonalityTags.join(", ")}. Ensure stock is sent in 30 days prior.`
                    : "Seasonality is not included in the current Amazon product response."}
                </p>
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <div className="h-[400px]">
              {hasHistory ? (
                <Suspense
                  fallback={
                    <div className="h-full flex items-center justify-center bg-slate-900 rounded-lg border border-slate-800 text-slate-400">
                      <Loader2 className="animate-spin mr-2" size={16} />
                      Loading chart...
                    </div>
                  }
                >
                  <TrendChart
                    priceData={product.priceHistory}
                    bsrData={product.bsrHistory}
                  />
                </Suspense>
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-900 rounded-lg border border-slate-800 text-center text-slate-400">
                  Historical price and rank data is not included in the current
                  Amazon response.
                </div>
              )}
              <div className="mt-4 text-center text-xs text-slate-500">
                {hasHistory
                  ? "Showing available history from the connected provider."
                  : "Connect a provider with history support to populate this chart."}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductAnalysis;
