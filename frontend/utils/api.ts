const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setToken(token: string, userType?: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
  if (userType) {
    localStorage.setItem('user_type', userType);
  }
}

export function getUserType(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('user_type');
}

export function isAdmin(): boolean {
  return getUserType() === 'admin';
}

export function isStudent(): boolean {
  return getUserType() === 'student';
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user_type');
  // Also clear old 'role' key for backward compatibility
  localStorage.removeItem('role');
}

async function request(path: string, options: RequestInit = {}) {
  const headers: any = { ...(options.headers || {}) };
  if (!('Content-Type' in headers)) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') {
      // Redirect to appropriate login page
      const userType = getUserType();
      window.location.href = userType === 'admin' ? '/admin/login' : '/login';
    }
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

export function apiGet(path: string) {
  return request(path, { method: 'GET' });
}
export function apiPost(path: string, body: any) {
  return request(path, { method: 'POST', body: JSON.stringify(body) });
}
export function apiPut(path: string, body: any) {
  return request(path, { method: 'PUT', body: JSON.stringify(body) });
}
export function apiPatch(path: string, body?: any) {
  return request(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
}

export async function apiLogin(email: string, password: string) {
  const form = new URLSearchParams();
  form.set('username', email);
  form.set('password', password);
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  const data = await res.json();
  setToken(data.access_token, data.user_type);
  return data;
}

// Placement Test APIs
export async function apiGeneratePlacementTest(numQuestions: number = 20) {
  // Default: 20 questions total = 4 questions per chapter × 5 chapters
  return apiPost('/ai/placement-test/generate', { questions_per_chapter: Math.floor(numQuestions / 5) });
}

export async function apiSubmitPlacementTest(testId: string, answers: Record<string, string>) {
  return apiPost('/ai/placement-test/submit', { test_id: testId, answers });
}

export async function apiCheckPlacementTestStatus() {
  try {
    const results = await apiGet('/ai/placement-test/status');
    return results;
  } catch (err) {
    return null;
  }
}
