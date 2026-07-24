import type { Coach, GymState, PlanDay } from './types';

export const cloudSyncEnabled = import.meta.env.VITE_CLOUD_SYNC_ENABLED === 'true';

type StateResponse = { state: GymState };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const localActor = import.meta.env.VITE_LOCAL_ACTOR_EMAIL;
  const response = await fetch(`/api/${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(localActor ? { 'x-fever-local-email': localActor } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(payload.error || '数据同步失败，请稍后重试。');
  return payload as T;
}

const write = (path: string, method: string, payload: unknown) => request<StateResponse>(path, {
  method,
  body: JSON.stringify(payload),
});

export const cloudApi = {
  bootstrap: () => request<StateResponse>('bootstrap'),
  createMember: (member: { name: string; phone: string; gender: 'male' | 'female' | 'unknown'; joinDate: string; note: string; avatar: string }) => write('members', 'POST', member),
  updateMember: (memberId: string, member: { name: string; phone: string; gender: 'male' | 'female' | 'unknown'; note: string; status: string }) => write(`members/${memberId}`, 'PATCH', member),
  createPayment: (payment: {
    memberIds: string[]; purchasedSessions: number; giftedSessions: number; receivableAmount: number; actualAmount: number;
    differenceReason: string; payerName: string; paymentMethod: string; receiver: Coach; note: string; purchaseDate: string; packName: string;
  }) => write('payments', 'POST', payment),
  createClass: (log: { memberId: string; coursePackId: string; coach: Coach; date: string; duration: number; content: string; sessionCount: number }) => write('classes', 'POST', log),
  undoClass: (logId: string) => write(`classes/${logId}/undo`, 'POST', {}),
  savePlan: (plan: { memberId: string; title: string; days: PlanDay[]; date: string }) => write('training-plans', 'POST', plan),
  activatePlan: (planId: string) => write(`training-plans/${planId}/activate`, 'POST', {}),
  deletePlan: (planId: string) => write(`training-plans/${planId}`, 'DELETE', {}),
  createAppointment: (appointment: { memberId: string; coach: Coach; startAt: string; duration: number; note: string }) => write('appointments', 'POST', appointment),
  cancelAppointment: (appointmentId: string) => write(`appointments/${appointmentId}/cancel`, 'POST', {}),
  importState: (state: GymState) => write('import', 'POST', { state }),
};
