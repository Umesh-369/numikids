import { useAppStore } from './store';

const API_BASE = '/api'; // Rewritten via next.config.js to http://localhost:4000

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const state = useAppStore.getState();
  
  // Decide which token to use
  // If requesting children, parent-only analytics, reports, use parentToken.
  // If playing lesson, getting recommendation, submitting session, use childToken.
  let token = state.childToken || state.parentToken;
  
  if (endpoint.includes('/auth') || endpoint.includes('/children') || endpoint.includes('/analytics')) {
    token = state.parentToken;
  }
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error(`API Fetch Error [${endpoint}]:`, error);
    return {
      success: false,
      error: 'Network connection error. Please check your internet.'
    };
  }
}
