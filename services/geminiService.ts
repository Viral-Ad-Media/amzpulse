import { Product, AnalysisResult } from "../types";
import { analyzeProductWithAi } from "./apiClient";

export const analyzeProductSellPotential = async (
  product: Product,
  userStats?: { buyCost: number; profit: number; roi: number },
): Promise<AnalysisResult> => {
  return (await analyzeProductWithAi(product, userStats)) as AnalysisResult;
};
