import { Link } from 'react-router-dom';
import { ROLE_LABELS, useAuth } from '../AuthContext.jsx';
import { MoonIcon, SunIcon } from '../components/Icons.jsx';
import { useTheme } from '../ThemeContext.jsx';

const THEMES = [
  { value: 'light', label: 'Light mode', Icon: SunIcon },
  { value: 'dark', label: 'Dark mode', Icon: MoonIcon },
];

export default function Settings() {
  const { session } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <section className="settings">
      <h1>Settings</h1>

      <div className="panel settings-card">
        <h2>Appearance</h2>
        <p className="muted">Choose how CourseHub looks. This is saved on this device.</p>

        <div className="theme-options" role="radiogroup" aria-label="Theme">
          {THEMES.map(({ value, label, Icon }) => (
            <label key={value} className={`theme-card${theme === value ? ' on' : ''}`}>
              <input
                type="radio"
                name="theme"
                value={value}
                checked={theme === value}
                onChange={() => setTheme(value)}
              />
              <span className={`theme-preview preview-${value}`} aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="theme-label">
                <Icon size={18} /> {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="panel settings-card">
        <h2>Account</h2>
        <dl className="details">
          <div><dt>Name</dt><dd>{session.name}</dd></div>
          <div><dt>Email</dt><dd>{session.email}</dd></div>
          <div><dt>Account type</dt><dd>{ROLE_LABELS[session.role]}</dd></div>
          {session.role === 'PROVIDER' && <div><dt>Organization</dt><dd>{session.organization}</dd></div>}
        </dl>
      </div>

      {session.role === 'PROVIDER' && (
        <div className="panel settings-card">
          <h2>Company profile</h2>
          <p className="muted">Your mobile number, website link and logo, shown on your courses.</p>
          <Link to="/provider/profile" className="btn btn-outline">Edit company profile</Link>
        </div>
      )}
    </section>
  );
}
