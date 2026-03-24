import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, EyeOff, KeyRound, Mail, RefreshCw } from 'lucide-react';
import { requestPasswordReset, resetPassword } from '../services/apiClient';

type PasswordRecoveryMode = 'request' | 'reset';

interface PasswordRecoveryPanelProps {
  mode: PasswordRecoveryMode;
  initialToken?: string;
  loginHref: string;
}

const PasswordRecoveryPanel: React.FC<PasswordRecoveryPanelProps> = ({ mode, initialToken, loginHref }) => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(initialToken || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(initialToken || '');
  }, [initialToken]);

  const handleRequestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      setError('Enter the email address tied to your account.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      setResetUrl(null);
      setResetToken(null);

      const result = await requestPasswordReset(email.trim());
      setMessage(result.message);
      setResetUrl(result.resetUrl || null);
      setResetToken(result.resetToken || null);
    } catch (err) {
      setError((err as Error)?.message || 'Unable to start password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token.trim()) {
      setError('Paste a valid reset token or open the reset link you received.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const result = await resetPassword(token.trim(), password);
      setMessage(result.message);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError((err as Error)?.message || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'request' ? 'Reset your password' : 'Choose a new password';
  const description =
    mode === 'request'
      ? 'Enter your account email and we will generate a reset link.'
      : 'Use the token from your reset link and set a new password for your account.';

  return (
    <section className="glass-panel fade-up max-w-3xl rounded-[1.75rem] border border-white/10 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.32)] sm:p-8">
      <div className="mb-3 text-xs uppercase tracking-[0.24em] text-amz-accent">
        {mode === 'request' ? 'Password Help' : 'Reset Flow'}
      </div>
      <h1 className="text-4xl font-black text-white">{title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">{description}</p>

      <form onSubmit={mode === 'request' ? handleRequestReset : handleResetPassword} className="mt-8 space-y-4">
        {mode === 'request' ? (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Email address</span>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-amz-accent"
                placeholder="name@example.com"
              />
            </div>
          </label>
        ) : (
          <>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Reset token</span>
              <div className="relative">
                <KeyRound size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-amz-accent"
                  placeholder="Paste your reset token"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">New password</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-3 pl-4 pr-11 text-sm text-white outline-none transition focus:border-amz-accent"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 px-3 text-slate-400 transition hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Confirm new password</span>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-3 pl-4 pr-11 text-sm text-white outline-none transition focus:border-amz-accent"
                  placeholder="Repeat your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 px-3 text-slate-400 transition hover:text-white"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
          </>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {mode === 'request' && (resetUrl || resetToken) && (
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
            <div className="font-semibold text-white">Development reset details</div>
            <p className="mt-2 text-cyan-50/90">
              Since email delivery is not configured here yet, the API exposed the generated reset values for local testing.
            </p>
            {resetUrl && (
              <div className="mt-3 break-all">
                <span className="font-medium text-white">Reset link:</span>{' '}
                <a href={resetUrl} className="underline decoration-cyan-300/50 underline-offset-4 hover:text-white">
                  {resetUrl}
                </a>
              </div>
            )}
            {resetToken && (
              <div className="mt-2 break-all">
                <span className="font-medium text-white">Token:</span> <code>{resetToken}</code>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-amz-accent px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : mode === 'request' ? <Mail size={16} /> : <KeyRound size={16} />}
            {mode === 'request' ? 'Generate reset link' : 'Save new password'}
          </button>

          <a href={loginHref} className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/25 hover:bg-white/10">
            Back to sign in
          </a>
        </div>
      </form>
    </section>
  );
};

export default PasswordRecoveryPanel;
