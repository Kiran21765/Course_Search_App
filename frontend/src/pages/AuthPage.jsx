import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { homeFor, useAuth } from '../AuthContext.jsx';
import { CapIcon } from '../components/Icons.jsx';
import PasswordField from '../components/PasswordField.jsx';

/** Learner sign up / sign in. Providers use /provider instead. */
export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const session = isRegister
        ? await register(form.name.trim(), form.email.trim(), form.password)
        : await login(form.email.trim(), form.password);
      navigate(homeFor(session), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="signup">
      <div className="signup-mark" aria-hidden="true">
        <CapIcon size={30} />
      </div>

      <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
      <p className="signup-sub">
        {isRegister ? 'Find courses by skill, city, and Paid or Free.' : 'Sign in to search courses.'}
      </p>

      <form onSubmit={submit} className="signup-form">
        {isRegister && (
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
          {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <p className="signup-switch">
        {isRegister ? (
          <>Already have an account? <Link to="/login">Sign in</Link></>
        ) : (
          <>New to CourseHub? <Link to="/register">Create an account</Link></>
        )}
      </p>

      <p className="signup-provider">
        Offer courses? <Link to="/provider">Go to the provider page</Link>
      </p>
    </section>
  );
}
