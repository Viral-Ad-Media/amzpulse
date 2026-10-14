import type { BillingPlan } from '../../services/apiClient';

export const FALLBACK_PLANS: BillingPlan[] = [
  {
    name: 'free',
    monthlyAsinQuota: 300,
    maxBatchSize: 20,
    price: 0,
    description: 'Starter access for lean research workflows.'
  },
  {
    name: 'pro',
    monthlyAsinQuota: 5000,
    maxBatchSize: 100,
    price: 99,
    description: 'Larger batch runs, richer analysis, and operator-level throughput.'
  }
];

export type PlanPresentation = {
  displayName: string;
  tagline: string;
  aiCalls: number | null;
  highlights: string[];
  cta: string;
  recommended: boolean;
};

const PLAN_PRESENTATION: Record<string, PlanPresentation> = {
  free: {
    displayName: 'Starter',
    tagline: 'Validate a handful of ideas each month without a card on file.',
    aiCalls: 50,
    highlights: ['ASIN lookups with price and rank history', 'Synced watchlists', 'Profit and ROI calculator', 'Local research notes and supplier links'],
    cta: 'Start for free',
    recommended: false
  },
  pro: {
    displayName: 'Pro',
    tagline: 'Built for operators who screen shortlists every week.',
    aiCalls: 1000,
    highlights: ['Everything in Starter', 'Larger batch runs with CSV export', 'Higher monthly ASIN and AI limits', 'Owner and admin billing controls'],
    cta: 'Upgrade in the workspace',
    recommended: true
  }
};

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const describePlan = (plan: BillingPlan): PlanPresentation =>
  PLAN_PRESENTATION[plan.name.toLowerCase()] ?? {
    displayName: titleCase(plan.name),
    tagline: plan.description,
    aiCalls: null,
    highlights: [],
    cta: 'Open the workspace',
    recommended: false
  };

export const sortPlans = (plans: BillingPlan[]) => [...plans].sort((left, right) => left.price - right.price);

export const formatPrice = (price: number) =>
  price === 0 ? '$0' : `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
