import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { homeFor, useAuth } from '../AuthContext.jsx';
import { verifyProviderCode } from '../api.js';
import { CapIcon } from '../components/Icons.jsx';
import PasswordField from '../components/PasswordField.jsx';

/**
 * Step 1: enter the provider access code.
 * Step 2: sign in or create a provider account (name, email, organization, password).
 * The code is sent again with every sign in and sign up, and the server checks it each time.
 */
export default function ProviderAuth() {
  const { providerLogin, providerRegister } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [tab, setTab] = useState('register'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', organization: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = tab === 'register';
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function checkCode(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await verifyProviderCode(code.trim());
      setVerified(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const session = isRegister
        ? await providerRegister(form.name.trim(), form.email.trim(), form.password, form.organization.trim(), code.trim())
        : await providerLogin(form.email.trim(), form.password, code.trim());
      // New providers (and any with missing details) go to the company details step first
      navigate(homeFor(session), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function switchTab(next) {
    setTab(next);
    setError('');
  }

  // ---------- Step 1: access code ----------
  if (!verified) {
    return (
      <section className="signup">
        <div className="signup-mark" aria-hidden="true">
          <CapIcon size={30} />
        </div>
        <h1>Provider access</h1>
        <p className="signup-sub">Enter your access code to sign in or register as a course provider.</p>

        <form onSubmit={checkCode} className="signup-form">
          <label className="field-block">
            <span className="field-label">Access code</span>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              required
              autoFocus
            />
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {busy ? 'Checking…' : 'Continue'}
          </button>
        </form>

        <p className="signup-switch">
          Looking for courses instead? <Link to="/login">Learner sign in</Link>
        </p>
      </section>
    );
  }

  // ---------- Step 2: sign in or sign up ----------
  return (
    <section className="signup">
      <div className="signup-mark" aria-hidden="true">
        <CapIcon size={30} />
      </div>
      <h1>{isRegister ? 'Create your provider account' : 'Provider sign in'}</h1>
      <p className="signup-sub">
        {isRegister ? 'List your courses and send learners to your website.' : 'Welcome back.'}
      </p>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={isRegister} className={isRegister ? 'on' : ''} onClick={() => switchTab('register')}>
          Create account
        </button>
        <button role="tab" aria-selected={!isRegister} className={!isRegister ? 'on' : ''} onClick={() => switchTab('login')}>
          Sign in
        </button>
      </div>

      <form onSubmit={submit} className="signup-form">
        {isRegister && (
          <>
            <label className="field-block">
              <span className="field-label">Full name</span>
              <input
                value={form.name}
                onChange={set('name')}
                autoComplete="name"
                placeholder="Your full name"
                required
                maxLength={100}
              />
            </label>

            <label className="field-block">
              <span className="field-label">Organization name</span>
              <input
                value={form.organization}
                onChange={set('organization')}
                placeholder="Shown on your courses"
                required
                maxLength={120}
              />
            </label>
          </>
        )}

        <label className="field-block">
          <span className="field-label">Email</span>
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </label>

        <PasswordField
          value={form.password}
          onChange={set('password')}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          hint={isRegister ? 'Use at least 8 characters' : undefined}
        />

        {error && <p className="form-error" role="alert">{error}</p>}

        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy ? 'Please wait…' : isRegister ? 'Create provider account' : 'Sign in'}
        </button>
      </form>

      <p className="signup-switch">
        <button type="button" className="link-btn" onClick={() => { setVerified(false); setError(''); }}>
          Use a different access code
        </button>
      </p>
    </section>
  );
}
