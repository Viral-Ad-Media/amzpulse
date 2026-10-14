import React, { useEffect } from 'react';
import { ArrowRight, Menu, X, Zap } from 'lucide-react';
import { PUBLIC_NAV, REPO_URL, hashHref } from './links';
import { LinkButton } from './primitives';

type PublicLayoutProps = {
  routePath: string;
  mobileNavOpen: boolean;
  onToggleMobileNav: () => void;
  children: React.ReactNode;
};

const FOOTER_COLUMNS = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: hashHref('/features') },
      { label: 'Pricing', href: hashHref('/pricing') },
      { label: 'Open workspace', href: hashHref('/app') }
    ]
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: hashHref('/about') },
      { label: 'Contact', href: hashHref('/contact') },
      { label: 'GitHub', href: REPO_URL, external: true }
    ]
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy policy', href: hashHref('/privacy') },
      { label: 'Terms of service', href: hashHref('/terms') }
    ]
  }
];

const PublicLayout: React.FC<PublicLayoutProps> = ({ routePath, mobileNavOpen, onToggleMobileNav, children }) => {
  const mobileMenuId = 'public-mobile-nav';

  useEffect(() => {
    if (!mobileNavOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onToggleMobileNav();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileNavOpen, onToggleMobileNav]);

  return (
    <div className="site-shell min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-amz-accent focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-slate-950"
      >
        Skip to content
      </a>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        <header className="glass-panel sticky top-4 z-40 rounded-[1.75rem] border border-white/10 px-4 py-3 shadow-[0_20px_60px_rgba(2,6,23,0.28)] sm:rounded-full">
          <div className="flex items-center justify-between gap-4">
            <a href={hashHref('/')} className="flex items-center gap-3 text-white" aria-label="AmzPulse home">
              <span className="inline-flex rounded-2xl bg-amz-accent/90 p-2 text-slate-950 shadow-[0_12px_30px_rgba(255,153,0,0.28)]">
                <Zap size={18} aria-hidden="true" />
              </span>
              <span className="text-lg font-bold tracking-tight">AmzPulse</span>
            </a>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
              {PUBLIC_NAV.map((item) => {
                const active = routePath === item.path;
                return (
                  <a
                    key={item.path}
                    href={hashHref(item.path)}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      active ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              <a
                href={hashHref('/app')}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/5 hover:text-white"
              >
                Sign in
              </a>
              <LinkButton href={hashHref('/app')} withArrow className="px-4 py-2">
                Open workspace
              </LinkButton>
            </div>

            <button
              type="button"
              onClick={onToggleMobileNav}
              className="inline-flex rounded-full border border-white/10 bg-white/5 p-2 text-slate-100 md:hidden"
              aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={mobileNavOpen}
              aria-controls={mobileMenuId}
            >
              {mobileNavOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            </button>
          </div>

          {mobileNavOpen && (
            <div id={mobileMenuId} className="mt-4 grid gap-1 border-t border-white/10 pt-4 md:hidden">
              {PUBLIC_NAV.map((item) => (
                <a
                  key={item.path}
                  href={hashHref(item.path)}
                  aria-current={routePath === item.path ? 'page' : undefined}
                  className={`rounded-2xl px-4 py-3 text-sm transition hover:bg-white/5 hover:text-white ${
                    routePath === item.path ? 'bg-white/10 text-white' : 'text-slate-200'
                  }`}
                >
                  {item.label}
                </a>
              ))}
              <a
                href={hashHref('/app')}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-amz-accent px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-orange-400"
              >
                Open workspace
                <ArrowRight size={15} aria-hidden="true" />
              </a>
            </div>
          )}
        </header>

        <main id="main-content" className="pt-8" tabIndex={-1}>
          {children}
        </main>

        <footer className="mt-16 rounded-[1.75rem] border border-white/10 bg-slate-950/55 px-6 py-10 shadow-[0_20px_70px_rgba(2,6,23,0.24)] sm:px-10">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
            <div>
              <a href={hashHref('/')} className="inline-flex items-center gap-3 text-white">
                <span className="inline-flex rounded-2xl bg-amz-accent/90 p-2 text-slate-950">
                  <Zap size={16} aria-hidden="true" />
                </span>
                <span className="text-lg font-bold tracking-tight">AmzPulse</span>
              </a>
              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
                Amazon US product research with real provider data, honest gaps, shared watchlists, and batch runs built for sourcing teams.
              </p>
            </div>
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.heading}>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{column.heading}</div>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-slate-300 transition hover:text-white"
                        {...('external' in link && link.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>&copy; {new Date().getFullYear()} AmzPulse. All rights reserved.</span>
            <span>Amazon is a trademark of Amazon.com, Inc. AmzPulse is not affiliated with Amazon.</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PublicLayout;
