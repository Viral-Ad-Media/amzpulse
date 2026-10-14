export const normalizePath = (value: string) => {
  if (!value) return '/';
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  const withoutQuery = withLeadingSlash.split('?')[0].split('#')[0];
  const normalized = withoutQuery.replace(/\/+$/, '');
  return normalized || '/';
};

export const hashHref = (path: string) => `#${normalizePath(path)}`;

export const PUBLIC_NAV = [
  { label: 'Features', path: '/features' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' }
] as const;

export const REPO_URL = 'https://github.com/Viral-Ad-Media/amzpulse';
