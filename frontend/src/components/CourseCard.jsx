import { formatFees, initials, safeUrl, todayIso } from '../utils.js';
import Highlight from './Highlight.jsx';
import { ClockIcon, ExternalIcon, ModeIcon, PhoneIcon, PinIcon, RupeeIcon, TagIcon } from './Icons.jsx';

const MODE_LABEL = { ONLINE: 'Online', OFFLINE: 'Offline', HYBRID: 'Hybrid' };

export default function CourseCard({ course, query, canEdit, confirming, onEdit, onAskDelete, onCancelDelete, onDelete }) {
  const paid = course.type === 'PAID';
  const applyLink = safeUrl(course.websiteUrl);
  const companyLink = safeUrl(course.providerWebsite);
  const skills = course.skills ? course.skills.split(',') : [];
  const months = course.durationMonths;
  const closed = Boolean(course.applyBy) && course.applyBy < todayIso(); // both are YYYY-MM-DD
  const phone = course.providerPhone;

  return (
    <article className={`card ${paid ? 'card-paid' : 'card-free'}`}>
      <div className="card-head">
        <div className="card-head-text">
          <span className={`badge ${paid ? 'badge-paid' : 'badge-free'}`}>{paid ? 'Paid' : 'Free'}</span>
          <h2 title={course.title}>
            <Highlight text={course.title} query={query} />
          </h2>
          <p className="by" title={course.providerName}>
            at <Highlight text={course.providerName} query={query} />
          </p>
        </div>
        <div className="logo">
          {course.providerLogoUrl ? (
            <img src={course.providerLogoUrl} alt={`${course.providerName} logo`} loading="lazy" />
          ) : (
            <span aria-hidden="true">{initials(course.providerName)}</span>
          )}
        </div>
      </div>

      <div className="card-body">
        <ul className="facts">
          <li>
            <PinIcon />
            <span>
              <b>Location:</b> {course.city || 'Anywhere'}
            </span>
          </li>
          <li>
            <ModeIcon />
            <span>
              <b>Work mode:</b> {MODE_LABEL[course.mode]}
            </span>
          </li>
          <li>
            <ClockIcon />
            <span>
              <b>Duration:</b> {months} {months === 1 ? 'Month' : 'Months'}
            </span>
          </li>
          {paid && course.fees != null && (
            <li>
              <RupeeIcon />
              <span>
                <b>Fees:</b> {formatFees(course.fees)}
              </span>
            </li>
          )}
          {phone && (
            <li>
              <PhoneIcon />
              <span>
                <b>Contact:</b> <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a>
              </span>
            </li>
          )}
          {skills.length > 0 && (
            <li>
              <TagIcon />
              <span className="chips">
                {skills.map((s) => (
                  <span key={s} className="chip">
                    <Highlight text={s} query={query} />
                  </span>
                ))}
              </span>
            </li>
          )}
        </ul>

        {course.description && <p className="desc">{course.description}</p>}
      </div>

      <div className="card-foot">
        <span className={`apply-by${closed ? ' is-closed' : ''}`}>
          {course.applyBy ? `${closed ? 'Closed on' : 'Apply by'} ${course.applyBy}` : ''}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {applyLink && !closed && (
            <a className="btn btn-outline" href={applyLink} target="_blank" rel="noopener noreferrer">
              Apply Now <ExternalIcon size={16} />
            </a>
          )}

          {companyLink && (
            <a className="btn btn-quiet" href={companyLink} target="_blank" rel="noopener noreferrer" title={companyLink}>
              Visit Website <ExternalIcon size={16} />
            </a>
          )}

          {!applyLink && !companyLink && (
            <span className="muted small">No link listed</span>
          )}

          {applyLink && closed && (
            <span className="muted small">Applications closed</span>
          )}
        </div>
      </div>

      {canEdit && (
        <div className="card-owner">
          {confirming ? (
            <div className="actions" role="group" aria-label={`Confirm deleting ${course.title}`}>
              <button className="btn btn-danger btn-sm" onClick={onDelete}>
                Delete course
              </button>
              <button className="btn btn-quiet btn-sm" onClick={onCancelDelete}>
                Keep
              </button>
            </div>
          ) : (
            <div className="actions">
              <button className="btn btn-quiet btn-sm" aria-label={`Edit ${course.title}`} onClick={onEdit}>
                Edit
              </button>
              <button className="btn btn-quiet btn-sm" aria-label={`Delete ${course.title}`} onClick={onAskDelete}>
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}