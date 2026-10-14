import React from 'react';
import { CheckCircle2, Compass, Undo2 } from 'lucide-react';
import { hashHref } from './links';
import { Card, LinkButton } from './primitives';

const StatusShell: React.FC<{
  badge: string;
  tone: 'success' | 'warning' | 'neutral';
  icon: React.ReactNode;
  title: string;
  copy: string;
  actions: React.ReactNode;
}> = ({ badge, tone, icon, title, copy, actions }) => {
  const badgeClass =
    tone === 'success'
      ? 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/20'
      : tone === 'warning'
        ? 'bg-amber-500/15 text-amber-200 ring-amber-400/20'
        : 'bg-white/5 text-slate-300 ring-white/10';
  return (
    <div className="mx-auto max-w-3xl">
      <Card className="fade-up text-center sm:p-12">
        <div className="mx-auto mb-6 flex w-fit rounded-3xl border border-white/10 bg-white/5 p-4">{icon}</div>
        <div>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ring-1 ${badgeClass}`}>{badge}</span>
        </div>
        <h1 className="mt-5 text-balance text-4xl font-black text-white">{title}</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-300">{copy}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>
      </Card>
    </div>
  );
};

export const BillingResultPage: React.FC<{ outcome: 'success' | 'cancel' }> = ({ outcome }) => {
  const isSuccess = outcome === 'success';
  return (
    <StatusShell
      badge={isSuccess ? 'Billing confirmed' : 'Billing update canceled'}
      tone={isSuccess ? 'success' : 'warning'}
      icon={
        isSuccess ? (
          <CheckCircle2 size={28} className="text-emerald-300" aria-hidden="true" />
        ) : (
          <Undo2 size={28} className="text-amber-300" aria-hidden="true" />
        )
      }
      title={isSuccess ? 'Your billing update was received.' : 'Your billing change was canceled before completion.'}
      copy={
        isSuccess
          ? 'Return to the workspace to confirm the updated plan and continue with batch analysis or watchlist work.'
          : 'Nothing was changed on your account. You can return to pricing or reopen billing from the workspace whenever you are ready.'
      }
      actions={
        <>
          <LinkButton href={hashHref('/app')} withArrow>
            Open workspace
          </LinkButton>
          <LinkButton href={hashHref('/pricing')} variant="secondary">
            Review pricing
          </LinkButton>
        </>
      }
    />
  );
};

export const NotFoundPage: React.FC = () => (
  <StatusShell
    badge="404"
    tone="neutral"
    icon={<Compass size={28} className="text-amz-accent" aria-hidden="true" />}
    title="We could not find that page."
    copy="The link may be out of date, or the page may have moved. Head back home or jump straight into the workspace."
    actions={
      <>
        <LinkButton href={hashHref('/')} withArrow>
          Back home
        </LinkButton>
        <LinkButton href={hashHref('/app')} variant="secondary">
          Open workspace
        </LinkButton>
      </>
    }
  />
);
