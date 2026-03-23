import React, { Suspense, lazy, useEffect, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Blocks,
  CheckCircle2,
  CreditCard,
  Layers3,
  Menu,
  Radar,
  ShieldCheck,
  Sparkles,
  Workflow,
  X,
  Zap
} from 'lucide-react';
import { BillingPlan, getBillingPlans, setAuthToken as setApiAuthToken } from './services/apiClient';

const AppWorkspace = lazy(() => import('./components/AppWorkspace'));

type RouteId =
  | 'home'
  | 'features'
  | 'pricing'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'billing-success'
  | 'billing-cancel'
  | 'app'
  | 'not-found';

type RouteMeta = {
  title: string;
  description: string;
};

const FALLBACK_PLANS: BillingPlan[] = [
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

const PUBLIC_NAV = [
  { label: 'Features', path: '/features' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' }
];

const ROUTES: Record<string, RouteId> = {
  '/': 'home',
  '/features': 'features',
  '/pricing': 'pricing',
  '/about': 'about',
  '/contact': 'contact',
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/billing/success': 'billing-success',
  '/billing/cancel': 'billing-cancel',
  '/app': 'app'
};

const ROUTE_META: Record<RouteId, RouteMeta> = {
  home: {
    title: 'AmzPulse | Amazon Research Workspace',
    description: 'Track Amazon product demand, compare opportunities, and run faster sourcing research with AmzPulse.'
  },
  features: {
    title: 'Features | AmzPulse',
    description: 'Explore live product lookups, watchlists, AI analysis, and batch workflows built for Amazon operators.'
  },
  pricing: {
    title: 'Pricing | AmzPulse',
    description: 'Compare AmzPulse plans and see monthly ASIN limits, batch sizes, and upgrade options.'
  },
  about: {
    title: 'About | AmzPulse',
    description: 'Learn how AmzPulse helps Amazon teams move from manual checks to confident product decisions.'
  },
  contact: {
    title: 'Contact | AmzPulse',
    description: 'Find the right path for support, billing questions, and implementation conversations.'
  },
  privacy: {
    title: 'Privacy Policy | AmzPulse',
    description: 'Read how AmzPulse handles account data, product research activity, and operational analytics.'
  },
  terms: {
    title: 'Terms of Service | AmzPulse',
    description: 'Review AmzPulse service terms, acceptable use, billing guidance, and account responsibilities.'
  },
  'billing-success': {
    title: 'Billing Confirmed | AmzPulse',
    description: 'Your AmzPulse billing update was received successfully.'
  },
  'billing-cancel': {
    title: 'Billing Update Canceled | AmzPulse',
    description: 'Your AmzPulse billing change was canceled before confirmation.'
  },
  app: {
    title: 'Workspace | AmzPulse',
    description: 'Use the AmzPulse workspace to research products, save watchlists, and run batch analysis.'
  },
  'not-found': {
    title: 'Page Not Found | AmzPulse',
    description: 'The page you requested could not be found.'
  }
};

const normalizePath = (value: string) => {
  if (!value) return '/';
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  const withoutQuery = withLeadingSlash.split('?')[0].split('#')[0];
  const normalized = withoutQuery.replace(/\/+$/, '');
  return normalized || '/';
};

const stripBasePath = (pathname: string) => {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  if (!base || base === '/') return pathname || '/';
  if (!pathname.startsWith(base)) return pathname || '/';
  const stripped = pathname.slice(base.length);
  return stripped.startsWith('/') ? stripped : `/${stripped}`;
};

const readPathFromLocation = () => {
  const hash = window.location.hash.replace(/^#/, '');
  if (hash.startsWith('/')) {
    return normalizePath(hash);
  }
  return normalizePath(stripBasePath(window.location.pathname || '/'));
};

const hashHref = (path: string) => `#${normalizePath(path)}`;

const routeCardBase =
  'glass-panel relative overflow-hidden rounded-[1.75rem] border border-white/10 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.32)]';

const App: React.FC = () => {
  const [routePath, setRoutePath] = useState<string>(() => (typeof window === 'undefined' ? '/' : readPathFromLocation()));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [plans, setPlans] = useState<BillingPlan[]>(FALLBACK_PLANS);

  useEffect(() => {
    const storedToken = localStorage.getItem('amzpulse_token');
    if (storedToken) {
      setApiAuthToken(storedToken);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const syncRoute = () => {
      setRoutePath(readPathFromLocation());
    };

    syncRoute();
    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);

    void (async () => {
      try {
        const nextPlans = await getBillingPlans();
        if (!cancelled && Array.isArray(nextPlans) && nextPlans.length > 0) {
          setPlans(nextPlans);
        }
      } catch {
        // Keep static fallback pricing when the backend is unavailable.
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
    };
  }, []);

  const routeId = ROUTES[routePath] || 'not-found';

  useEffect(() => {
    setMobileNavOpen(false);
    if (routeId !== 'app') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }

    const meta = ROUTE_META[routeId];
    document.title = meta.title;

    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta');
      descriptionTag.setAttribute('name', 'description');
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.setAttribute('content', meta.description);
  }, [routeId]);

  if (routeId === 'app') {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
            <div className="glass-panel rounded-3xl border border-white/10 px-8 py-6 text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-500 border-t-amz-accent" />
              Loading workspace...
            </div>
          </div>
        }
      >
        <AppWorkspace />
      </Suspense>
    );
  }

  const orderedPlans = [...plans].sort((left, right) => left.price - right.price);
  const homeFeatureCards = [
    {
      title: 'Research With Context',
      copy: 'Pull a product, see movement signals, check watchlists, and keep every sourcing session in one place.',
      icon: Radar
    },
    {
      title: 'Move Faster In Batches',
      copy: 'Process multiple ASINs in one run so shortlist reviews stop feeling like spreadsheet triage.',
      icon: Layers3
    },
    {
      title: 'Keep The Signal Clean',
      copy: 'Spot brand risk, demand quality, and fee pressure before a listing becomes an expensive distraction.',
      icon: ShieldCheck
    }
  ];

  const workflowSteps = [
    {
      title: '1. Capture the market',
      copy: 'Search by ASIN or category, then sort by price range, BSR ceiling, or seasonality signal.'
    },
    {
      title: '2. Score the opportunity',
      copy: 'Open a detail view to inspect estimated sales, seller pressure, fees, and AI-assisted notes.'
    },
    {
      title: '3. Turn research into action',
      copy: 'Save promising listings, export batch results, and revisit the same workspace later with your team.'
    }
  ];

  const renderPage = () => {
    if (routeId === 'home') {
      return (
        <>
          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,153,0,0.16),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.18),transparent_28%),linear-gradient(140deg,rgba(15,23,42,0.95),rgba(2,6,23,0.84))] px-6 py-10 shadow-[0_30px_90px_rgba(2,6,23,0.38)] sm:px-10 sm:py-14">
            <div className="ambient-orb left-[-4rem] top-[-2rem] h-40 w-40 bg-amz-accent/30" />
            <div className="ambient-orb right-[-3rem] top-10 h-56 w-56 bg-cyan-400/20" />
            <div className="grid gap-10 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
              <div className="fade-up relative z-10">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-slate-300">
                  <Sparkles size={14} className="text-amz-accent" />
                  Amazon Research Workspace
                </div>
                <h1 className="max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                  Product research that feels like an operator dashboard, not another spreadsheet.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  AmzPulse helps Amazon teams surface product trends, compare risk, and move from one-off checks to a repeatable workflow.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href={hashHref('/app')}
                    className="inline-flex items-center gap-2 rounded-full bg-amz-accent px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-orange-400"
                  >
                    Open Workspace
                    <ArrowRight size={16} />
                  </a>
                  <a
                    href={hashHref('/pricing')}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/25 hover:bg-white/10"
                  >
                    Explore Plans
                  </a>
                </div>
                <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-300">
                  <div>
                    <div className="text-2xl font-black text-white">300+</div>
                    <div>ASINs per month on the starter workflow</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white">100</div>
                    <div>ASIN batch runs available on Pro</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white">1</div>
                    <div>Workspace for watchlists, pricing, and AI notes</div>
                  </div>
                </div>
              </div>

              <div className="fade-up grid gap-4 lg:justify-self-end">
                <div className={`${routeCardBase} max-w-md`}>
                  <div className="mb-4 inline-flex rounded-full bg-amz-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amz-accent">
                    Research signal
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Demand Pulse</div>
                      <div className="mt-2 flex items-end justify-between">
                        <span className="text-3xl font-black text-white">84</span>
                        <span className="text-sm text-emerald-300">Healthy</span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Seller Count</div>
                      <div className="mt-2 flex items-end justify-between">
                        <span className="text-3xl font-black text-white">6</span>
                        <span className="text-sm text-cyan-300">Manageable</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/65 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Suggested action</span>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-200">Pursue</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      Attractive demand, fees within tolerance, and no obvious IP or hazmat blockers in the current pass.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-3">
            {homeFeatureCards.map((card, index) => (
              <article key={card.title} className={`${routeCardBase} fade-up`} style={{ animationDelay: `${index * 90}ms` }}>
                <div className="mb-4 inline-flex rounded-2xl border border-white/10 bg-white/5 p-3 text-amz-accent">
                  <card.icon size={22} />
                </div>
                <h2 className="text-2xl font-bold text-white">{card.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{card.copy}</p>
              </article>
            ))}
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className={`${routeCardBase} fade-up`}>
              <div className="mb-3 text-xs uppercase tracking-[0.24em] text-amz-accent">How It Flows</div>
              <h2 className="text-3xl font-bold text-white">A cleaner path from opportunity list to decision.</h2>
              <div className="mt-6 space-y-4">
                {workflowSteps.map((step) => (
                  <div key={step.title} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="font-semibold text-white">{step.title}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{step.copy}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${routeCardBase} fade-up`}>
              <div className="mb-3 text-xs uppercase tracking-[0.24em] text-cyan-300">Built For Real Work</div>
              <h2 className="text-3xl font-bold text-white">The app, the pricing surface, and the billing return pages now live in one routed shell.</h2>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                That means marketing pages, legal pages, and Stripe success or cancel states can all resolve correctly on static deployments instead of dropping people onto missing routes.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Workspace', copy: 'Dashboard, research, watchlist, and settings' },
                  { label: 'Static Pages', copy: 'Pricing, privacy, terms, about, and contact' },
                  { label: 'Checkout Returns', copy: 'Billing success and cancel states now have dedicated pages' },
                  { label: 'Bundle Shape', copy: 'The heavy workspace code only loads when someone opens the app' }
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="font-semibold text-white">{item.label}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      );
    }

    if (routeId === 'features') {
      const featureGroups = [
        {
          title: 'Discovery',
          icon: BarChart3,
          points: ['ASIN lookups with live fetch fallback', 'Category, price, BSR, and season filters', 'Watchlist-driven research loops']
        },
        {
          title: 'Decision Support',
          icon: Radar,
          points: ['AI-assisted sell-potential notes', 'Profit and ROI calculator', 'Competition and risk snapshots in the product view']
        },
        {
          title: 'Operator Workflow',
          icon: Workflow,
          points: ['Batch analysis for authorized seats', 'CSV export for shortlist review', 'Account-aware usage and billing states']
        }
      ];

      return (
        <section className="grid gap-6">
          <div className={`${routeCardBase} fade-up`}>
            <div className="mb-3 text-xs uppercase tracking-[0.24em] text-amz-accent">Feature Map</div>
            <h1 className="text-4xl font-black text-white">A workspace shaped around how Amazon research actually happens.</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
              The product app stays focused on research mechanics while the public site handles education, pricing, and billing follow-through.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {featureGroups.map((group, index) => (
              <article key={group.title} className={`${routeCardBase} fade-up`} style={{ animationDelay: `${index * 100}ms` }}>
                <div className="mb-4 inline-flex rounded-2xl border border-white/10 bg-white/5 p-3 text-amz-accent">
                  <group.icon size={22} />
                </div>
                <h2 className="text-2xl font-bold text-white">{group.title}</h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-300">
                  {group.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-300" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className={`${routeCardBase} fade-up`}>
            <div className="grid gap-5 lg:grid-cols-4">
              {[
                { label: 'Lazy-loaded workspace', value: 'Yes', copy: 'The dashboard chunk is now separate from public pages.' },
                { label: 'Static route coverage', value: '8 pages', copy: 'Features, pricing, about, contact, privacy, terms, and billing states.' },
                { label: 'Batch export', value: 'CSV', copy: 'Batch results can now be exported instead of showing a dead button.' },
                { label: 'Filter depth', value: 'Expanded', copy: 'Season and BSR filters now participate in the workspace query flow.' }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
                  <div className="mt-2 text-3xl font-black text-white">{item.value}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (routeId === 'pricing') {
      return (
        <section className="grid gap-6">
          <div className={`${routeCardBase} fade-up`}>
            <div className="mb-3 text-xs uppercase tracking-[0.24em] text-amz-accent">Pricing</div>
            <h1 className="text-4xl font-black text-white">Choose the pace that matches your sourcing workflow.</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
              Pricing is mirrored from the API when it is available, with static fallback values so the page stays useful even on static deployments.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {orderedPlans.map((plan, index) => {
              const highlighted = plan.name === 'pro';
              return (
                <article
                  key={plan.name}
                  className={`${routeCardBase} fade-up ${highlighted ? 'border-amz-accent/40 bg-[linear-gradient(180deg,rgba(255,153,0,0.12),rgba(15,23,42,0.88))]' : ''}`}
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{plan.name}</div>
                      <h2 className="mt-2 text-3xl font-black text-white">{plan.name === 'pro' ? 'Pro' : 'Starter'}</h2>
                    </div>
                    {highlighted && (
                      <span className="rounded-full bg-amz-accent px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-950">
                        Recommended
                      </span>
                    )}
                  </div>

                  <div className="mt-6 flex items-end gap-2">
                    <span className="text-5xl font-black text-white">${plan.price}</span>
                    <span className="pb-1 text-sm text-slate-400">/ month</span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-300">{plan.description}</p>

                  <div className="mt-6 grid gap-3">
                    {[
                      `${plan.monthlyAsinQuota.toLocaleString()} ASINs per month`,
                      `${plan.maxBatchSize.toLocaleString()} ASINs per batch`,
                      plan.price === 0 ? 'Open the workspace and start researching' : 'Owner/admin seats can launch billing from the workspace'
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-slate-200">
                        <CheckCircle2 size={16} className="text-emerald-300" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <a
                      href={hashHref('/app')}
                      className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition ${
                        highlighted
                          ? 'bg-amz-accent text-slate-950 hover:bg-orange-400'
                          : 'border border-white/15 bg-white/5 text-slate-100 hover:border-white/25 hover:bg-white/10'
                      }`}
                    >
                      {highlighted ? 'Open Billing In Workspace' : 'Launch Starter Workspace'}
                      <ArrowRight size={16} />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      );
    }

    if (routeId === 'about') {
      return (
        <section className="grid gap-6">
          <div className={`${routeCardBase} fade-up`}>
            <div className="mb-3 text-xs uppercase tracking-[0.24em] text-amz-accent">About AmzPulse</div>
            <h1 className="text-4xl font-black text-white">Built to reduce manual friction in Amazon product research.</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
              The core idea is straightforward: keep the research session, the shortlisting logic, and the billing path in one surface so work stays coherent from first check to recurring usage.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                title: 'Clarity',
                copy: 'Each screen should answer a real operator question instead of adding more ceremony around the work.'
              },
              {
                title: 'Momentum',
                copy: 'Fast route handling, lighter initial bundles, and reusable watchlist states help teams keep moving.'
              },
              {
                title: 'Practicality',
                copy: 'The product avoids overpromising. It leans on concrete usage limits, visible plan rules, and exportable output.'
              }
            ].map((item, index) => (
              <article key={item.title} className={`${routeCardBase} fade-up`} style={{ animationDelay: `${index * 100}ms` }}>
                <h2 className="text-2xl font-bold text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.copy}</p>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (routeId === 'contact') {
      return (
        <section className="grid gap-6">
          <div className={`${routeCardBase} fade-up`}>
            <div className="mb-3 text-xs uppercase tracking-[0.24em] text-amz-accent">Contact</div>
            <h1 className="text-4xl font-black text-white">Route the question to the right place and we can move faster.</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
              This site is currently optimized for static delivery, so the contact page acts as a routing guide rather than a live form endpoint.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                title: 'Product Support',
                copy: 'Include the ASIN, the view you were using, and the exact step that failed so the issue can be reproduced quickly.'
              },
              {
                title: 'Billing Questions',
                copy: 'Use the owner or admin account that manages the workspace plan. Billing routes return to dedicated success and cancel pages now.'
              },
              {
                title: 'Implementation',
                copy: 'If you are pairing the frontend with the API, share your frontend origin list and whether the site is deployed at root or a subpath.'
              }
            ].map((item, index) => (
              <article key={item.title} className={`${routeCardBase} fade-up`} style={{ animationDelay: `${index * 100}ms` }}>
                <h2 className="text-2xl font-bold text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.copy}</p>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (routeId === 'privacy') {
      return (
        <section className={`${routeCardBase} fade-up`}>
          <div className="mb-3 text-xs uppercase tracking-[0.24em] text-amz-accent">Privacy Policy</div>
          <h1 className="text-4xl font-black text-white">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-400">Last updated March 23, 2026.</p>
          <div className="mt-8 space-y-6 text-sm leading-7 text-slate-300">
            <section>
              <h2 className="text-xl font-bold text-white">What We Collect</h2>
              <p>AmzPulse stores the minimum account and workspace information needed to authenticate users, save watchlists, meter plan usage, and support billing flows.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-white">Research Data</h2>
              <p>Product lookups, watchlist actions, and batch activity may be retained to improve continuity across sessions and to enforce plan quotas.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-white">Billing Data</h2>
              <p>Subscription checkout and renewal events are processed through Stripe. AmzPulse stores the subscription references needed to reflect plan status in the workspace.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-white">Security</h2>
              <p>Access is protected through token-based authentication and role-aware billing controls. Admin or owner seats are required for billing management routes.</p>
            </section>
          </div>
        </section>
      );
    }

    if (routeId === 'terms') {
      return (
        <section className={`${routeCardBase} fade-up`}>
          <div className="mb-3 text-xs uppercase tracking-[0.24em] text-amz-accent">Terms of Service</div>
          <h1 className="text-4xl font-black text-white">Terms of Service</h1>
          <p className="mt-2 text-sm text-slate-400">Last updated March 23, 2026.</p>
          <div className="mt-8 space-y-6 text-sm leading-7 text-slate-300">
            <section>
              <h2 className="text-xl font-bold text-white">Use Of Service</h2>
              <p>AmzPulse is provided for marketplace research, sourcing analysis, and workspace collaboration. You are responsible for validating any operational decisions you make from the output.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-white">Accounts And Roles</h2>
              <p>Each workspace account must use accurate credentials. Some actions, including billing management and plan upgrades, are limited to owner or admin roles.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-white">Plan Limits</h2>
              <p>Usage quotas and batch sizes are enforced by plan. Exceeding a quota may block new batch requests until the cycle resets or the workspace upgrades.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-white">Availability</h2>
              <p>The service may change over time. Public pages are delivered statically and the authenticated workspace depends on API availability for live account and billing actions.</p>
            </section>
          </div>
        </section>
      );
    }

    if (routeId === 'billing-success' || routeId === 'billing-cancel') {
      const isSuccess = routeId === 'billing-success';
      return (
        <section className={`${routeCardBase} fade-up max-w-3xl`}>
          <div className={`mb-4 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${isSuccess ? 'bg-emerald-500/15 text-emerald-200' : 'bg-amber-500/15 text-amber-200'}`}>
            {isSuccess ? 'Billing Confirmed' : 'Billing Update Canceled'}
          </div>
          <h1 className="text-4xl font-black text-white">
            {isSuccess ? 'Your billing update was received.' : 'Your billing change was canceled before completion.'}
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-300">
            {isSuccess
              ? 'Return to the workspace to confirm the updated plan and continue with batch analysis or watchlist work.'
              : 'Nothing was changed on your account. You can return to pricing or reopen billing from the workspace whenever you are ready.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={hashHref('/app')} className="inline-flex items-center gap-2 rounded-full bg-amz-accent px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-orange-400">
              Open Workspace
              <ArrowRight size={16} />
            </a>
            <a href={hashHref('/pricing')} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/25 hover:bg-white/10">
              Review Pricing
            </a>
          </div>
        </section>
      );
    }

    return (
      <section className={`${routeCardBase} fade-up max-w-3xl`}>
        <div className="mb-3 text-xs uppercase tracking-[0.24em] text-amz-accent">Not Found</div>
        <h1 className="text-4xl font-black text-white">This route does not exist yet.</h1>
        <p className="mt-4 text-base leading-7 text-slate-300">
          The public shell now supports the core static pages, billing return routes, and the workspace entrypoint. This path is outside that set.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={hashHref('/')} className="inline-flex items-center gap-2 rounded-full bg-amz-accent px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-orange-400">
            Back Home
          </a>
          <a href={hashHref('/app')} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/25 hover:bg-white/10">
            Open Workspace
          </a>
        </div>
      </section>
    );
  };

  return (
    <div className="site-shell min-h-screen">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-5 sm:px-6 lg:px-8">
        <header className="glass-panel sticky top-5 z-40 rounded-full border border-white/10 px-4 py-3 shadow-[0_20px_60px_rgba(2,6,23,0.28)]">
          <div className="flex items-center justify-between gap-4">
            <a href={hashHref('/')} className="flex items-center gap-3 text-white">
              <span className="inline-flex rounded-2xl bg-amz-accent/90 p-2 text-slate-950 shadow-[0_12px_30px_rgba(255,153,0,0.28)]">
                <Zap size={18} />
              </span>
              <span className="text-lg font-bold tracking-tight">AmzPulse</span>
            </a>

            <nav className="hidden items-center gap-2 md:flex">
              {PUBLIC_NAV.map((item) => {
                const active = routePath === item.path;
                return (
                  <a
                    key={item.path}
                    href={hashHref(item.path)}
                    className={`rounded-full px-4 py-2 text-sm transition ${active ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <a href={hashHref('/pricing')} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/25 hover:bg-white/10">
                Pricing
              </a>
              <a href={hashHref('/app')} className="inline-flex items-center gap-2 rounded-full bg-amz-accent px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-orange-400">
                Open Workspace
                <ArrowRight size={15} />
              </a>
            </div>

            <button
              onClick={() => setMobileNavOpen((current) => !current)}
              className="inline-flex rounded-full border border-white/10 bg-white/5 p-2 text-slate-100 md:hidden"
              aria-label="Toggle navigation"
            >
              {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {mobileNavOpen && (
            <div className="mt-4 grid gap-2 border-t border-white/10 pt-4 md:hidden">
              {PUBLIC_NAV.map((item) => (
                <a key={item.path} href={hashHref(item.path)} className="rounded-2xl px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5 hover:text-white">
                  {item.label}
                </a>
              ))}
              <a href={hashHref('/app')} className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-amz-accent px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-orange-400">
                Open Workspace
                <ArrowRight size={15} />
              </a>
            </div>
          )}
        </header>

        <main className="pt-8">{renderPage()}</main>

        <footer className="mt-12 rounded-[1.75rem] border border-white/10 bg-slate-950/55 px-6 py-8 shadow-[0_20px_70px_rgba(2,6,23,0.24)]">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                <Blocks size={14} className="text-amz-accent" />
                Routed static shell
              </div>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                AmzPulse now has dedicated pages for pricing, legal copy, contact guidance, and billing return states, while keeping the heavier workspace bundle behind the app route.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              {[
                { label: 'Privacy', path: '/privacy' },
                { label: 'Terms', path: '/terms' },
                { label: 'Pricing', path: '/pricing' },
                { label: 'Workspace', path: '/app' }
              ].map((item) => (
                <a key={item.path} href={hashHref(item.path)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-200 transition hover:border-white/20 hover:text-white">
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-slate-500">
            <span className="inline-flex items-center gap-2">
              <CreditCard size={13} />
              Billing routes supported
            </span>
            <span className="inline-flex items-center gap-2">
              <Workflow size={13} />
              Workspace lazy loaded
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={13} />
              Static-host friendly navigation
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
