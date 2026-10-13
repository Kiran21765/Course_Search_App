import { useState } from 'react';

/** Password input with a Show / Hide button. Pass `hint` to show help text under the field. */
export default function PasswordField({ label = 'Password', value, onChange, autoComplete, hint, minLength = 8 }) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="field-block">
      <span className="field-label">{label}</span>
      <span className="password-wrap">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          minLength={minLength}
          required
        />
        <button
          type="button"
          className="toggle-visibility"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </span>
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  );
}
