import React from 'react';
import {
  ArrowRight,
  BarChart3,
  Bookmark,
  Calculator,
  Layers3,
  Radar,
  ShieldCheck,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import type { BillingPlan } from '../../services/apiClient';
import { hashHref } from './links';
import { describePlan, formatPrice, sortPlans } from './planDetails';
import { Card, CheckList, Faq, IconBadge, LinkButton, Pill, SectionHeader } from './primitives';

const FEATURES = [
  {
    title: 'Research with context',
    copy: 'Look up any ASIN and see price history, rank movement, seller count, fees, and estimated sales side by side.',
    icon: Radar,
    tone: 'accent' as const
  },
  {
    title: 'Screen in batches',
    copy: 'Paste a shortlist, run it in one pass, and export the results as CSV. Errors stay separate from good rows.',
    icon: Layers3,
    tone: 'cyan' as const
  },
  {
    title: 'Keep the signal honest',
    copy: 'Missing fees, risk flags, or history stay marked as unavailable. AmzPulse never fills a gap with a made-up number.',
    icon: ShieldCheck,
    tone: 'emerald' as const
  }
];

const STEPS = [
  {
    step: '01',
    title: 'Capture the market',
    copy: 'Search by ASIN or load category bestsellers, then filter by price band, BSR ceiling, or seasonality.'
  },
  {
    step: '02',
    title: 'Score the opportunity',
    copy: 'Open the product view for sales estimates, seller pressure, fee breakdowns, and an optional AI read on sell potential.'
  },
  {
    step: '03',
    title: 'Turn research into action',
    copy: 'Save the listings worth pursuing, attach supplier links and notes, and pick the work back up from any device.'
  }
];

const SIGNALS = [
  { icon: TrendingUp, label: 'Price and rank history', copy: 'Joined by timestamp so the chart tells one story.' },
  { icon: BarChart3, label: 'Sales and seller pressure', copy: 'Estimated monthly units beside the number of active offers.' },
  { icon: Calculator, label: 'Profit and ROI', copy: 'Referral, FBA, and manual fees feed one calculator.' },
  { icon: Bookmark, label: 'Watchlists that sync', copy: 'Saved products restore their full detail after reload.' }
];

const SPARKLINE = [34, 38, 36, 44, 48, 46, 52, 58, 55, 63, 68, 72];

const FAQ_ITEMS = [
  {
    question: 'Which marketplace does AmzPulse cover?',
    answer: 'Amazon US in USD today. Product data comes from established providers and every lookup is metered against your monthly plan quota.'
  },
  {
    question: 'Do I need a credit card to start?',
    answer: 'No. The Starter plan includes 300 ASIN lookups and 50 AI analyses per month. Upgrade from inside the workspace when you need more.'
  },
  {
    question: 'Does the AI invent scores when data is missing?',
    answer: 'No. AI analysis only runs when you ask for it and comments on the data that is actually available. Unavailable fields stay unavailable.'
  }
];

const HomePage: React.FC<{ plans: BillingPlan[] }> = ({ plans }) => {
  const orderedPlans = sortPlans(plans);

  return (
    <>
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,153,0,0.16),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.18),transparent_28%),linear-gradient(140deg,rgba(15,23,42,0.95),rgba(2,6,23,0.84))] px-6 py-12 shadow-[0_30px_90px_rgba(2,6,23,0.38)] sm:px-10 sm:py-16">
        <div className="ambient-orb left-[-4rem] top-[-2rem] h-40 w-40 bg-amz-accent/30" aria-hidden="true" />
        <div className="ambient-orb right-[-3rem] top-10 h-56 w-56 bg-cyan-400/20" aria-hidden="true" />
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.95fr] lg:items-center">
          <div className="fade-up relative z-10">
            <Pill icon={Sparkles} className="mb-5">
              Amazon US product research
            </Pill>
            <h1 className="max-w-3xl text-balance text-4xl font-black leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              Find products worth sourcing before your competitors do.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              AmzPulse pulls demand, pricing, fees, and competition into one research workspace, so a shortlist review takes minutes instead of a spreadsheet afternoon.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton href={hashHref('/app')} size="lg" withArrow>
                Start researching free
              </LinkButton>
              <LinkButton href={hashHref('/features')} size="lg" variant="secondary">
                See how it works
              </LinkButton>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {[
                { value: '300', label: 'ASIN lookups a month, free' },
                { value: '100', label: 'ASINs per batch on Pro' },
                { value: '1', label: 'workspace for the whole team' }
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <dt className="order-last mt-1 text-xs leading-5 text-slate-400 sm:text-sm">{stat.label}</dt>
                  <dd className="text-2xl font-black text-white sm:text-3xl">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="fade-up relative z-10 lg:justify-self-end" aria-hidden="true">
            <div className="glass-panel w-full max-w-md rounded-3xl border border-white/10 p-5 shadow-[0_30px_80px_rgba(2,6,23,0.4)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Product view</div>
                  <div className="mt-1 text-sm font-semibold text-white">Insulated Tumbler, 32 oz</div>
                  <div className="text-xs text-slate-400">B0EXAMPLE1 &middot; Kitchen &amp; Dining</div>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-400/20">
                  Pursue
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/65 p-4">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Est. monthly sales</div>
                    <div className="mt-1 text-3xl font-black text-white">1,240</div>
                  </div>
                  <div className="text-right text-xs text-emerald-300">+18% vs. 90 days</div>
                </div>
                <div className="mt-4 flex h-16 items-end gap-1">
                  {SPARKLINE.map((value, index) => (
                    <span
                      key={index}
                      className={`flex-1 rounded-t-sm ${index === SPARKLINE.length - 1 ? 'bg-amz-accent' : 'bg-cyan-400/40'}`}
                      style={{ height: `${value}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3">
                {[
                  { label: 'Price', value: '$24.99' },
                  { label: 'BSR', value: '#1,842' },
                  { label: 'Sellers', value: '6' }
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/65 p-3">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
                    <div className="mt-1 text-lg font-bold text-white">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/65 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="uppercase tracking-[0.16em] text-slate-500">Net margin at $24.99</span>
                  <span className="font-semibold text-white">31%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-[31%] rounded-full bg-gradient-to-r from-amz-accent to-orange-300" />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  Referral and FBA fees included. Hazmat and IP checks: no flags in provider data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-3" aria-labelledby="home-features">
        <h2 id="home-features" className="sr-only">
          Why teams use AmzPulse
        </h2>
        {FEATURES.map((card, index) => (
          <Card as="article" key={card.title} className="fade-up" style={{ animationDelay: `${index * 90}ms` }}>
            <IconBadge icon={card.icon} tone={card.tone} />
            <h3 className="text-2xl font-bold text-white">{card.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{card.copy}</p>
          </Card>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="fade-up">
          <SectionHeader eyebrow="How it flows" title="A cleaner path from idea list to decision." />
          <ol className="mt-8 space-y-4">
            {STEPS.map((step) => (
              <li key={step.step} className="flex gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <span className="font-display text-sm font-bold tabular-nums text-amz-accent">{step.step}</span>
                <div>
                  <div className="font-semibold text-white">{step.title}</div>
                  <p className="mt-1.5 text-sm leading-6 text-slate-300">{step.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="fade-up">
          <SectionHeader
            eyebrow="What you get"
            tone="cyan"
            title="Every signal a sourcing decision needs, in one product view."
            copy="No tab juggling between a rank tracker, a fee calculator, and a notes doc."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {SIGNALS.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <item.icon size={18} className="text-cyan-300" aria-hidden="true" />
                <div className="mt-3 font-semibold text-white">{item.label}</div>
                <p className="mt-1.5 text-sm leading-6 text-slate-300">{item.copy}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mt-8">
        <Card className="fade-up">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <SectionHeader
                eyebrow="Pricing"
                title="Start free. Upgrade when the shortlist grows."
                copy="Both plans share the same workspace. Limits are per organization, so your team draws from one pool."
              />
              <LinkButton href={hashHref('/pricing')} variant="secondary" withArrow className="mt-6">
                Compare plans
              </LinkButton>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {orderedPlans.map((plan) => {
                const details = describePlan(plan);
                return (
                  <div
                    key={plan.name}
                    className={`rounded-2xl border p-5 ${
                      details.recommended ? 'border-amz-accent/40 bg-amz-accent/5' : 'border-white/10 bg-slate-950/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-white">{details.displayName}</div>
                      {details.recommended ? (
                        <span className="rounded-full bg-amz-accent px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-950">
                          Popular
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex items-end gap-1">
                      <span className="text-3xl font-black text-white">{formatPrice(plan.price)}</span>
                      <span className="pb-1 text-xs text-slate-400">/ month</span>
                    </div>
                    <CheckList
                      className="mt-4 text-xs"
                      items={[
                        `${plan.monthlyAsinQuota.toLocaleString()} ASINs per month`,
                        `${plan.maxBatchSize.toLocaleString()} ASINs per batch`
                      ]}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="fade-up">
          <SectionHeader eyebrow="Questions" title="Straight answers before you sign up." />
          <div className="mt-6">
            <Faq items={FAQ_ITEMS} />
          </div>
        </Card>
        <Card className="fade-up flex flex-col justify-between bg-[linear-gradient(160deg,rgba(255,153,0,0.14),rgba(15,23,42,0.9))]">
          <div>
            <SectionHeader
              eyebrow="Get started"
              title="Your next product check is one ASIN away."
              copy="Create a free account, paste an ASIN, and see the full picture in seconds."
            />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href={hashHref('/app')} size="lg" withArrow>
              Open the workspace
            </LinkButton>
            <a
              href={hashHref('/contact')}
              className="inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold text-slate-200 transition hover:text-white"
            >
              Talk to us
              <ArrowRight size={15} aria-hidden="true" />
            </a>
          </div>
        </Card>
      </section>
    </>
  );
};

export default HomePage;
