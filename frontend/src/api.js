const SESSION_KEY = 'coursehub_session';

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

async function request(path, options = {}) {
  const session = getSession();
  const headers = {};
  // A file upload sets its own Content-Type (with the multipart boundary), so only JSON gets one here
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });
  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Token expired or no longer valid: send the person back to a sign in page.
    if (res.status === 401 && session) {
      clearSession();
      window.dispatchEvent(new Event('auth-expired'));
    }
    const fallback =
      res.status === 403 ? 'Your account is not allowed to do this' : 'Something went wrong. Please try again.';
    const err = new Error(data?.message || fallback);
    err.status = res.status;
    throw err;
  }
  return data;
}

const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) });

// ---- Learner auth ----
export const login = (email, password) => post('/auth/login', { email, password });
export const register = (name, email, password) => post('/auth/register', { name, email, password });

// ---- Provider auth (every call carries the access code) ----
export const verifyProviderCode = (accessCode) => post('/auth/provider/verify-code', { accessCode });
export const providerLogin = (email, password, accessCode) =>
  post('/auth/provider/login', { email, password, accessCode });
export const providerRegister = (name, email, password, organization, accessCode) =>
  post('/auth/provider/register', { name, email, password, organization, accessCode });

// ---- Courses ----
export function searchCourses(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) params.set(key, value);
  });
  return request(`/courses?${params}`);
}

export const getFilterOptions = () => request('/courses/filters');
export const createCourse = (course) => post('/courses', course);
export const updateCourse = (id, course) => request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(course) });
export const deleteCourse = (id) => request(`/courses/${id}`, { method: 'DELETE' });

// ---- Provider company profile ----
export const getProfile = () => request('/provider/profile');
export const saveProfile = (profile) => request('/provider/profile', { method: 'PUT', body: JSON.stringify(profile) });
export function uploadLogo(file) {
  const body = new FormData();
  body.append('file', file);
  return request('/provider/logo', { method: 'POST', body });
}
export const removeLogo = () => request('/provider/logo', { method: 'DELETE' });
