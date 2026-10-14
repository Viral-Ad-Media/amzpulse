import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { BillingPlan, getBillingPlans, setAuthToken as setApiAuthToken } from './services/apiClient';
import PasswordRecoveryPanel from './components/PasswordRecoveryPanel';
import {
  AboutPage,
  BillingResultPage,
  ContactPage,
  FALLBACK_PLANS,
  FeaturesPage,
  HomePage,
  NotFoundPage,
  PricingPage,
  PrivacyPage,
  PublicLayout,
  TermsPage,
  hashHref,
  normalizePath
} from './components/public';

const AppWorkspace = lazy(() => import('./components/AppWorkspace'));

type RouteId =
  | 'home'
  | 'features'
  | 'pricing'
  | 'about'
  | 'contact'
  | 'forgot-password'
  | 'reset-password'
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

const ROUTES: Record<string, RouteId> = {
  '/': 'home',
  '/features': 'features',
  '/pricing': 'pricing',
  '/about': 'about',
  '/contact': 'contact',
  '/forgot-password': 'forgot-password',
  '/reset-password': 'reset-password',
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/billing/success': 'billing-success',
  '/billing/cancel': 'billing-cancel',
  '/app': 'app'
};

const ROUTE_META: Record<RouteId, RouteMeta> = {
  home: {
    title: 'AmzPulse | Amazon Product Research Workspace',
    description:
      'Find Amazon US products worth sourcing. AmzPulse combines demand, pricing, fees, and competition in one research workspace with batch runs and synced watchlists.'
  },
  features: {
    title: 'Features | AmzPulse',
    description:
      'Explore ASIN lookups, price and rank history, profit and ROI math, batch screening with CSV export, and synced watchlists in AmzPulse.'
  },
  pricing: {
    title: 'Pricing | AmzPulse',
    description: 'Compare the free Starter plan and Pro plan for AmzPulse, including monthly ASIN quotas, batch sizes, and AI analysis limits.'
  },
  about: {
    title: 'About | AmzPulse',
    description: 'Learn why AmzPulse exists, how it handles provider data, and the principles behind the research workspace.'
  },
  contact: {
    title: 'Contact | AmzPulse',
    description: 'Find the right channel for AmzPulse product support, billing questions, and implementation help.'
  },
  'forgot-password': {
    title: 'Forgot Password | AmzPulse',
    description: 'Generate a password reset link for your AmzPulse account.'
  },
  'reset-password': {
    title: 'Reset Password | AmzPulse',
    description: 'Set a new password for your AmzPulse account using a reset token.'
  },
  privacy: {
    title: 'Privacy Policy | AmzPulse',
    description: 'Read how AmzPulse handles account data, product research activity, and billing information.'
  },
  terms: {
    title: 'Terms of Service | AmzPulse',
    description: 'Review AmzPulse service terms, account roles, plan limits, and availability.'
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

const readHashQueryParam = (key: string) => {
  const hash = window.location.hash.replace(/^#/, '');
  const query = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  return new URLSearchParams(query).get(key) || '';
};

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
  const resetTokenFromLocation = typeof window === 'undefined' ? '' : readHashQueryParam('token');

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

  const toggleMobileNav = useCallback(() => setMobileNavOpen((current) => !current), []);

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

  const renderPage = () => {
    switch (routeId) {
      case 'home':
        return <HomePage plans={plans} />;
      case 'features':
        return <FeaturesPage />;
      case 'pricing':
        return <PricingPage plans={plans} />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      case 'forgot-password':
        return <PasswordRecoveryPanel mode="request" loginHref={hashHref('/app')} />;
      case 'reset-password':
        return <PasswordRecoveryPanel mode="reset" initialToken={resetTokenFromLocation} loginHref={hashHref('/app')} />;
      case 'privacy':
        return <PrivacyPage />;
      case 'terms':
        return <TermsPage />;
      case 'billing-success':
        return <BillingResultPage outcome="success" />;
      case 'billing-cancel':
        return <BillingResultPage outcome="cancel" />;
      default:
        return <NotFoundPage />;
    }
  };

  return (
    <PublicLayout routePath={routePath} mobileNavOpen={mobileNavOpen} onToggleMobileNav={toggleMobileNav}>
      {renderPage()}
    </PublicLayout>
  );
};

export default App;
