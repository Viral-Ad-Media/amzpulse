import React from 'react';
import { CheckCircle2, Minus } from 'lucide-react';
import type { BillingPlan } from '../../services/apiClient';
import { hashHref } from './links';
import { describePlan, formatPrice, sortPlans } from './planDetails';
import { Card, CheckList, Faq, LinkButton, PageHero, SectionHeader } from './primitives';

const FAQ_ITEMS = [
  {
    question: 'How are lookups counted?',
    answer:
      'Every successful ASIN lookup uses one credit from your organization’s monthly quota, including cached results. Failed lookups are refunded automatically.'
  },
  {
    question: 'Who can upgrade or change billing?',
    answer: 'Owner and admin seats manage the plan from the workspace. Checkout and renewals run through Stripe, and you return to a confirmation page when done.'
  },
  {
    question: 'Are limits per user or per team?',
    answer: 'Per organization. Everyone in the workspace draws from the same pool of ASIN lookups and AI analyses.'
  },
  {
    question: 'What happens when I hit the quota?',
    answer: 'New lookups and batch runs pause until the monthly cycle resets or the workspace upgrades. Saved watchlists and notes stay available.'
  },
  {
    question: 'Can I cancel?',
    answer: 'Yes. Cancel from billing in the workspace at any time. Your plan stays active until the end of the paid period.'
  }
];

const comparisonRows = (plans: BillingPlan[]) => [
  { label: 'ASIN lookups per month', values: plans.map((plan) => plan.monthlyAsinQuota.toLocaleString()) },
  { label: 'ASINs per batch run', values: plans.map((plan) => plan.maxBatchSize.toLocaleString()) },
  {
    label: 'AI analyses per month',
    values: plans.map((plan) => {
      const aiCalls = describePlan(plan).aiCalls;
      return aiCalls === null ? null : aiCalls.toLocaleString();
    })
  },
  { label: 'Price and rank history', values: plans.map(() => true) },
  { label: 'Profit and ROI calculator', values: plans.map(() => true) },
  { label: 'Synced watchlists', values: plans.map(() => true) },
  { label: 'CSV export of batch runs', values: plans.map((plan) => plan.maxBatchSize > 0) },
  { label: 'Billing managed in workspace', values: plans.map((plan) => plan.price > 0) }
];

const PricingPage: React.FC<{ plans: BillingPlan[] }> = ({ plans }) => {
  const orderedPlans = sortPlans(plans);
  const rows = comparisonRows(orderedPlans);

  return (
    <div className="grid gap-8">
      <PageHero
        eyebrow="Pricing"
        title="Simple plans that scale with your shortlist."
        copy="Start free with a real monthly quota. Move to Pro when batch runs and AI analyses become part of the weekly routine."
      />

      <section className="grid gap-5 lg:grid-cols-2" aria-label="Plans">
        {orderedPlans.map((plan, index) => {
          const details = describePlan(plan);
          return (
            <Card
              as="article"
              key={plan.name}
              className={`fade-up ${
                details.recommended ? 'border-amz-accent/40 bg-[linear-gradient(180deg,rgba(255,153,0,0.12),rgba(15,23,42,0.88))]' : ''
              }`}
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-white">{details.displayName}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{details.tagline}</p>
                </div>
                {details.recommended ? (
                  <span className="shrink-0 rounded-full bg-amz-accent px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-950">
                    Recommended
                  </span>
                ) : null}
              </div>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-5xl font-black text-white">{formatPrice(plan.price)}</span>
                <span className="pb-1.5 text-sm text-slate-400">/ month</span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { value: plan.monthlyAsinQuota.toLocaleString(), label: 'ASINs / month' },
                  { value: plan.maxBatchSize.toLocaleString(), label: 'ASINs / batch' }
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="text-2xl font-black text-white">{stat.value}</div>
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{stat.label}</div>
                  </div>
                ))}
              </div>

              {details.highlights.length > 0 ? <CheckList items={details.highlights} className="mt-6" /> : null}

              <LinkButton
                href={hashHref('/app')}
                variant={details.recommended ? 'primary' : 'secondary'}
                withArrow
                className="mt-8 w-full sm:w-auto"
              >
                {details.cta}
              </LinkButton>
            </Card>
          );
        })}
      </section>

      <Card padded={false} className="fade-up">
        <div className="p-6 sm:p-8">
          <SectionHeader eyebrow="Compare" title="What each plan includes." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-t border-white/10 text-xs uppercase tracking-[0.16em] text-slate-400">
                <th scope="col" className="px-6 py-4 font-semibold sm:px-8">
                  Feature
                </th>
                {orderedPlans.map((plan) => (
                  <th scope="col" key={plan.name} className="px-6 py-4 font-semibold text-white sm:px-8">
                    {describePlan(plan).displayName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-white/10">
                  <th scope="row" className="px-6 py-4 font-medium text-slate-200 sm:px-8">
                    {row.label}
                  </th>
                  {row.values.map((value, index) => (
                    <td key={`${row.label}-${orderedPlans[index]?.name ?? index}`} className="px-6 py-4 text-slate-300 sm:px-8">
                      {value === true ? (
                        <CheckCircle2 size={18} className="text-emerald-300" aria-label="Included" />
                      ) : value === false || value === null ? (
                        <Minus size={18} className="text-slate-600" aria-label="Not included" />
                      ) : (
                        value
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="fade-up">
        <SectionHeader eyebrow="Billing questions" title="The details before you commit." />
        <div className="mt-6">
          <Faq items={FAQ_ITEMS} />
        </div>
      </Card>
    </div>
  );
};

export default PricingPage;
