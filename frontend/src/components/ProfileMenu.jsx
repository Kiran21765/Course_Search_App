import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROLE_LABELS, useAuth } from '../AuthContext.jsx';
import { initials } from '../utils.js';
import { CaretIcon, LogoutIcon, SettingsIcon } from './Icons.jsx';

export function Avatar({ session, large = false }) {
  return (
    <span className={`avatar${large ? ' avatar-lg' : ''}`} aria-hidden="true">
      {session.logoUrl ? <img src={session.logoUrl} alt="" /> : initials(session.name)}
    </span>
  );
}

/** The avatar + name button at the right of the header. Opens a menu with Settings and Logout. */
export default function ProfileMenu() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);

  // Close on outside click or Escape. Move focus into the menu when it opens.
  useEffect(() => {
    if (!open) return;
    wrapRef.current?.querySelector('[role="menuitem"]')?.focus();

    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function openSettings() {
    setOpen(false);
    navigate('/settings');
  }

  function signOut() {
    setOpen(false);
    logout();
    navigate('/', { replace: true });
  }

  return (
    <div className="profile" ref={wrapRef}>
      <button
        ref={buttonRef}
        className="profile-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Avatar session={session} />
        <span className="profile-name">{session.name}</span>
        <CaretIcon size={16} />
      </button>

      {open && (
        <div className="menu" role="menu" aria-label="Account">
          <div className="menu-head">
            <Avatar session={session} large />
            <div className="menu-who">
              <strong>{session.name}</strong>
              <span className="menu-email">{session.email}</span>
              <span className={`role role-${session.role.toLowerCase()}`}>{ROLE_LABELS[session.role]}</span>
            </div>
          </div>

          <button className="menu-item" role="menuitem" onClick={openSettings}>
            <SettingsIcon size={18} /> Settings
          </button>
          <button className="menu-item menu-item-danger" role="menuitem" onClick={signOut}>
            <LogoutIcon size={18} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
