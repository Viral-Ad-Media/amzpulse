import React from 'react';
import { CreditCard, Github, LifeBuoy, Plug } from 'lucide-react';
import { REPO_URL, hashHref } from './links';
import { Card, CheckList, IconBadge, LinkButton, PageHero } from './primitives';

const CHANNELS = [
  {
    title: 'Product support',
    icon: LifeBuoy,
    tone: 'accent' as const,
    copy: 'Something in the workspace did not behave as expected.',
    include: ['The ASIN or batch you were working with', 'The view you were in and the step that failed', 'Any error message shown on screen'],
    action: { label: 'Report an issue on GitHub', href: `${REPO_URL}/issues`, external: true }
  },
  {
    title: 'Billing and plans',
    icon: CreditCard,
    tone: 'cyan' as const,
    copy: 'Questions about quotas, upgrades, invoices, or cancellations.',
    include: ['Use the owner or admin account that manages the plan', 'The organization name shown in workspace settings', 'The approximate date of the charge or change'],
    action: { label: 'Manage billing in the workspace', href: hashHref('/app') }
  },
  {
    title: 'Implementation',
    icon: Plug,
    tone: 'emerald' as const,
    copy: 'Pairing the frontend with your own backend or static host.',
    include: ['Your frontend origin list', 'Whether the site is deployed at the root or a subpath', 'The backend version and the provider you configured'],
    action: { label: 'Read the setup guide', href: `${REPO_URL}#readme`, external: true }
  }
];

const ContactPage: React.FC = () => (
  <div className="grid gap-8">
    <PageHero
      eyebrow="Contact"
      title="Send the question to the right place and we can move faster."
      copy="Pick the channel that matches your question and include the details listed. It usually saves a round trip."
    />

    <section className="grid gap-5 lg:grid-cols-3" aria-label="Contact channels">
      {CHANNELS.map((channel, index) => (
        <Card as="article" key={channel.title} className="fade-up flex flex-col" style={{ animationDelay: `${index * 100}ms` }}>
          <IconBadge icon={channel.icon} tone={channel.tone} />
          <h2 className="text-2xl font-bold text-white">{channel.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">{channel.copy}</p>
          <div className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">What to include</div>
          <CheckList items={channel.include} className="mt-3 flex-1" />
          <LinkButton
            href={channel.action.href}
            variant="secondary"
            withArrow
            external={Boolean(channel.action.external)}
            className="mt-6 self-start"
          >
            {channel.action.label}
          </LinkButton>
        </Card>
      ))}
    </section>

    <Card className="fade-up">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <Github size={20} className="text-slate-300" aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-bold text-white">Prefer to read the code first?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            The AmzPulse frontend is open source. Issues and discussions on GitHub are the fastest way to reach the people who build it.
          </p>
        </div>
        <LinkButton href={REPO_URL} variant="secondary" withArrow external>
          Open the repository
        </LinkButton>
      </div>
    </Card>
  </div>
);

export default ContactPage;
