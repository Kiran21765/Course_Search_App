import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { getProfile, removeLogo, saveProfile, uploadLogo } from '../api.js';
import { initials, isLogoFile, normalizeUrl, todayIso } from '../utils.js';

/**
 * Modal used for both "Add course" and "Edit course".
 * `course` is null when adding. `onSave(payload)` must return a promise.
 */
export default function CourseForm({ course, options, onSave, onClose }) {
  const { session, updateSession } = useAuth();
  const isProvider = session.role === 'PROVIDER';

  const [form, setForm] = useState(() =>
    course
      ? {
          title: course.title,
          providerName: course.providerName,
          category: course.category,
          skills: (course.skills || '').split(',').filter(Boolean).join(', '),
          city: course.city || '',
          mode: course.mode,
          type: course.type,
          durationMonths: String(course.durationMonths ?? ''),
          fees: course.fees == null ? '' : String(course.fees),
          applyBy: course.applyBy || '',
          description: course.description || '',
          websiteUrl: course.websiteUrl || '',
        }
      : {
          title: '',
          providerName: session.organization || '',
          category: '',
          skills: '',
          city: '',
          mode: 'ONLINE',
          type: 'FREE',
          durationMonths: '',
          fees: '',
          applyBy: '',
          description: '',
          websiteUrl: '',
        }
  );
  // Company details (shown on every course of this provider). Loaded from the provider's profile.
  const [company, setCompany] = useState({ phone: '', website: '' });
  const [profile, setProfile] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState(null); // a newly picked image, uploaded when the form is saved
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const firstField = useRef(null);
  const logoInput = useRef(null);

  useEffect(() => {
    firstField.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!isProvider) return;
    getProfile()
      .then((p) => {
        setProfile(p);
        setCompany({ phone: p.phone, website: p.website });
        setLogoUrl(p.logoUrl);
      })
      .catch((e) => setError(e.message));
  }, [isProvider]);

  // Show the picked image straight away, and free the preview address when it changes
  const [preview, setPreview] = useState('');
  useEffect(() => {
    if (!logoFile) return setPreview('');
    const url = URL.createObjectURL(logoFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  function onPickLogo(e) {
    const file = e.target.files[0];
    e.target.value = ''; // lets the same file be picked again
    if (!file) return;
    if (!isLogoFile(file)) return setError('Upload a PNG, JPG or WebP image');
    if (file.size > 1024 * 1024) return setError('That image is too large. Choose one under 1 MB');
    setError('');
    setLogoFile(file);
    setLogoRemoved(false);
  }

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (isProvider && !profile) return setError('Your company details are still loading. Please wait a moment.');
    setBusy(true);
    try {
      if (isProvider) {
        // Mobile number and website go on the company profile, so every course of yours shows them
        const phone = company.phone.trim();
        const website = normalizeUrl(company.website);
        if (phone !== profile.phone || website !== profile.website) {
          const p = await saveProfile({ organization: profile.organization, phone, website });
          setProfile(p);
          updateSession({ profileComplete: p.complete });
        }
        if (logoFile) {
          const p = await uploadLogo(logoFile);
          updateSession({ logoUrl: p.logoUrl });
        } else if (logoRemoved && logoUrl) {
          const p = await removeLogo();
          updateSession({ logoUrl: p.logoUrl });
        }
      }
      await onSave({
        title: form.title.trim(),
        providerName: form.providerName.trim(),
        category: form.category.trim(),
        skills: form.skills.trim(),
        city: form.city.trim(),
        mode: form.mode,
        type: form.type,
        durationMonths: Number(form.durationMonths),
        fees: form.type === 'PAID' ? Number(form.fees) : null,
        applyBy: form.applyBy,
        description: form.description.trim(),
        websiteUrl: normalizeUrl(form.websiteUrl),
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title" onSubmit={submit}>
        <h2 id="form-title">{course ? 'Edit course' : 'Add a course'}</h2>

        <div className="form-grid">
          <label className="wide">
            Course title
            <input ref={firstField} value={form.title} onChange={set('title')} required maxLength={150} />
          </label>

          <label className="wide">
            Provider or organization name
            <input value={form.providerName} onChange={set('providerName')} required maxLength={120} />
          </label>

          {isProvider && (
            <div className="wide form-logo">
              <div className="logo-preview">
                {preview || (logoUrl && !logoRemoved) ? (
                  <img src={preview || logoUrl} alt="Company logo" />
                ) : (
                  <span aria-hidden="true">{initials(form.providerName)}</span>
                )}
              </div>
              <div>
                <p className="field-label">Company logo or image</p>
                <p className="field-hint">PNG, JPG or WebP, under 1 MB</p>
                <div className="logo-actions">
                  <input ref={logoInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={onPickLogo} hidden />
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => logoInput.current?.click()}>
                    {preview || (logoUrl && !logoRemoved) ? 'Change logo' : 'Upload logo'}
                  </button>
                  {(preview || (logoUrl && !logoRemoved)) && (
                    <button
                      type="button"
                      className="btn btn-quiet btn-sm"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoRemoved(true);
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <label>
            Category
            <input value={form.category} onChange={set('category')} list="category-options" required maxLength={60} />
            <datalist id="category-options">
              {options.categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>

          <label>
            Duration (months)
            <input type="number" min="1" max="120" step="1" value={form.durationMonths} onChange={set('durationMonths')} required />
          </label>

          <label className="wide">
            Skills you will learn
            <input value={form.skills} onChange={set('skills')} placeholder="Java, Spring Boot, SQL" maxLength={500} />
            <small>Separate skills with commas</small>
          </label>

          <label>
            Course type
            <select value={form.type} onChange={set('type')}>
              <option value="FREE">Free</option>
              <option value="PAID">Paid</option>
            </select>
          </label>

          {form.type === 'PAID' && (
            <label>
              Fees (₹)
              <input type="number" min="1" max="10000000" step="1" value={form.fees} onChange={set('fees')} required placeholder="15000" />
            </label>
          )}

          <label>
            Work mode
            <select value={form.mode} onChange={set('mode')}>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </label>

          <label className="wide">
            Location (city) {form.mode === 'ONLINE' && <small>(optional for online courses)</small>}
            <input
              value={form.city}
              onChange={set('city')}
              list="city-options"
              required={form.mode !== 'ONLINE'}
              maxLength={80}
            />
            <datalist id="city-options">
              {options.cities.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>

          <label>
            Apply by
            <input
              type="date"
              value={form.applyBy}
              onChange={set('applyBy')}
              min={course ? undefined : todayIso()}
              required
            />
          </label>

          <label className="wide">
            Apply link for this course (optional)
            <input
              value={form.websiteUrl}
              onChange={set('websiteUrl')}
              inputMode="url"
              placeholder="https://www.yourwebsite.com"
              maxLength={500}
            />
            <small>The "Apply Now" button opens this link. If left empty, your company website below is used</small>
          </label>

          <label className="wide">
            Description
            <textarea rows="4" value={form.description} onChange={set('description')} maxLength={2000} />
          </label>
          {isProvider && (
            <>
              <p className="form-section">Company contact (shown to learners)</p>
              <label>
                Mobile number
                <input
                  type="tel"
                  value={company.phone}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  required
                  maxLength={25}
                />
              </label>
              <label>
                Company website link
                <input
                  value={company.website}
                  onChange={(e) => setCompany({ ...company, website: e.target.value })}
                  inputMode="url"
                  placeholder="https://www.yourcompany.com"
                  required
                  maxLength={500}
                />
              </label>
            </>
          )}

        </div>

        {error && <p className="error" role="alert">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : course ? 'Save changes' : 'Add course'}
          </button>
        </div>
      </form>
    </div>
  );
}
