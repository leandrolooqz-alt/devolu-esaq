import { ReturnCase, StatusDevolucao } from './types';

// Coluna: URL da API
// Título: Endereço do backend
// Fazer: Usar VITE_API_URL no deploy e localhost durante o desenvolvimento.
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || body.error || 'Erro ao comunicar com o servidor.');
  }
  return response.json();
}

export const api = {
  list: () => request<ReturnCase[]>('/api/returns'),
  scanAlerts: () => request<{alertasEnviados:number; falhas:number; pendentes:number}>('/api/alerts/scan', { method: 'POST' }),
  emailStatus: () => request<{configured:boolean; from:string}>('/api/email/status'),
  testEmail: (email: string) => request<{status:string; email:string; emailId:string}>('/api/email/test', { method: 'POST', body: JSON.stringify({ email }) }),
  create: (payload: Omit<ReturnCase, 'id' | 'logs' | 'alertasEnviados' | 'dataPrimeiraAcao' | 'dataResolucao'>) => request<ReturnCase>('/api/returns', { method: 'POST', body: JSON.stringify(payload) }),
  firstAction: (id: string) => request<ReturnCase>(`/api/returns/${id}/first-action`, { method: 'POST' }),
  conclude: (id: string) => request<ReturnCase>(`/api/returns/${id}/conclude`, { method: 'POST' }),
  log: (id: string, descricao: string, novoStatus?: StatusDevolucao) => request<ReturnCase>(`/api/returns/${id}/logs`, { method: 'POST', body: JSON.stringify({ descricao, novoStatus }) }),
  addEmail: (id: string, email: string) => request<ReturnCase>(`/api/returns/${id}/emails`, { method: 'POST', body: JSON.stringify({ email }) }),
  removeEmail: (id: string, email: string) => request<ReturnCase>(`/api/returns/${id}/emails/${encodeURIComponent(email)}`, { method: 'DELETE' }),
  reset: () => request<{status: string}>('/api/returns/reset', { method: 'POST' }),
};
