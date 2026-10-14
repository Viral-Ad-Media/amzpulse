import React from 'react';
import { Compass, Gauge, Scale } from 'lucide-react';
import { REPO_URL, hashHref } from './links';
import { Card, IconBadge, LinkButton, PageHero, SectionHeader } from './primitives';

const PRINCIPLES = [
  {
    title: 'Clarity over ceremony',
    icon: Compass,
    tone: 'accent' as const,
    copy: 'Every screen should answer a real sourcing question. If a panel does not change a decision, it does not ship.'
  },
  {
    title: 'Momentum',
    icon: Gauge,
    tone: 'cyan' as const,
    copy: 'Fast lookups, batch runs that finish, and watchlists that pick up where you left off keep a research session moving.'
  },
  {
    title: 'Honest numbers',
    icon: Scale,
    tone: 'emerald' as const,
    copy: 'Visible quotas, traceable provider data, and empty fields instead of invented estimates. The tool should never overpromise.'
  }
];

const AboutPage: React.FC = () => (
  <div className="grid gap-8">
    <PageHero
      eyebrow="About AmzPulse"
      title="Built to take the manual friction out of Amazon product research."
      copy="AmzPulse started as an internal tool for screening sourcing ideas. It grew into a workspace that keeps the research session, the shortlist, and the plan limits in one coherent place."
    />

    <section className="grid gap-5 lg:grid-cols-3" aria-label="Principles">
      {PRINCIPLES.map((item, index) => (
        <Card as="article" key={item.title} className="fade-up" style={{ animationDelay: `${index * 100}ms` }}>
          <IconBadge icon={item.icon} tone={item.tone} />
          <h2 className="text-2xl font-bold text-white">{item.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">{item.copy}</p>
        </Card>
      ))}
    </section>

    <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <Card className="fade-up">
        <SectionHeader
          eyebrow="How we build"
          tone="cyan"
          title="Provider data in, operator decisions out."
          copy="AmzPulse combines established Amazon data providers with a calculator and workflow layer designed for people who source products for a living."
        />
        <div className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
          <p>
            Product lookups, watchlists, and billing run through a dedicated backend that owns authentication, quotas, and provider credentials. The frontend you use never holds a secret.
          </p>
          <p>
            Research notes, supplier links, and calculator inputs save instantly in your browser and are scoped to your account, so a shared computer never leaks one operator&apos;s notes into another&apos;s view.
          </p>
          <p>
            The frontend is open source. You can read the code, file issues, and follow development on GitHub.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <LinkButton href={REPO_URL} variant="secondary" external>
            View the source on GitHub
          </LinkButton>
          <LinkButton href={hashHref('/features')} variant="ghost" withArrow>
            Explore the features
          </LinkButton>
        </div>
      </Card>

      <Card className="fade-up">
        <SectionHeader eyebrow="Where we are" title="Focused on Amazon US today." />
        <dl className="mt-6 grid gap-3">
          {[
            ['Marketplace', 'Amazon US, priced in USD'],
            ['Data', 'Provider-backed pricing, rank, fees, and sales estimates'],
            ['AI', 'Optional analysis that comments on available data only'],
            ['Team', 'Shared organization quotas with owner and admin roles'],
            ['Roadmap', 'Referral rewards and additional marketplaces are in progress and not yet live']
          ].map(([label, copy]) => (
            <div key={label} className="flex gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <dt className="w-28 shrink-0 pt-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</dt>
              <dd className="text-sm leading-6 text-slate-300">{copy}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </section>
  </div>
);

export default AboutPage;
