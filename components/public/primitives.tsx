import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const cardClass =
  'glass-panel relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_30px_80px_rgba(2,6,23,0.32)]';

export const Eyebrow: React.FC<{ children: React.ReactNode; tone?: 'accent' | 'cyan' | 'muted' }> = ({
  children,
  tone = 'accent'
}) => {
  const toneClass =
    tone === 'cyan' ? 'text-cyan-300' : tone === 'muted' ? 'text-slate-400' : 'text-amz-accent';
  return <div className={`mb-3 text-xs font-semibold uppercase tracking-[0.24em] ${toneClass}`}>{children}</div>;
};

export const Pill: React.FC<{ children: React.ReactNode; icon?: LucideIcon; className?: string }> = ({
  children,
  icon: Icon,
  className = ''
}) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-300 ${className}`}
  >
    {Icon ? <Icon size={14} className="text-amz-accent" aria-hidden="true" /> : null}
    {children}
  </span>
);

type LinkButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg';
  withArrow?: boolean;
  className?: string;
  external?: boolean;
};

export const LinkButton: React.FC<LinkButtonProps> = ({
  href,
  children,
  variant = 'primary',
  size = 'md',
  withArrow = false,
  className = '',
  external = false
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amz-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';
  const sizing = size === 'lg' ? 'px-6 py-3.5 text-base' : 'px-5 py-3 text-sm';
  const variants = {
    primary: 'bg-amz-accent text-slate-950 shadow-[0_12px_30px_rgba(255,153,0,0.28)] hover:bg-orange-400',
    secondary: 'border border-white/15 bg-white/5 text-slate-100 hover:border-white/25 hover:bg-white/10',
    ghost: 'text-slate-200 hover:text-white'
  };
  return (
    <a
      href={href}
      className={`${base} ${sizing} ${variants[variant]} ${className}`}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {children}
      {withArrow ? <ArrowRight size={16} aria-hidden="true" /> : null}
    </a>
  );
};

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { as?: 'div' | 'article' | 'section' | 'aside'; padded?: boolean }> = ({
  as: Tag = 'div',
  padded = true,
  className = '',
  children,
  ...rest
}) => (
  <Tag className={`${cardClass} ${padded ? 'p-6 sm:p-8' : ''} ${className}`} {...rest}>
    {children}
  </Tag>
);

export const IconBadge: React.FC<{ icon: LucideIcon; tone?: 'accent' | 'cyan' | 'emerald' }> = ({ icon: Icon, tone = 'accent' }) => {
  const toneClass =
    tone === 'cyan'
      ? 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/20'
      : tone === 'emerald'
        ? 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20'
        : 'bg-amz-accent/10 text-amz-accent ring-amz-accent/25';
  return (
    <div className={`mb-5 inline-flex self-start rounded-2xl p-3 ring-1 ${toneClass}`}>
      <Icon size={22} aria-hidden="true" />
    </div>
  );
};

export const SectionHeader: React.FC<{
  eyebrow: string;
  title: string;
  copy?: string;
  align?: 'left' | 'center';
  tone?: 'accent' | 'cyan';
  as?: 'h1' | 'h2';
}> = ({ eyebrow, title, copy, align = 'left', tone = 'accent', as: Heading = 'h2' }) => (
  <div className={`${align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}`}>
    <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
    <Heading
      className={`text-balance font-black leading-[1.05] text-white ${
        Heading === 'h1' ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'
      }`}
    >
      {title}
    </Heading>
    {copy ? <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">{copy}</p> : null}
  </div>
);

export const PageHero: React.FC<{
  eyebrow: string;
  title: string;
  copy: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ eyebrow, title, copy, actions, children }) => (
  <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,153,0,0.16),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.16),transparent_28%),linear-gradient(140deg,rgba(15,23,42,0.95),rgba(2,6,23,0.84))] px-6 py-12 shadow-[0_30px_90px_rgba(2,6,23,0.38)] sm:px-10 sm:py-16">
    <div className="ambient-orb left-[-4rem] top-[-2rem] h-40 w-40 bg-amz-accent/30" aria-hidden="true" />
    <div className="ambient-orb right-[-3rem] top-10 h-56 w-56 bg-cyan-400/20" aria-hidden="true" />
    <div className="fade-up relative z-10">
      <SectionHeader eyebrow={eyebrow} title={title} copy={copy} as="h1" />
      {actions ? <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div> : null}
      {children}
    </div>
  </section>
);

export const CheckList: React.FC<{ items: string[]; tone?: 'emerald' | 'accent'; className?: string }> = ({
  items,
  tone = 'emerald',
  className = ''
}) => (
  <ul className={`space-y-3 text-sm leading-6 text-slate-200 ${className}`}>
    {items.map((item) => (
      <li key={item} className="flex items-start gap-3">
        <span
          className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${tone === 'accent' ? 'bg-amz-accent' : 'bg-emerald-300'}`}
          aria-hidden="true"
        />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export const Faq: React.FC<{ items: { question: string; answer: string }[] }> = ({ items }) => (
  <div className="divide-y divide-white/10">
    {items.map((item) => (
      <details key={item.question} className="group py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-white [&::-webkit-details-marker]:hidden">
          {item.question}
          <span
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition group-open:rotate-45"
            aria-hidden="true"
          >
            +
          </span>
        </summary>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{item.answer}</p>
      </details>
    ))}
  </div>
);
