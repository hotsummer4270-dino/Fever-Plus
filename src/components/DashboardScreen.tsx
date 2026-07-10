import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  DollarSign,
  Layers,
  UserPlus,
  Users,
} from 'lucide-react';
import { Coach, GymState } from '../types';
import { formatCurrency } from '../utils';

interface DashboardScreenProps {
  state: GymState;
  onOpenLogClass: () => void;
  onOpenAddMember: () => void;
  onOpenLogPayment: () => void;
  onNavigateToMember: (memberId: string) => void;
  onNavigateToTab: (tabId: string) => void;
  currentCoach: Coach;
}

type PeriodType = 'today' | 'week' | 'month' | 'year' | 'all';

const periodOptions: { key: PeriodType; name: string }[] = [
  { key: 'today', name: '今天' },
  { key: 'week', name: '近 7 天' },
  { key: 'month', name: '近 30 天' },
  { key: 'year', name: '近一年' },
  { key: 'all', name: '全部' },
];

const parseLocalDate = (value: string) => new Date(value.replace(' ', 'T'));

export default function DashboardScreen({
  state,
  onOpenLogClass,
  onOpenAddMember,
  onOpenLogPayment,
  onNavigateToMember,
  onNavigateToTab,
  currentCoach,
}: DashboardScreenProps) {
  const [period, setPeriod] = useState<PeriodType>('month');
  const now = new Date();

  const getLimitDate = () => {
    if (period === 'all') return null;
    const limit = new Date(now);
    if (period === 'today') limit.setHours(0, 0, 0, 0);
    if (period === 'week') limit.setDate(limit.getDate() - 7);
    if (period === 'month') limit.setDate(limit.getDate() - 30);
    if (period === 'year') limit.setFullYear(limit.getFullYear() - 1);
    return limit;
  };

  const filterByPeriod = <T extends { date?: string; payDate?: string }>(
    items: T[],
    dateKey: 'date' | 'payDate',
  ) => {
    const limit = getLimitDate();
    if (!limit) return [...items];
    return items.filter((item) => {
      const value = item[dateKey];
      if (!value) return false;
      const itemDate = parseLocalDate(value);
      return !Number.isNaN(itemDate.getTime()) && itemDate >= limit && itemDate <= now;
    });
  };

  const periodClassLogs = filterByPeriod(state.classLogs, 'date')
    .sort((a, b) => b.date.localeCompare(a.date));
  const periodPaymentLogs = filterByPeriod(state.paymentLogs, 'payDate')
    .sort((a, b) => b.payDate.localeCompare(a.payDate));

  const periodCompletedSessions = periodClassLogs.reduce((sum, log) => sum + log.sessionCount, 0);
  const periodRevenue = periodPaymentLogs.reduce((sum, log) => sum + log.amount, 0);
  const periodUniqueStudents = new Set(periodClassLogs.map((log) => log.memberId)).size;

  const activeCoursePacks = state.coursePacks.filter(
    (pack) => pack.status === 'active' && pack.remainingSessions > 0,
  );
  const totalRemainingSessions = activeCoursePacks.reduce(
    (sum, pack) => sum + pack.remainingSessions,
    0,
  );

  const lowSessionWarnings = state.members
    .map((member) => {
      const totalRemaining = state.coursePacks
        .filter(
          (pack) =>
            pack.status === 'active' &&
            pack.remainingSessions > 0 &&
            pack.memberIds.includes(member.id),
        )
        .reduce((sum, pack) => sum + pack.remainingSessions, 0);
      return { member, totalRemaining };
    })
    .filter(({ totalRemaining }) => totalRemaining > 0 && totalRemaining <= 5)
    .sort((a, b) => a.totalRemaining - b.totalRemaining);

  const coachSessions: Record<Coach, number> = { 力王: 0, 花花: 0 };
  periodClassLogs.forEach((log) => {
    coachSessions[log.coach] += log.sessionCount;
  });
  const coachTotal = coachSessions.力王 + coachSessions.花花;
  const liwangPercent = coachTotal ? Math.round((coachSessions.力王 / coachTotal) * 100) : 0;
  const huahuaPercent = coachTotal ? 100 - liwangPercent : 0;

  const periodName = periodOptions.find((item) => item.key === period)?.name ?? '近 30 天';
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
          <h1 className="text-2xl font-extrabold text-slate-900">{currentCoach}教练的工作台</h1>
          <p className="mt-1 text-sm text-slate-500">先处理课时预警，再完成今天的消课与收款登记。</p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:w-auto">
          <button
            onClick={onOpenLogClass}
            className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 sm:col-span-1"
          >
            <ClipboardCheck className="h-4 w-4" />
            快速消课
          </button>
          <button
            onClick={onOpenLogPayment}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-50"
          >
            <DollarSign className="h-4 w-4" />
            收学费
          </button>
          <button
            onClick={onOpenAddMember}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
          >
            <UserPlus className="h-4 w-4" />
            登记学员
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-3 border-y border-slate-200 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <CalendarDays className="h-4 w-4 text-indigo-600" />
          经营数据范围
        </div>
        <div className="flex w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 sm:w-auto">
          {periodOptions.map((item) => (
            <button
              key={item.key}
              onClick={() => setPeriod(item.key)}
              className={`min-h-8 flex-1 whitespace-nowrap rounded-md px-3 text-sm font-semibold transition-colors sm:flex-none ${
                period === item.key
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {lowSessionWarnings.length > 0 && (
        <section
          className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 md:flex-row md:items-center md:justify-between"
          id="low-sessions-warning"
        >
          <div className="flex min-w-0 gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-900">{lowSessionWarnings.length} 位学员需要续课跟进</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {lowSessionWarnings.map(({ member, totalRemaining }) => (
                  <button
                    key={member.id}
                    onClick={() => onNavigateToMember(member.id)}
                    className="rounded-md border border-amber-200 bg-white px-2.5 py-1 text-sm font-semibold text-amber-900 transition-colors hover:border-amber-400"
                  >
                    {member.name} · 余 {totalRemaining} 节
                  </button>
                ))}
              </div>
            </div>
          </div>
          <span className="shrink-0 text-sm font-medium text-amber-700">余额不超过 5 节</span>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label={`${periodName}经营数据`}>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
            <span>{periodName}消课</span>
            <ClipboardCheck className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <strong className="text-3xl font-extrabold text-slate-900">{periodCompletedSessions}</strong>
            <span className="text-sm text-slate-500">节</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
            <span>{periodName}实收</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <strong className="mt-3 block text-xl font-extrabold text-slate-900 sm:text-3xl">
            {formatCurrency(periodRevenue)}
          </strong>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
            <span>消课学员</span>
            <Users className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <strong className="text-3xl font-extrabold text-slate-900">{periodUniqueStudents}</strong>
            <span className="text-sm text-slate-500">/ {state.members.length} 人</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
            <span>可用总课时</span>
            <Layers className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <strong className="text-3xl font-extrabold text-slate-900">{totalRemainingSessions}</strong>
            <span className="text-sm text-slate-500">节</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <ClipboardCheck className="h-4 w-4 text-indigo-600" />
              最近消课
            </h2>
            <button
              onClick={() => onNavigateToTab('logs')}
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
            >
              全部记录 <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 px-4">
            {periodClassLogs.length > 0 ? (
              periodClassLogs.slice(0, 6).map((log) => (
                <button
                  key={log.id}
                  onClick={() => onNavigateToMember(log.memberId)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-sm font-extrabold text-indigo-700">
                      {log.memberName.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{log.memberName}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
                          {log.coach}教练
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-slate-500">{log.content}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <strong className="block text-sm text-rose-600">-{log.sessionCount} 节</strong>
                    <span className="text-xs text-slate-400">{log.date}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="py-12 text-center text-sm text-slate-500">{periodName}暂无消课记录</div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Activity className="h-4 w-4 text-indigo-600" />
            教练消课占比
          </h2>
          <p className="mt-1 text-sm text-slate-500">按实际扣除课时统计</p>

          <div className="mt-6 space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">力王</span>
                <span className="font-bold text-slate-900">{coachSessions.力王} 节 · {liwangPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${liwangPercent}%` }} />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">花花</span>
                <span className="font-bold text-slate-900">{coachSessions.花花} 节 · {huahuaPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${huahuaPercent}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">{periodName}合计</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{coachTotal} 节</p>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              最近收款
            </h2>
            <button
              onClick={() => onNavigateToTab('payments')}
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
            >
              全部账单 <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 px-4">
            {periodPaymentLogs.length > 0 ? (
              periodPaymentLogs.slice(0, 5).map((payment) => (
                <div
                  key={payment.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{payment.payerName}</span>
                      {payment.receiver && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
                          {payment.receiver}收款
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-slate-500">{payment.coursePackName}</p>
                  </div>
                  <div className="text-right">
                    <strong className="block text-sm text-emerald-700">+{formatCurrency(payment.amount)}</strong>
                    <span className="text-xs text-slate-400">{payment.payDate}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-sm text-slate-500">{periodName}暂无收款记录</div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Layers className="h-4 w-4 text-indigo-600" />
            课包状态
          </h2>
          <dl className="mt-4 divide-y divide-slate-100">
            <div className="flex items-center justify-between py-3 text-sm">
              <dt className="text-slate-500">有效课包</dt>
              <dd className="font-bold text-slate-900">{activeCoursePacks.length} 个</dd>
            </div>
            <div className="flex items-center justify-between py-3 text-sm">
              <dt className="text-slate-500">剩余课时</dt>
              <dd className="font-bold text-slate-900">{totalRemainingSessions} 节</dd>
            </div>
            <div className="flex items-center justify-between py-3 text-sm">
              <dt className="text-slate-500">低课时学员</dt>
              <dd className={lowSessionWarnings.length ? 'font-bold text-amber-700' : 'font-bold text-slate-900'}>
                {lowSessionWarnings.length} 人
              </dd>
            </div>
          </dl>
          <button
            onClick={() => onNavigateToTab('packs')}
            className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-1 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            查看全部课包 <ChevronRight className="h-4 w-4" />
          </button>
        </section>
      </div>
    </div>
  );
}
