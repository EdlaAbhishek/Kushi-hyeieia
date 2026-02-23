const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('khushi_token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errStr = 'API Error';
        try {
            const errData = await response.json();
            errStr = errData.error || errStr;
        } catch (e) { }
        throw new Error(errStr);
    }

    // Check for empty body (204 No Content)
    if (response.status === 204) return null;

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}
