import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

type AuthMode = 'login' | 'signup';

interface AuthFormState {
  email: string;
  password: string;
  name: string;
}

interface AuthModalProps {
  authMode: AuthMode;
  setAuthMode: React.Dispatch<React.SetStateAction<AuthMode>>;
  authForm: AuthFormState;
  setAuthForm: React.Dispatch<React.SetStateAction<AuthFormState>>;
  authError: string | null;
  authLoading: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  authMode,
  setAuthMode,
  authForm,
  setAuthForm,
  authError,
  authLoading,
  onClose,
  onSubmit
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md relative"
      >
        <button type="button" className="absolute top-3 right-3 text-slate-500 hover:text-white" onClick={onClose}>
          ✕
        </button>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">{authMode === 'login' ? 'Login' : 'Create account'}</h3>
          <button
            type="button"
            className="text-xs text-amz-accent hover:text-white"
            onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
          >
            {authMode === 'login' ? 'Need an account?' : 'Have an account?'}
          </button>
        </div>
        <div className="space-y-3">
          {authMode === 'signup' && (
            <input
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amz-accent"
            placeholder="Name"
            value={authForm.name}
            onChange={(e) => setAuthForm((f) => ({ ...f, name: e.target.value }))}
          />
          )}
          <input
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amz-accent"
            placeholder="Email"
            type="email"
            value={authForm.email}
            onChange={(e) => setAuthForm((f) => ({ ...f, email: e.target.value }))}
          />
          <div className="relative">
            <input
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 pr-11 text-sm focus:outline-none focus:border-amz-accent"
              placeholder="Password"
              type={showPassword ? 'text' : 'password'}
              value={authForm.password}
              onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-slate-400 transition hover:text-white"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {authMode === 'login' && (
            <div className="flex justify-end">
              <a href="#/forgot-password" className="text-xs text-slate-400 transition hover:text-white">
                Forgot password?
              </a>
            </div>
          )}
          {authError && <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded p-2">{authError}</div>}
          <button
            type="submit"
            disabled={authLoading}
            className="w-full mt-2 bg-amz-accent text-slate-900 font-bold py-2 rounded-lg hover:bg-orange-500 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {authLoading && <Loader2 size={16} className="animate-spin" />}
            {authMode === 'login' ? 'Login' : 'Sign up'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AuthModal;
