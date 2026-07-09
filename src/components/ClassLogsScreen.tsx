import React, { useState } from 'react';
import { ClipboardCheck, Search, Calendar, User, Dumbbell, Plus } from 'lucide-react';
import { GymState, ClassLog, Coach } from '../types';

interface ClassLogsScreenProps {
  state: GymState;
  onNavigateToMember: (memberId: string) => void;
  onOpenLogClass?: () => void;
}

type PeriodType = 'today' | 'week' | 'month' | 'all';

export default function ClassLogsScreen({ 
  state, 
  onNavigateToMember,
  onOpenLogClass
}: ClassLogsScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [coachFilter, setCoachFilter] = useState<'all' | Coach>('all');
  
  // 1. Period state - Point 9: Default to Today ('today')
  const [period, setPeriod] = useState<PeriodType>('today');

  // Helper to filter data by the selected period
  const filterByPeriod = (logs: ClassLog[]): ClassLog[] => {
    if (period === 'all') return logs;
    
    const now = new Date('2026-07-09T12:00:00'); // Anchor relative to current local time
    const limitDate = new Date(now);
    
    if (period === 'today') {
      limitDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      limitDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      limitDate.setDate(now.getDate() - 30);
    }
    
    return logs.filter(log => {
      if (!log.date) return false;
      const logDate = new Date(log.date.replace(' ', 'T'));
      return logDate >= limitDate;
    });
  };

  // Filter logs step by step
  const periodLogs = filterByPeriod(state.classLogs);

  const filteredLogs = periodLogs.filter((log) => {
    const matchesSearch = log.memberName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCoach = coachFilter === 'all' || log.coach === coachFilter;
    return matchesSearch && matchesCoach;
  });

  return (
    <div className="space-y-6" id="class-logs-container">
      
      {/* Title Header with log Class button */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">上课消课记录</h2>
          <p className="text-xs text-slate-500 mt-0.5">查看、追溯工作室学员的签到扣课及今日训练日志</p>
        </div>

        {onOpenLogClass && (
          <button
            onClick={onOpenLogClass}
            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/15 cursor-pointer text-xs transition-all"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            快速登记上课扣课
          </button>
        )}
      </div>

      {/* Time Period Filter Bar (Point 9) */}
      <div className="bg-slate-100 border border-slate-200 p-2 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
        <span className="text-xs font-bold text-slate-650 pl-2">📅 记录时间筛选：</span>
        <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200/60 w-full sm:w-auto">
          {[
            { key: 'today', name: '今天' },
            { key: 'week', name: '最近一周' },
            { key: 'month', name: '最近一月' },
            { key: 'all', name: '历史全部' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setPeriod(item.key as PeriodType)}
              className={`flex-1 sm:flex-none px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                period === item.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Control Filters Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
          {/* Search bar */}
          <div className="relative flex-1 md:max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="搜索上课学员..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm"
            />
          </div>

          {/* Coach Filter */}
          <div className="flex gap-2">
            <select
              value={coachFilter}
              onChange={(e) => setCoachFilter(e.target.value as any)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500 text-xs font-bold"
            >
              <option value="all">所有上课教练</option>
              <option value="力王">力王教练的课</option>
              <option value="花花">花花教练的课</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-450 font-medium">
          当前周期共找到 <b className="text-slate-700 font-mono font-bold">{filteredLogs.length}</b> 条记录
        </div>
      </div>

      {/* Logs Listing Card */}
      <div className="space-y-4">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 hover:border-slate-300 transition-all cursor-pointer shadow-sm"
              onClick={() => onNavigateToMember(log.memberId)}
              title="点击查看学员档案与全部记录"
            >
              {/* Header inside row */}
              <div className="flex justify-between items-start text-xs border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-indigo-50 rounded-xl border border-indigo-100/50 flex items-center justify-center font-bold text-indigo-600 uppercase text-sm">
                    {log.memberName[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      {log.memberName}
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        log.coach === '力王' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {log.coach}教练
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-rose-500 font-black font-mono text-sm block">
                    -{log.sessionCount} 节
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1 font-mono flex items-center gap-1 justify-end font-semibold">
                    <Calendar className="h-3 w-3" />
                    {log.date}
                  </span>
                </div>
              </div>

              {/* Body: content */}
              <div className="pt-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">今日授课核心 / 训练记录:</span>
                <p className="text-xs text-slate-600 font-mono bg-slate-50 border border-slate-100 p-3 rounded-xl whitespace-pre-wrap leading-relaxed">
                  {log.content}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white border border-slate-200 shadow-sm rounded-2xl text-slate-400 text-xs font-medium">
            所选筛选范围内暂无签到消课记录。你可以选择切换时间区间，或点击右上方“快速登记上课扣课”按钮！
          </div>
        )}
      </div>
    </div>
  );
}
