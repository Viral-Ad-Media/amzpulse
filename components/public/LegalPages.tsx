import React from 'react';
import { hashHref } from './links';
import { Card, Eyebrow } from './primitives';

type LegalSection = { id: string; heading: string; body: string[] };

const LegalDocument: React.FC<{
  path: string;
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}> = ({ path, eyebrow, title, updated, intro, sections }) => (
  <div className="grid gap-6 lg:grid-cols-[16rem_1fr] lg:items-start">
    <Card as="aside" className="fade-up lg:sticky lg:top-28">
      <Eyebrow tone="muted">On this page</Eyebrow>
      <nav aria-label={`${title} sections`}>
        <ol className="space-y-2 text-sm">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={hashHref(path)}
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="text-slate-300 transition hover:text-white"
              >
                {section.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-500">Last updated {updated}</div>
    </Card>

    <Card as="article" className="fade-up">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="text-4xl font-black text-white">{title}</h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">{intro}</p>
      <div className="mt-10 space-y-10">
        {sections.map((section, index) => (
          <section key={section.id} id={section.id} className="scroll-mt-28">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-sm font-bold tabular-nums text-amz-accent">{String(index + 1).padStart(2, '0')}</span>
              <h2 className="text-xl font-bold text-white">{section.heading}</h2>
            </div>
            <div className="mt-3 space-y-3 text-sm leading-7 text-slate-300">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Card>
  </div>
);

const LAST_UPDATED = 'March 23, 2026';

export const PrivacyPage: React.FC = () => (
  <LegalDocument
    path="/privacy"
    eyebrow="Privacy policy"
    title="Privacy Policy"
    updated={LAST_UPDATED}
    intro="This policy explains what AmzPulse stores, why it is stored, and how it is protected."
    sections={[
      {
        id: 'what-we-collect',
        heading: 'What we collect',
        body: [
          'AmzPulse stores the minimum account and workspace information needed to authenticate users, save watchlists, meter plan usage, and support billing flows.',
          'Research notes, supplier links, and calculator inputs are saved in your browser, scoped to your account and organization. They are not uploaded to our servers.'
        ]
      },
      {
        id: 'research-data',
        heading: 'Research data',
        body: [
          'Product lookups, watchlist actions, and batch activity may be retained to improve continuity across sessions and to enforce plan quotas.'
        ]
      },
      {
        id: 'billing-data',
        heading: 'Billing data',
        body: [
          'Subscription checkout and renewal events are processed through Stripe. AmzPulse stores the subscription references needed to reflect plan status in the workspace. Card details never touch AmzPulse systems.'
        ]
      },
      {
        id: 'security',
        heading: 'Security',
        body: [
          'Access is protected through token-based authentication and role-aware billing controls. Admin or owner seats are required for billing management routes.',
          'Provider and database credentials are held exclusively by the backend service and are never shipped to the browser.'
        ]
      }
    ]}
  />
);

export const TermsPage: React.FC = () => (
  <LegalDocument
    path="/terms"
    eyebrow="Terms of service"
    title="Terms of Service"
    updated={LAST_UPDATED}
    intro="These terms describe what you can expect from AmzPulse and what AmzPulse expects from you."
    sections={[
      {
        id: 'use-of-service',
        heading: 'Use of service',
        body: [
          'AmzPulse is provided for marketplace research, sourcing analysis, and workspace collaboration. You are responsible for validating any operational decisions you make from the output.',
          'AI output is commentary on available product data. It is not verification of intellectual property, hazmat, or brand-gating status.'
        ]
      },
      {
        id: 'accounts-and-roles',
        heading: 'Accounts and roles',
        body: [
          'Each workspace account must use accurate credentials. Some actions, including billing management, plan upgrades, and batch runs, are limited to owner or admin roles.'
        ]
      },
      {
        id: 'plan-limits',
        heading: 'Plan limits',
        body: [
          'Usage quotas and batch sizes are enforced per organization and per plan. Exceeding a quota may block new lookups or batch requests until the cycle resets or the workspace upgrades.'
        ]
      },
      {
        id: 'availability',
        heading: 'Availability',
        body: [
          'The service may change over time. Public pages are delivered statically, and the authenticated workspace depends on API and provider availability for live account, research, and billing actions.'
        ]
      }
    ]}
  />
);
