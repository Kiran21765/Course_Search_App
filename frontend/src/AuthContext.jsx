import { createContext, useContext, useEffect, useState } from 'react';
import * as api from './api.js';

const AuthContext = createContext(null);

export const ROLE_LABELS = { ADMIN: 'Admin', PROVIDER: 'Provider', USER: 'Learner' };

/** Where a person lands after signing in. A provider must finish the company details first. */
export function homeFor(session) {
  if (!session) return '/login';
  if (session.role === 'PROVIDER' && !session.profileComplete) return '/provider/profile';
  return '/courses';
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(api.getSession());

  // api.js fires this when the server rejects an expired token
  useEffect(() => {
    const onExpired = () => setSession(null);
    window.addEventListener('auth-expired', onExpired);
    return () => window.removeEventListener('auth-expired', onExpired);
  }, []);

  function start(data) {
    const s = {
      token: data.token,
      email: data.email,
      name: data.name || data.email,
      role: data.role,
      organization: data.organization || '',
      profileComplete: Boolean(data.profileComplete),
      logoUrl: data.logoUrl || '',
    };
    api.saveSession(s);
    setSession(s);
    return s; // the sign in pages use this to decide where to go next
  }

  const value = {
    session,
    // Providers and the admin can add courses. Whether a given course can be edited
    // comes from the server (course.editable).
    canManage: session?.role === 'ADMIN' || session?.role === 'PROVIDER',

    login: async (email, password) => start(await api.login(email, password)),
    register: async (name, email, password) => start(await api.register(name, email, password)),
    providerLogin: async (email, password, accessCode) => start(await api.providerLogin(email, password, accessCode)),
    providerRegister: async (name, email, password, organization, accessCode) =>
      start(await api.providerRegister(name, email, password, organization, accessCode)),

    /** Merge new details (for example a new logo) into the saved session. */
    updateSession(patch) {
      setSession((current) => {
        const next = { ...current, ...patch };
        api.saveSession(next);
        return next;
      });
    },

    logout() {
      api.clearSession();
      setSession(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
