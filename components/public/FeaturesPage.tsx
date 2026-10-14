import React from 'react';
import { BarChart3, Bookmark, Calculator, Database, Layers3, Radar, ShieldCheck, Users } from 'lucide-react';
import { hashHref } from './links';
import { Card, CheckList, IconBadge, LinkButton, PageHero, SectionHeader } from './primitives';

const FEATURE_GROUPS = [
  {
    title: 'Discovery',
    icon: Radar,
    tone: 'accent' as const,
    copy: 'Start from an ASIN or a category list and narrow fast.',
    points: ['ASIN lookups with cached and live provider fetches', 'Category bestsellers on demand', 'Price band, BSR ceiling, and seasonality filters']
  },
  {
    title: 'Decision support',
    icon: BarChart3,
    tone: 'cyan' as const,
    copy: 'Everything that changes the sourcing call sits on one screen.',
    points: ['Joined price and rank history charts', 'Estimated sales beside seller count', 'Optional AI read on sell potential, run only when you ask']
  },
  {
    title: 'Margin math',
    icon: Calculator,
    tone: 'emerald' as const,
    copy: 'Profit and ROI that only report when the inputs are complete.',
    points: ['Referral and FBA fees from provider data', 'Manual fee entry for gaps', 'Calculator inputs saved per product in your browser']
  },
  {
    title: 'Batch screening',
    icon: Layers3,
    tone: 'accent' as const,
    copy: 'Screen a whole shortlist without babysitting each lookup.',
    points: ['Up to 100 ASINs per run on Pro', 'Failed rows reported separately from results', 'CSV export with spreadsheet-safe escaping']
  },
  {
    title: 'Watchlists and notes',
    icon: Bookmark,
    tone: 'cyan' as const,
    copy: 'Keep the research trail attached to the product.',
    points: ['Watchlists sync across devices', 'Supplier links and research notes per ASIN', 'Saved products restore full detail after reload']
  },
  {
    title: 'Team and billing',
    icon: Users,
    tone: 'emerald' as const,
    copy: 'Usage and plans are managed per organization.',
    points: ['Shared monthly quota for the whole team', 'Owner and admin roles for billing and batch runs', 'Usage visible inside the workspace']
  }
];

const HONESTY_POINTS = [
  'Missing fees, risk assessments, or history are shown as unavailable instead of estimated.',
  'Profit and ROI only calculate when every applicable fee is known.',
  'AI analysis is commentary on available data. It does not verify IP, hazmat, or brand gating.',
  'Cached lookups still count toward your quota, and failed lookups are refunded automatically.'
];

const FeaturesPage: React.FC = () => (
  <div className="grid gap-8">
    <PageHero
      eyebrow="Features"
      title="A workspace shaped around how Amazon research actually happens."
      copy="Discovery, scoring, margin math, and follow-up live in one place, with provider data you can trace and limits you can see."
      actions={
        <>
          <LinkButton href={hashHref('/app')} size="lg" withArrow>
            Try it free
          </LinkButton>
          <LinkButton href={hashHref('/pricing')} size="lg" variant="secondary">
            View pricing
          </LinkButton>
        </>
      }
    />

    <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-label="Feature groups">
      {FEATURE_GROUPS.map((group, index) => (
        <Card as="article" key={group.title} className="fade-up" style={{ animationDelay: `${index * 70}ms` }}>
          <IconBadge icon={group.icon} tone={group.tone} />
          <h2 className="text-2xl font-bold text-white">{group.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">{group.copy}</p>
          <CheckList items={group.points} className="mt-5" />
        </Card>
      ))}
    </section>

    <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <Card className="fade-up">
        <SectionHeader
          eyebrow="Data you can trust"
          tone="cyan"
          title="When the data is missing, AmzPulse says so."
          copy="Most research tools paper over gaps with estimates. We would rather show you an empty field than a confident guess."
        />
        <CheckList items={HONESTY_POINTS} tone="accent" className="mt-6" />
      </Card>

      <Card className="fade-up">
        <IconBadge icon={Database} tone="cyan" />
        <h2 className="text-2xl font-bold text-white">What a lookup returns</h2>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            ['Listing', 'Title, brand, category, images, and current offer price'],
            ['Demand', 'BSR, estimated monthly sales, and review velocity where available'],
            ['Competition', 'Active seller count and Buy Box pressure'],
            ['Economics', 'Referral and FBA fees, net margin, and ROI at your cost'],
            ['History', 'Price and rank series joined by timestamp'],
            ['Risk', 'Provider flags for hazmat, IP, and gating when reported']
          ].map(([label, copy]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</dt>
              <dd className="mt-1.5 text-sm leading-6 text-slate-300">{copy}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </section>

    <Card className="fade-up bg-[linear-gradient(160deg,rgba(34,211,238,0.12),rgba(15,23,42,0.9))]">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <ShieldCheck size={20} className="text-cyan-300" aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-bold text-white">Ready to run your first lookup?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            The Starter plan includes 300 ASIN lookups and 50 AI analyses every month. No card required.
          </p>
        </div>
        <LinkButton href={hashHref('/app')} size="lg" withArrow>
          Open the workspace
        </LinkButton>
      </div>
    </Card>
  </div>
);

export default FeaturesPage;
