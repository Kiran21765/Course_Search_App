import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { ArrowIcon, CapIcon } from './Icons.jsx';
import ProfileMenu from './ProfileMenu.jsx';

export default function Header() {
  const { session } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        {/* Clicking the logo goes to the Home page, which has the banner */}
        <Link to="/" className="brand" aria-label="CourseHub home">
          <span className="brand-mark"><CapIcon size={26} /></span>
          <span className="brand-name">CourseHub</span>
        </Link>

        <nav className="nav" aria-label="Main">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/courses">Courses</NavLink>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>

        {session ? (
          <ProfileMenu />
        ) : (
          <div className="who">
            <Link to="/login" className="btn btn-outline">Sign In</Link>
            <Link to="/register" className="btn btn-primary">Register</Link>
            <span className="divider" aria-hidden="true" />
            <Link to="/provider" className="link-strong">
              Register as Provider <ArrowIcon size={18} />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
