import React from 'react';
import { Loader2 } from 'lucide-react';

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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md relative">
        <button className="absolute top-3 right-3 text-slate-500 hover:text-white" onClick={onClose}>
          ✕
        </button>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">{authMode === 'login' ? 'Login' : 'Create account'}</h3>
          <button
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
          <input
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amz-accent"
            placeholder="Password"
            type="password"
            value={authForm.password}
            onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
          />
          {authError && <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded p-2">{authError}</div>}
          <button
            onClick={onSubmit}
            disabled={authLoading}
            className="w-full mt-2 bg-amz-accent text-slate-900 font-bold py-2 rounded-lg hover:bg-orange-500 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {authLoading && <Loader2 size={16} className="animate-spin" />}
            {authMode === 'login' ? 'Login' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
