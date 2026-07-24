import React from 'react';
import {
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  ClipboardCheck,
  DollarSign,
  Layers,
  UserPlus,
  Users,
} from 'lucide-react';
import { Coach, GymState } from '../types';
import { formatCurrency, getMemberAttention } from '../utils';

interface DashboardScreenProps {
  state: GymState;
  onOpenLogClass: () => void;
  onOpenAddMember: () => void;
  onOpenLogPayment: () => void;
  onNavigateToMember: (memberId: string) => void;
  onNavigateToRecords: (tab: 'logs' | 'payments' | 'packs') => void;
  onOpenAttention: () => void;
  currentCoach: Coach;
}

const parseLocalDate = (value: string) => new Date(value.replace(' ', 'T'));

export default function DashboardScreen({
  state,
  onOpenLogClass,
  onOpenAddMember,
  onOpenLogPayment,
  onNavigateToMember,
  onNavigateToRecords,
  onOpenAttention,
  currentCoach,
}: DashboardScreenProps) {
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const sortedClassLogs = [...state.classLogs].sort((a, b) => b.date.localeCompare(a.date));
  const sortedPaymentLogs = [...state.paymentLogs].sort((a, b) => b.payDate.localeCompare(a.payDate));

  const monthlySessions = sortedClassLogs
    .filter((log) => log.date.startsWith(monthPrefix))
    .reduce((sum, log) => sum + log.sessionCount, 0);
  const monthlyReceipts = sortedPaymentLogs
    .filter((log) => log.payDate.startsWith(monthPrefix))
    .reduce((sum, log) => sum + log.amount, 0);
  const activePacks = state.coursePacks.filter(
    (pack) => pack.status === 'active' && pack.remainingSessions > 0,
  );
  const totalRemainingSessions = activePacks.reduce(
    (sum, pack) => sum + pack.remainingSessions,
    0,
  );

  const { lowSessionMembers, inactiveMembers } = getMemberAttention(state, now);

  const todayLabel = new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(now);

  return (
    <div className="space-y-5" id="dashboard-container">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold text-indigo-600">{todayLabel}</p>
          <h1 className="text-2xl font-extrabold text-slate-900">{currentCoach}的工作台</h1>
          <p className="mt-1 text-sm text-slate-500">今天有上课或收到转账，就在这里记一笔。</p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:w-auto">
          <button
            onClick={onOpenLogClass}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <ClipboardCheck className="h-4 w-4" />
            记消课
          </button>
          <button
            onClick={onOpenLogPayment}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <DollarSign className="h-4 w-4" />
            记收款
          </button>
          <button
            onClick={onOpenAddMember}
            className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 sm:col-span-1"
          >
            <UserPlus className="h-4 w-4" />
            新学员
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="本月账本概览">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
            <span>本月消课</span>
            <ClipboardCheck className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <strong className="text-3xl font-extrabold text-slate-900">{monthlySessions}</strong>
            <span className="text-sm text-slate-500">节</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
            <span>本月实收</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <strong className="mt-3 block text-xl font-extrabold text-slate-900 sm:text-3xl">
            {formatCurrency(monthlyReceipts)}
          </strong>
        </div>

        <button
          onClick={() => onNavigateToRecords('packs')}
          className="rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-indigo-300"
        >
          <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
            <span>可用总课时</span>
            <Layers className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <strong className="text-3xl font-extrabold text-slate-900">{totalRemainingSessions}</strong>
            <span className="text-sm text-slate-500">节</span>
          </div>
        </button>

        <button
          onClick={() => onNavigateToRecords('packs')}
          className="rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-indigo-300"
        >
          <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
            <span>使用中课包</span>
            <Users className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <strong className="text-3xl font-extrabold text-slate-900">{activePacks.length}</strong>
            <span className="text-sm text-slate-500">个</span>
          </div>
        </button>
      </section>

      {(lowSessionMembers.length > 0 || inactiveMembers.length > 0) && (
        <button onClick={onOpenAttention} className="flex w-full flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-indigo-300 sm:flex-row sm:items-center sm:justify-between" aria-label="查看需要关注的学员">
          <span className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><AlertTriangle className="h-5 w-5" /></span><span><strong className="block text-sm text-slate-900">需要关注</strong><span className="mt-0.5 block text-xs text-slate-500">低课时和长期未上课的学员已收进清单</span></span></span>
          <span className="flex items-center gap-2"><span className="rounded-md bg-amber-50 px-2.5 py-1 text-sm font-bold text-amber-800">课时不多 {lowSessionMembers.length}</span><span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-bold text-slate-700">久未上课 {inactiveMembers.length}</span><ChevronRight className="h-4 w-4 text-slate-400" /></span>
        </button>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <ClipboardCheck className="h-4 w-4 text-indigo-600" />
              最近消课
            </h2>
            <button
              onClick={() => onNavigateToRecords('logs')}
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
            >
              全部 <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-slate-100 px-4">
            {sortedClassLogs.length > 0 ? sortedClassLogs.slice(0, 5).map((log) => (
              <button
                key={log.id}
                onClick={() => onNavigateToMember(log.memberId)}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 text-left hover:bg-slate-50"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900">{log.memberName}</span>
                  <span className="block truncate text-sm text-slate-500">{log.content || '未填写备注'} · {log.coach}</span>
                </span>
                <span className="text-right">
                  <strong className="block text-sm text-rose-600">-{log.sessionCount} 节</strong>
                  <span className="text-xs text-slate-400">{log.date}</span>
                </span>
              </button>
            )) : (
              <div className="py-10 text-center text-sm text-slate-500">还没有消课记录</div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              最近收款
            </h2>
            <button
              onClick={() => onNavigateToRecords('payments')}
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
            >
              全部 <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-slate-100 px-4">
            {sortedPaymentLogs.length > 0 ? sortedPaymentLogs.slice(0, 5).map((payment) => (
              <div key={payment.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900">{payment.payerName}</span>
                  <span className="block truncate text-sm text-slate-500">{payment.coursePackName}</span>
                </span>
                <span className="text-right">
                  <strong className="block text-sm text-emerald-700">+{formatCurrency(payment.amount)}</strong>
                  <span className="text-xs text-slate-400">{payment.payDate}</span>
                </span>
              </div>
            )) : (
              <div className="py-10 text-center text-sm text-slate-500">还没有收款记录</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
