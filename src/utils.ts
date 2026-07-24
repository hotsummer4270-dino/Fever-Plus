import { GymState, ClassLog, PaymentLog, Member, CoursePack, TrainingPlan } from './types';
import { INITIAL_GYM_STATE } from './initialData';

const LOCAL_STORAGE_KEY = 'lh_studio_gym_state';

export const CURRENT_SCHEMA_VERSION = 3;

export function getPurchasedSessions(pack: CoursePack): number {
  return pack.purchasedSessions ?? pack.totalSessions;
}

export function getGiftedSessions(pack: CoursePack): number {
  return pack.giftedSessions ?? 0;
}

export function getRemainingPurchasedSessions(pack: CoursePack): number {
  if (pack.remainingPurchasedSessions !== undefined) return pack.remainingPurchasedSessions;
  return Math.min(pack.remainingSessions, getPurchasedSessions(pack));
}

export function getRemainingGiftedSessions(pack: CoursePack): number {
  if (pack.remainingGiftedSessions !== undefined) return pack.remainingGiftedSessions;
  return Math.max(0, pack.remainingSessions - getRemainingPurchasedSessions(pack));
}

export function normalizeGymState(state: GymState): GymState {
  const normalizedPacks = (state.coursePacks || []).map((pack) => {
    const purchasedSessions = getPurchasedSessions(pack);
    const giftedSessions = getGiftedSessions(pack);
    const remainingPurchasedSessions = getRemainingPurchasedSessions(pack);
    const remainingGiftedSessions = getRemainingGiftedSessions(pack);
    return {
      ...pack,
      purchasedSessions,
      giftedSessions,
      remainingPurchasedSessions,
      remainingGiftedSessions,
      totalSessions: purchasedSessions + giftedSessions,
      remainingSessions: remainingPurchasedSessions + remainingGiftedSessions,
      expiresAt: pack.expiresAt ?? null,
    };
  });

  const normalizedPayments = (state.paymentLogs || []).map((payment) => {
    const linkedPack = normalizedPacks.find((pack) => pack.id === payment.coursePackId);
    const receivableAmount = payment.receivableAmount ?? linkedPack?.price ?? payment.amount;
    return {
      ...payment,
      receivableAmount,
      discountAmount: payment.discountAmount ?? Math.max(0, receivableAmount - payment.amount),
    };
  });

  return {
    ...state,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    members: state.members || [],
    coursePacks: normalizedPacks,
    paymentLogs: normalizedPayments,
    classLogs: state.classLogs || [],
    trainingPlans: state.trainingPlans || [],
    appointments: state.appointments || [],
  };
}

export function deductSessionsFromPack(pack: CoursePack, count: number) {
  const remainingPurchased = getRemainingPurchasedSessions(pack);
  const remainingGifted = getRemainingGiftedSessions(pack);
  const deductedPurchasedSessions = Math.min(remainingPurchased, count);
  const deductedGiftedSessions = Math.min(remainingGifted, count - deductedPurchasedSessions);
  const nextPurchased = remainingPurchased - deductedPurchasedSessions;
  const nextGifted = remainingGifted - deductedGiftedSessions;
  const nextTotal = nextPurchased + nextGifted;

  return {
    pack: {
      ...pack,
      remainingPurchasedSessions: nextPurchased,
      remainingGiftedSessions: nextGifted,
      remainingSessions: nextTotal,
      status: nextTotal <= 0 ? 'completed' as const : pack.status,
    },
    deductedPurchasedSessions,
    deductedGiftedSessions,
  };
}

export function restoreSessionsToPack(pack: CoursePack, log: ClassLog): CoursePack {
  const purchasedCapacity = getPurchasedSessions(pack);
  const giftedCapacity = getGiftedSessions(pack);
  const currentPurchased = getRemainingPurchasedSessions(pack);
  const currentGifted = getRemainingGiftedSessions(pack);
  const restorePurchased = log.deductedPurchasedSessions ?? log.sessionCount;
  const restoreGifted = log.deductedGiftedSessions ?? 0;
  const nextPurchased = Math.min(purchasedCapacity, currentPurchased + restorePurchased);
  const nextGifted = Math.min(giftedCapacity, currentGifted + restoreGifted);

  return {
    ...pack,
    remainingPurchasedSessions: nextPurchased,
    remainingGiftedSessions: nextGifted,
    remainingSessions: nextPurchased + nextGifted,
    status: 'active',
  };
}

// Load state with fallback to initial data
export function loadGymState(): GymState {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Basic structure validation
      if (parsed.members && parsed.coursePacks && parsed.paymentLogs && parsed.classLogs) {
        return normalizeGymState(parsed as GymState);
      }
    }
  } catch (e) {
    console.error('Error loading gym state from localStorage:', e);
  }
  return normalizeGymState(INITIAL_GYM_STATE);
}

// Save state to localStorage
export function saveGymState(state: GymState): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving gym state to localStorage:', e);
  }
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0
  }).format(amount);
}

// Generate unique ID
export function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

// Date formatter
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  // Custom simple formatter
  const date = new Date(dateStr.replace(' ', 'T'));
  if (isNaN(date.getTime())) return dateStr;
  
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  
  // If it contains hour/min, show both
  if (dateStr.includes(':') || dateStr.includes('T')) {
    return `${y}-${m}-${d} ${h}:${min}`;
  }
  return `${y}-${m}-${d}`;
}

// Local date helpers avoid the UTC day shift caused by toISOString().
export function formatLocalDate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatLocalDateTime(date = new Date()): string {
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${formatLocalDate(date)} ${h}:${min}`;
}

// JSON Data Export
export function exportStateAsJSON(state: GymState): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  
  const today = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `LH_Gym_Backup_${today}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// JSON Data Import Validator
export function validateAndParseImport(jsonText: string): GymState | null {
  try {
    const data = JSON.parse(jsonText);
    if (
      Array.isArray(data.members) &&
      Array.isArray(data.coursePacks) &&
      Array.isArray(data.paymentLogs) &&
      Array.isArray(data.classLogs)
    ) {
      // Valid enough for restoration
      return normalizeGymState(data as GymState);
    }
  } catch (e) {
    console.error('Invalid backup file JSON:', e);
  }
  return null;
}

// Calculate Dashboard Stats
export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalCoursePacks: number;
  activeCoursePacks: number;
  totalRemainingSessions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  coachClassCount: { '力王': number; '花花': number };
  recentClassLogs: ClassLog[];
  recentPaymentLogs: PaymentLog[];
  revenueByMonth: { month: string; amount: number }[];
  classesByCoach: { coach: string; count: number }[];
}

export interface LowSessionAttention {
  member: Member;
  remaining: number;
}

export interface InactiveMemberAttention {
  member: Member;
  days: number;
}

export function getMemberAttention(state: GymState, now = new Date()): {
  lowSessionMembers: LowSessionAttention[];
  inactiveMembers: InactiveMemberAttention[];
} {
  const activeMembers = state.members.filter((member) => member.status === 'active');
  const activePacks = state.coursePacks.filter((pack) => pack.status === 'active' && pack.remainingSessions > 0);
  const lowSessionMembers = activeMembers
    .map((member) => ({
      member,
      remaining: activePacks
        .filter((pack) => pack.memberIds.includes(member.id))
        .reduce((sum, pack) => sum + pack.remainingSessions, 0),
    }))
    .filter(({ remaining }) => remaining > 0 && remaining <= 5)
    .sort((a, b) => a.remaining - b.remaining);

  const latestClassByMember = new Map<string, string>();
  [...state.classLogs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((log) => {
      if (!latestClassByMember.has(log.memberId)) latestClassByMember.set(log.memberId, log.date);
    });
  const inactiveMembers = activeMembers
    .flatMap((member) => {
      const latestClass = latestClassByMember.get(member.id);
      if (!latestClass) return [];
      const activityDate = new Date(latestClass.replace(' ', 'T'));
      if (Number.isNaN(activityDate.getTime())) return [];
      const days = Math.max(0, Math.floor((now.getTime() - activityDate.getTime()) / 86_400_000));
      return days >= 30 ? [{ member, days }] : [];
    })
    .sort((a, b) => b.days - a.days);

  return { lowSessionMembers, inactiveMembers };
}

export function computeDashboardStats(state: GymState): DashboardStats {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
  const currentMonthPrefix = `${currentYear}-${currentMonth}`;

  // Member stats
  const totalMembers = state.members.length;
  const activeMembers = state.members.filter(m => m.status === 'active').length;

  // Course Packs
  const totalCoursePacks = state.coursePacks.length;
  const activePacks = state.coursePacks.filter(p => p.status === 'active' && p.remainingSessions > 0);
  const activeCoursePacks = activePacks.length;

  // Remaining sessions
  const totalRemainingSessions = activePacks.reduce((acc, p) => acc + p.remainingSessions, 0);

  // Revenue stats
  const totalRevenue = state.paymentLogs.reduce((acc, l) => acc + l.amount, 0);
  const monthlyRevenue = state.paymentLogs
    .filter(l => l.payDate.startsWith(currentMonthPrefix))
    .reduce((acc, l) => acc + l.amount, 0);

  // Coach stats
  const coachClassCount = { '力王': 0, '花花': 0 };
  state.classLogs.forEach(log => {
    if (log.coach === '力王') coachClassCount['力王']++;
    if (log.coach === '花花') coachClassCount['花花']++;
  });

  // Recent logs
  const sortedClassLogs = [...state.classLogs].sort((a, b) => b.date.localeCompare(a.date));
  const recentClassLogs = sortedClassLogs.slice(0, 5);

  const sortedPaymentLogs = [...state.paymentLogs].sort((a, b) => b.payDate.localeCompare(a.payDate));
  const recentPaymentLogs = sortedPaymentLogs.slice(0, 5);

  // Monthly revenue chart computation
  const revenueMap: { [key: string]: number } = {};
  state.paymentLogs.forEach(p => {
    const month = p.payDate.substring(0, 7); // "YYYY-MM"
    revenueMap[month] = (revenueMap[month] || 0) + p.amount;
  });

  // Sort and format months
  const revenueByMonth = Object.keys(revenueMap)
    .sort()
    .map(month => ({
      month,
      amount: revenueMap[month]
    }));

  return {
    totalMembers,
    activeMembers,
    totalCoursePacks,
    activeCoursePacks,
    totalRemainingSessions,
    totalRevenue,
    monthlyRevenue,
    coachClassCount,
    recentClassLogs,
    recentPaymentLogs,
    revenueByMonth,
    classesByCoach: [
      { coach: '力王', count: coachClassCount['力王'] },
      { coach: '花花', count: coachClassCount['花花'] }
    ]
  };
}
