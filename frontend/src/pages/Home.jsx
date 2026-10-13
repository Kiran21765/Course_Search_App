import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { SearchIcon } from '../components/Icons.jsx';

export default function Home() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState('');

  function search(e) {
    e.preventDefault();
    const q = text.trim();
    navigate(q ? `/courses?q=${encodeURIComponent(q)}` : '/courses');
  }

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-inner">
          <p className="hero-kicker">Courses in your city and online</p>
          <h1 id="hero-title">Find the right course, faster</h1>
          <p className="hero-sub">
            Search by skill, city, and Paid or Free. Then go straight to the provider's website.
          </p>

          <form className="hero-search" onSubmit={search} role="search">
            <input
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Try Java, design or Bengaluru"
              aria-label="Search courses"
            />
            <button className="btn btn-primary btn-lg">
              <SearchIcon size={20} /> Search
            </button>
          </form>

          <div className="hero-actions">
            {session ? (
              <Link to="/courses" className="btn btn-light btn-lg">Browse all courses</Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-light btn-lg">Create a free account</Link>
                <Link to="/provider" className="btn btn-ghost-light btn-lg">I offer courses</Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="features" aria-label="What you can do">
        <article className="feature">
          <h2>Search that follows your letters</h2>
          <p>Type a few letters and the matching courses appear, with the best matches first.</p>
        </article>
        <article className="feature">
          <h2>Filter the way you think</h2>
          <p>Narrow by skill, category, city, Paid or Free, and online, offline or hybrid.</p>
        </article>
        <article className="feature">
          <h2>Go straight to the provider</h2>
          <p>Every course links to the provider's own website, with their logo and contact number.</p>
        </article>
      </section>
    </>
  );
}
