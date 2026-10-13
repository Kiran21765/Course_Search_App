import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { getProfile, removeLogo, saveProfile, uploadLogo } from '../api.js';
import { initials, isLogoFile, normalizeUrl, safeUrl } from '../utils.js';

/**
 * Shown right after a provider signs up (and whenever their company details are missing),
 * and again later from Settings. Collects mobile number, company website and logo.
 */
export default function ProviderProfile() {
  const { session, updateSession } = useAuth();
  const navigate = useNavigate();
  const firstTime = !session.profileComplete;

  const [form, setForm] = useState({ organization: '', phone: '', website: '' });
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const fileInput = useRef(null);

  useEffect(() => {
    getProfile()
      .then((p) => {
        setForm({ organization: p.organization, phone: p.phone, website: p.website });
        setLogoUrl(p.logoUrl);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function onFile(e) {
    const file = e.target.files[0];
    e.target.value = ''; // lets the same file be picked again later
    if (!file) return;

    setError('');
    setNotice('');
    if (!isLogoFile(file)) return setError('Upload a PNG, JPG or WebP image');
    if (file.size > 1024 * 1024) return setError('That image is too large. Choose one under 1 MB');

    setUploading(true);
    try {
      const p = await uploadLogo(file);
      setLogoUrl(p.logoUrl);
      updateSession({ logoUrl: p.logoUrl });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function onRemoveLogo() {
    setError('');
    setNotice('');
    setUploading(true);
    try {
      const p = await removeLogo();
      setLogoUrl(p.logoUrl);
      updateSession({ logoUrl: p.logoUrl });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const p = await saveProfile({
        organization: form.organization.trim(),
        phone: form.phone.trim(),
        website: normalizeUrl(form.website),
      });
      setForm({ organization: p.organization, phone: p.phone, website: p.website });
      updateSession({ profileComplete: p.complete, organization: p.organization });
      if (firstTime) navigate('/courses', { replace: true });
      else setNotice('Company details saved');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const websiteLink = safeUrl(normalizeUrl(form.website));

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <section className="settings">
      <h1>{firstTime ? 'Tell learners about your company' : 'Company profile'}</h1>
      <p className="muted lead">
        {firstTime
          ? 'One more step. These details are shown on your courses so learners can reach you.'
          : 'These details are shown to learners on all of your courses.'}
      </p>

      <form className="panel settings-card company-form" onSubmit={submit}>
        <div className="logo-row">
          <div className="logo-preview">
            {logoUrl ? <img src={logoUrl} alt="Your company logo" /> : <span aria-hidden="true">{initials(form.organization)}</span>}
          </div>
          <div>
            <p className="field-label">Company logo</p>
            <p className="field-hint">PNG, JPG or WebP, under 1 MB</p>
            <div className="logo-actions">
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onFile}
                hidden
              />
              <button type="button" className="btn btn-outline btn-sm" disabled={uploading} onClick={() => fileInput.current?.click()}>
                {uploading ? 'Uploading…' : logoUrl ? 'Change logo' : 'Upload logo'}
              </button>
              {logoUrl && (
                <button type="button" className="btn btn-quiet btn-sm" disabled={uploading} onClick={onRemoveLogo}>
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <label className="field-block">
          <span className="field-label">Company or organization name</span>
          <input value={form.organization} onChange={set('organization')} required maxLength={120} />
        </label>

        <label className="field-block">
          <span className="field-label">Mobile number</span>
          <input
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            autoComplete="tel"
            placeholder="+91 98765 43210"
            required
            maxLength={25}
          />
          <small className="field-hint">Shown to learners on your courses</small>
        </label>

        <label className="field-block">
          <span className="field-label">Company website link</span>
          <input
            value={form.website}
            onChange={set('website')}
            inputMode="url"
            placeholder="https://www.yourcompany.com"
            required
            maxLength={500}
          />
          <small className="field-hint">
            Learners go here when they click "Apply Now".{' '}
            {websiteLink && (
              <a href={websiteLink} target="_blank" rel="noopener noreferrer">
                Open this link
              </a>
            )}
          </small>
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}
        {notice && <p className="notice" role="status">{notice}</p>}

        <button className="btn btn-primary btn-lg" disabled={busy || uploading}>
          {busy ? 'Saving…' : firstTime ? 'Save and continue' : 'Save changes'}
        </button>
      </form>
    </section>
  );
}
