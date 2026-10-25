import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { useApp } from '../../context/AppContext';
import { authApi } from '../../api';
import { AREAS } from '../../utils/constants';

export default function AuthModal({ onClose }) {
  const { login, showToast } = useApp();
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'reset'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    area: 'Adyar'
  });
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', isSuccess: false });

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e, credentialsOverride = null) => {
    if (e) e.preventDefault();
    setStatusMessage({ text: '', isSuccess: false });
    setLoading(true);

    try {
      if (mode === 'reset') {
        const res = await authApi.resetPassword(formData.email);
        setStatusMessage({ text: res.message, isSuccess: true });
        setLoading(false);
        return;
      }

      const payload = credentialsOverride || formData;
      const res =
        mode === 'signup' ? await authApi.signup(payload) : await authApi.login(payload);

      await login(res.token);
      showToast(`Welcome back, ${res.user.name.split(' ')[0]}!`);
      onClose();
    } catch (err) {
      setStatusMessage({ text: err.message, isSuccess: false });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    handleSubmit(null, { email: 'demo@borrowly.app', password: 'demo1234' });
  };

  const titles = {
    login: 'Log in to Borrowly',
    signup: 'Create an account',
    reset: 'Reset password'
  };

  return (
    <Modal title={titles[mode]} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'signup' && (
          <Input
            id="auth-name"
            label="Full Name"
            placeholder="e.g. Arun Kumar"
            required
            value={formData.name}
            onChange={handleChange('name')}
          />
        )}

        <Input
          id="auth-email"
          type="email"
          label="Email Address"
          placeholder="your.email@example.com"
          required
          value={formData.email}
          onChange={handleChange('email')}
        />

        {mode !== 'reset' && (
          <Input
            id="auth-password"
            type="password"
            label="Password"
            placeholder="At least 6 characters"
            required
            minLength={6}
            value={formData.password}
            onChange={handleChange('password')}
          />
        )}

        {mode === 'signup' && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-area" className="text-xs font-semibold uppercase tracking-wider text-mute">
              Your Neighbourhood
            </label>
            <select
              id="auth-area"
              value={formData.area}
              onChange={handleChange('area')}
              className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-[#232826] focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
            >
              {Object.keys(AREAS).map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        )}

        {statusMessage.text && (
          <div
            role="alert"
            className={`rounded-xl p-3 text-xs font-medium ${
              statusMessage.isSuccess
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full mt-2">
          {mode === 'login' ? 'Log In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
        </Button>
      </form>

      {/* Switch mode links */}
      <div className="mt-4 border-t border-line pt-3 text-center text-xs text-mute">
        {mode === 'login' ? (
          <div className="space-x-1">
            <span>Don't have an account?</span>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setStatusMessage({ text: '', isSuccess: false });
              }}
              className="font-bold text-forest hover:underline"
            >
              Sign up
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => {
                setMode('reset');
                setStatusMessage({ text: '', isSuccess: false });
              }}
              className="font-medium text-mute hover:underline"
            >
              Forgot password?
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setStatusMessage({ text: '', isSuccess: false });
            }}
            className="font-bold text-forest hover:underline"
          >
            ← Back to log in
          </button>
        )}
      </div>

      {/* One-click Demo Account Login */}
      {mode === 'login' && (
        <div className="mt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDemoLogin}
            className="w-full text-xs font-semibold"
          >
            ⚡ Quick Log In with Demo Account
          </Button>
        </div>
      )}
    </Modal>
  );
}
