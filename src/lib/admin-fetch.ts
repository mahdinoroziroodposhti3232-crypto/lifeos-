export async function adminFetch<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const secret =
    typeof window !== 'undefined' ? localStorage.getItem('admin_secret') : null;
  if (!secret) throw new Error('عدم دسترسی');

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'x-admin-secret': secret,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_secret');
      window.location.href = '/admin/login';
    }
    throw new Error('عدم دسترسی');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'خطای ناشناخته' }));
    throw new Error(err.error || `خطای سرور: ${res.status}`);
  }

  return res.json();
}