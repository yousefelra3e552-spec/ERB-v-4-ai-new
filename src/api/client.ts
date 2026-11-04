/**
 * API Client for Django REST Framework Monorepo
 * Handles full REST endpoints with local caching & optimistic fallback
 */

const BASE_URL = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const currentUser = localStorage.getItem('factory_erp_current_user');
  const parsedUser = currentUser ? JSON.parse(currentUser) : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(parsedUser?.username ? { 'X-Current-User': parsedUser.username } : {}),
    ...(options.headers as Record<string, string> || {})
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || errData.message || `API error ${res.status}`);
    }
    
    return await res.json();
  } catch (err) {
    // If backend is not currently running a live HTTP daemon in preview, throw so caller can fallback to local state
    throw err;
  }
}

export const api = {
  // Roles
  getRoles: () => request<any[]>('/roles/'),
  createRole: (data: any) => request<any>('/roles/', { method: 'POST', body: JSON.stringify(data) }),
  updateRole: (id: string, data: any) => request<any>(`/roles/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRole: (id: string) => request<void>(`/roles/${id}/`, { method: 'DELETE' }),

  // Users
  getUsers: () => request<any[]>('/users/'),
  createUser: (data: any) => request<any>('/users/', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) => request<any>(`/users/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUser: (id: string) => request<void>(`/users/${id}/`, { method: 'DELETE' }),
  toggleUserActive: (id: string) => request<any>(`/users/${id}/toggle_active/`, { method: 'POST' }),
  login: (credentials: { username: string; password?: string }) =>
    request<any>('/users/login/', { method: 'POST', body: JSON.stringify(credentials) }),

  // Accessories
  getAccessoryTypes: () => request<any[]>('/accessory-types/'),
  getAccessories: () => request<any[]>('/accessories/'),
  getLowStockAccessories: () => request<any[]>('/accessories/low_stock/'),
  createAccessory: (data: any) => request<any>('/accessories/', { method: 'POST', body: JSON.stringify(data) }),
  updateAccessory: (id: string, data: any) => request<any>(`/accessories/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAccessory: (id: string) => request<void>(`/accessories/${id}/`, { method: 'DELETE' }),
  accessoryTransaction: (id: string, data: any) =>
    request<any>(`/accessories/${id}/transaction/`, { method: 'POST', body: JSON.stringify(data) }),

  // Fabrics & Colors
  getFabrics: () => request<any[]>('/fabrics/'),
  getFabricColors: () => request<any[]>('/fabric-colors/'),
  recordFabricTransaction: (data: any) => request<any>('/fabric-transactions/', { method: 'POST', body: JSON.stringify(data) }),

  // Models
  getModels: () => request<any[]>('/models/'),
  createModel: (data: any) => request<any>('/models/', { method: 'POST', body: JSON.stringify(data) }),
  issueFabricToCutting: (modelId: string) => request<any>(`/models/${modelId}/issue_fabric/`, { method: 'POST' }),
  addAccessoryToModel: (modelId: string, data: any) =>
    request<any>(`/models/${modelId}/add_accessory/`, { method: 'POST', body: JSON.stringify(data) })
};
