import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { createCourse, deleteCourse, getFilterOptions, searchCourses, updateCourse } from '../api.js';
import CourseCard from '../components/CourseCard.jsx';
import CourseForm from '../components/CourseForm.jsx';
import { FilterIcon, SearchIcon } from '../components/Icons.jsx';

const DEFAULTS = { q: '', skill: '', category: '', city: '', type: '', mode: '', sortBy: 'relevance', page: 0, size: 9 };

const SORTS = [
  ['relevance', 'Best match'],
  ['newest', 'Newest first'],
  ['oldest', 'Oldest first'],
  ['title_asc', 'Title A to Z'],
  ['title_desc', 'Title Z to A'],
  ['duration_asc', 'Shortest first'],
  ['duration_desc', 'Longest first'],
];

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select className={value ? '' : 'is-empty'} value={value} onChange={onChange}>
        {children}
      </select>
    </label>
  );
}

export default function Courses() {
  const { canManage } = useAuth();

  const [params] = useSearchParams();
  const startText = params.get('q') || ''; // set when the search box on the Home banner was used

  const [text, setText] = useState(startText);
  const [applied, setApplied] = useState({ ...DEFAULTS, q: startText.trim() });
  const [options, setOptions] = useState({ categories: [], cities: [], skills: [] });
  const [showFilters, setShowFilters] = useState(true);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState(null); // null | 'new' | a course object
  const [confirmId, setConfirmId] = useState(null);

  // Search as the person types: wait a moment after the last letter, then search
  useEffect(() => {
    const t = setTimeout(() => {
      setApplied((a) => (a.q === text.trim() ? a : { ...a, q: text.trim(), page: 0 }));
    }, 250);
    return () => clearTimeout(t);
  }, [text]);

  // Load results whenever the search, a filter, the sort, the page or the data changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    searchCourses(applied)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [applied, reloadKey]);

  // Dropdown choices come from the courses that exist
  useEffect(() => {
    getFilterOptions().then(setOptions).catch(() => {});
  }, [reloadKey]);

  // If a chosen category, city or skill no longer exists (for example its last course was deleted), drop it
  useEffect(() => {
    setApplied((a) => {
      const next = { ...a };
      if (a.category && !options.categories.includes(a.category)) next.category = '';
      if (a.city && !options.cities.includes(a.city)) next.city = '';
      if (a.skill && !options.skills.includes(a.skill)) next.skill = '';
      return next.category === a.category && next.city === a.city && next.skill === a.skill ? a : next;
    });
  }, [options]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const setFilter = (field) => (e) => setApplied((a) => ({ ...a, [field]: e.target.value, page: 0 }));

  function onSearch(e) {
    e.preventDefault();
    setApplied((a) => ({ ...a, q: text.trim(), page: 0 }));
  }

  const filtersActive = Boolean(
    applied.q || applied.skill || applied.category || applied.city || applied.type || applied.mode
  );

  function clearFilters() {
    setText('');
    setApplied((a) => ({ ...DEFAULTS, sortBy: a.sortBy }));
  }

  async function save(payload) {
    const adding = editing === 'new';
    if (adding) await createCourse(payload);
    else await updateCourse(editing.id, payload);
    setEditing(null);
    setNotice(adding ? 'Course added' : 'Changes saved');
    setReloadKey((k) => k + 1);
  }

  async function remove(course) {
    try {
      await deleteCourse(course.id);
      setNotice(`Deleted ${course.title}`);
      // If that was the last course on this page, go back one page
      if (data.content.length === 1 && applied.page > 0) setApplied((a) => ({ ...a, page: a.page - 1 }));
      else setReloadKey((k) => k + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setConfirmId(null);
    }
  }

  const total = data?.totalElements ?? 0;

  return (
    <>
      {canManage && (
        <div className="manage-bar">
          <p>You are signed in as a provider. Add your courses and link learners to your website.</p>
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            Add course
          </button>
        </div>
      )}

      <form className="panel search-panel" onSubmit={onSearch} role="search">
        <input
          type="search"
          placeholder="Start typing a course, skill, city or provider..."
          aria-label="Search courses"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-primary btn-lg">
          <SearchIcon size={20} /> Search
        </button>
      </form>

      <section className="panel filters-panel" aria-label="Filters">
        <div className="filters-head">
          <h2>
            <FilterIcon size={22} /> Filters
          </h2>
          <label className="switch">
            <input
              type="checkbox"
              role="switch"
              aria-label="Show filters"
              checked={showFilters}
              onChange={(e) => setShowFilters(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>

        {showFilters && (
          <div className="filters-grid">
            <FilterSelect label="Skills" value={applied.skill} onChange={setFilter('skill')}>
              <option value="">Skills</option>
              {options.skills.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </FilterSelect>

            <FilterSelect label="Categories" value={applied.category} onChange={setFilter('category')}>
              <option value="">Categories</option>
              {options.categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </FilterSelect>

            <FilterSelect label="Sort By" value={applied.sortBy} onChange={setFilter('sortBy')}>
              {SORTS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect label="City" value={applied.city} onChange={setFilter('city')}>
              <option value="">City</option>
              {options.cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </FilterSelect>

            <FilterSelect label="Course Type" value={applied.type} onChange={setFilter('type')}>
              <option value="">Course Type</option>
              <option value="PAID">Paid</option>
              <option value="FREE">Free</option>
            </FilterSelect>

            <FilterSelect label="Course Mode" value={applied.mode} onChange={setFilter('mode')}>
              <option value="">Course Mode</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
              <option value="HYBRID">Hybrid</option>
            </FilterSelect>
          </div>
        )}
      </section>

      <div className="results-bar">
        <span aria-live="polite">{data && `${total} ${total === 1 ? 'course' : 'courses'} found`}</span>
        {filtersActive && (
          <button className="btn btn-quiet btn-sm" onClick={clearFilters}>
            Clear search and filters
          </button>
        )}
      </div>

      {notice && <p className="notice" role="status">{notice}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {!data && loading && <p className="muted">Loading courses…</p>}

      <div className={`grid${loading && data ? ' is-loading' : ''}`}>
        {data?.content.map((c) => (
          <CourseCard
            key={c.id}
            course={c}
            query={applied.q}
            canEdit={c.editable}
            confirming={confirmId === c.id}
            onEdit={() => setEditing(c)}
            onAskDelete={() => setConfirmId(c.id)}
            onCancelDelete={() => setConfirmId(null)}
            onDelete={() => remove(c)}
          />
        ))}
      </div>

      {data && !loading && data.content.length === 0 && (
        <div className="empty">
          {filtersActive ? (
            <>
              <p>No courses match your search. Try different words or remove a filter.</p>
              <button className="btn btn-outline" onClick={clearFilters}>Clear search and filters</button>
            </>
          ) : canManage ? (
            <>
              <p>No courses have been added yet. Add the first one to get the catalog started.</p>
              <button className="btn btn-primary" onClick={() => setEditing('new')}>Add course</button>
            </>
          ) : (
            <p>No courses have been published yet. Please check back soon.</p>
          )}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <nav className="pager" aria-label="Pages">
          <button
            className="btn btn-quiet"
            disabled={data.number === 0}
            onClick={() => setApplied((a) => ({ ...a, page: a.page - 1 }))}
          >
            Previous
          </button>
          <span>
            Page {data.number + 1} of {data.totalPages}
          </span>
          <button
            className="btn btn-quiet"
            disabled={data.number + 1 >= data.totalPages}
            onClick={() => setApplied((a) => ({ ...a, page: a.page + 1 }))}
          >
            Next
          </button>
        </nav>
      )}

      {editing && (
        <CourseForm
          course={editing === 'new' ? null : editing}
          options={options}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
