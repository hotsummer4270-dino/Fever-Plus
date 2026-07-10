import React, { useState } from 'react';
import { Calendar, ClipboardCheck, Plus, RotateCcw, Search } from 'lucide-react';
import { ClassLog, Coach, GymState } from '../types';

interface ClassLogsScreenProps {
  state: GymState;
  onNavigateToMember: (memberId: string) => void;
  onOpenLogClass?: () => void;
  onUndoLog?: (logId: string) => void;
  embedded?: boolean;
}

type PeriodType = 'today' | 'week' | 'month' | 'all';

export default function ClassLogsScreen({
  state,
  onNavigateToMember,
  onOpenLogClass,
  onUndoLog,
  embedded = false,
}: ClassLogsScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [coachFilter, setCoachFilter] = useState<'all' | Coach>('all');
  const [period, setPeriod] = useState<PeriodType>('month');

  const filterByPeriod = (logs: ClassLog[]) => {
    if (period === 'all') return logs;
    const now = new Date();
    const limitDate = new Date(now);
    if (period === 'today') limitDate.setHours(0, 0, 0, 0);
    if (period === 'week') limitDate.setDate(now.getDate() - 7);
    if (period === 'month') limitDate.setDate(now.getDate() - 30);
    return logs.filter((log) => {
      const logDate = new Date(log.date.replace(' ', 'T'));
      return !Number.isNaN(logDate.getTime()) && logDate >= limitDate && logDate <= now;
    });
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredLogs = filterByPeriod([...state.classLogs])
    .filter((log) => {
      const matchesSearch =
        log.memberName.toLowerCase().includes(normalizedSearch) ||
        log.content.toLowerCase().includes(normalizedSearch);
      const matchesCoach = coachFilter === 'all' || log.coach === coachFilter;
      return matchesSearch && matchesCoach;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  const totalSessions = filteredLogs.reduce((sum, log) => sum + log.sessionCount, 0);

  return (
    <div className="space-y-4" id="class-logs-container">
      {!embedded && (
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">消课记录</h1>
            <p className="mt-1 text-sm text-slate-500">每次上完课，扣掉对应课包课时。</p>
          </div>
          {onOpenLogClass && (
            <button
              onClick={onOpenLogClass}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              记消课
            </button>
          )}
        </header>
      )}

      <div className="flex flex-col gap-3 border-y border-slate-200 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1 lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="搜索学员或备注"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="min-h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={coachFilter}
            onChange={(event) => setCoachFilter(event.target.value as 'all' | Coach)}
            className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500"
            aria-label="教练筛选"
          >
            <option value="all">两位教练</option>
            <option value="力王">力王</option>
            <option value="花花">花花</option>
          </select>
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
          {[
            { key: 'today', name: '今天' },
            { key: 'week', name: '近 7 天' },
            { key: 'month', name: '近 30 天' },
            { key: 'all', name: '全部' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setPeriod(item.key as PeriodType)}
              className={`min-h-8 flex-1 whitespace-nowrap rounded-md px-3 text-sm font-semibold sm:flex-none ${
                period === item.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{filteredLogs.length} 条记录</span>
        <strong className="font-bold text-slate-700">合计 {totalSessions} 节</strong>
      </div>

      <div className="space-y-3">
        {filteredLogs.length > 0 ? filteredLogs.map((log) => (
          <article key={log.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <button
                  onClick={() => onNavigateToMember(log.memberId)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-sm font-extrabold text-indigo-700 hover:bg-indigo-100"
                  title="查看学员"
                >
                  {log.memberName.slice(0, 1)}
                </button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onNavigateToMember(log.memberId)}
                      className="text-sm font-bold text-slate-900 hover:text-indigo-700"
                    >
                      {log.memberName}
                    </button>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
                      {log.coach}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {log.content || '未填写上课备注'}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <strong className="block text-base text-rose-600">-{log.sessionCount} 节</strong>
                <span className="mt-1 flex items-center justify-end gap-1 text-xs text-slate-400">
                  <Calendar className="h-3 w-3" /> {log.date}
                </span>
                {onUndoLog && (
                  <button
                    onClick={() => onUndoLog(log.id)}
                    className="mt-2 inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                    title="撤销这次消课并退回课时"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    撤销
                  </button>
                )}
              </div>
            </div>
          </article>
        )) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white py-12 text-center">
            <ClipboardCheck className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">当前范围内没有消课记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
