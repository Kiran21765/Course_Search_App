import { NavLink, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { homeFor, useAuth } from './AuthContext.jsx';
import Footer from './components/Footer.jsx';
import Header from './components/Header.jsx';
import { BuildingIcon, SearchIcon, SettingsIcon } from './components/Icons.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Courses from './pages/Courses.jsx';
import Home from './pages/Home.jsx';
import ProviderAuth from './pages/ProviderAuth.jsx';
import ProviderProfile from './pages/ProviderProfile.jsx';
import Settings from './pages/Settings.jsx';

/** Pages that need a signed-in person. A new provider is sent to finish their company details first. */
function Protected({ children }) {
  const { session } = useAuth();
  const { pathname } = useLocation();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role === 'PROVIDER' && !session.profileComplete && pathname !== '/provider/profile') {
    return <Navigate to="/provider/profile" replace />;
  }
  return children;
}

/** Sign in / sign up pages are for people who are not signed in yet. */
function GuestOnly({ children }) {
  const { session } = useAuth();
  return session ? <Navigate to={homeFor(session)} replace /> : children;
}

function ProviderOnly({ children }) {
  const { session } = useAuth();
  return session?.role === 'PROVIDER' ? children : <Navigate to="/courses" replace />;
}

/** Home and the sign in pages: header, page, footer. */
function PublicLayout() {
  const { pathname } = useLocation();
  return (
    <div className="app">
      <Header />
      <main className={pathname === '/' ? 'home-main' : 'page'}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

/** After sign in: header, a slim navigation bar on the left, and the page. */
function AppLayout() {
  const { session } = useAuth();
  return (
    <div className="app">
      <Header />
      <div className="shell">
        <nav className="sidebar" aria-label="App">
          <NavLink to="/courses" className="side-link">
            <SearchIcon size={22} />
            <span>Search</span>
          </NavLink>
          {session.role === 'PROVIDER' && (
            <NavLink to="/provider/profile" className="side-link">
              <BuildingIcon size={22} />
              <span>Company</span>
            </NavLink>
          )}
          <NavLink to="/settings" className="side-link">
            <SettingsIcon size={22} />
            <span>Settings</span>
          </NavLink>
        </nav>

        <main className="shell-main">
          <div className="shell-inner">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<GuestOnly><AuthPage mode="login" /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><AuthPage mode="register" /></GuestOnly>} />
        <Route path="/provider" element={<GuestOnly><ProviderAuth /></GuestOnly>} />
      </Route>

      <Route element={<Protected><AppLayout /></Protected>}>
        <Route path="/courses" element={<Courses />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/provider/profile" element={<ProviderOnly><ProviderProfile /></ProviderOnly>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
