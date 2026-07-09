import React, { useState } from 'react';
import { 
  Users, 
  Layers, 
  Calendar, 
  TrendingUp, 
  UserPlus, 
  DollarSign, 
  ClipboardCheck, 
  Activity, 
  Clock,
  ChevronRight,
  AlertTriangle,
  Flame
} from 'lucide-react';
import { GymState, Coach } from '../types';
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

export default function DashboardScreen({
  state,
  onOpenLogClass,
  onOpenAddMember,
  onOpenLogPayment,
  onNavigateToMember,
  onNavigateToTab,
  currentCoach,
}: DashboardScreenProps) {
  // 1. Period state (Default to 'month' / 最近30天)
  const [period, setPeriod] = useState<PeriodType>('month');

  // Helper to filter data by the selected period
  const filterByPeriod = <T extends { date?: string; payDate?: string }>(
    items: T[], 
    dateKey: 'date' | 'payDate'
  ): T[] => {
    if (period === 'all') return items;
    
    const now = new Date('2026-07-09T12:00:00'); // Anchor relative to current local time
    const limitDate = new Date(now);
    
    if (period === 'today') {
      limitDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      limitDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      limitDate.setDate(now.getDate() - 30);
    } else if (period === 'year') {
      limitDate.setFullYear(now.getFullYear() - 1);
    }
    
    return items.filter(item => {
      const val = item[dateKey];
      if (!val) return false;
      const itemDate = new Date(val.replace(' ', 'T'));
      return itemDate >= limitDate;
    });
  };

  // Filtered datasets based on selected period
  const periodClassLogs = filterByPeriod(state.classLogs, 'date');
  const periodPaymentLogs = filterByPeriod(state.paymentLogs, 'payDate');

  // Recalculate stats for the active period
  const periodCompletedSessions = periodClassLogs.reduce((sum, log) => sum + log.sessionCount, 0);
  const periodRevenue = periodPaymentLogs.reduce((sum, log) => sum + log.amount, 0);
  const periodUniqueStudents = new Set(periodClassLogs.map(log => log.memberId)).size;

  // Global inventory stats (These do NOT depend on the period filter)
  const activeCoursePacks = state.coursePacks.filter(p => p.status === 'active' && p.remainingSessions > 0);
  const totalRemainingSessions = activeCoursePacks.reduce((acc, p) => acc + p.remainingSessions, 0);

  // 2. Low course sessions warning (Independent of period filter)
  const lowSessionWarnings = state.members.map(member => {
    const memberPacks = state.coursePacks.filter(p => 
      p.status === 'active' && 
      p.memberIds.includes(member.id)
    );
    const totalRemaining = memberPacks.reduce((sum, p) => sum + p.remainingSessions, 0);
    return {
      member,
      totalRemaining,
    };
  }).filter(item => item.totalRemaining > 0 && item.totalRemaining <= 5)
    .sort((a, b) => a.totalRemaining - b.totalRemaining);

  // Coach breakdown stats for the active period
  const coachClassCount = { '力王': 0, '花花': 0 };
  periodClassLogs.forEach(log => {
    if (log.coach === '力王') coachClassCount['力王']++;
    if (log.coach === '花花') coachClassCount['花花']++;
  });
  
  const periodTotalClasses = periodClassLogs.length || 1;
  const liwangPercent = Math.round((coachClassCount['力王'] / periodTotalClasses) * 100);
  const huahuaPercent = Math.round((coachClassCount['花花'] / periodTotalClasses) * 100);

  return (
    <div className="space-y-6" id="dashboard-container">
      
      {/* Top Banner / Welcome Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white border border-slate-200 p-6 rounded-2xl gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            {/* Minimalist organic branch illustration */}
            <svg viewBox="0 0 100 100" className="w-12 h-12 text-indigo-500 opacity-90" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M50 90 Q50 40 70 15" />
              <path d="M50 70 Q35 60 40 50 Q48 48 50 60 Z" fill="currentColor" fillOpacity="0.15" />
              <path d="M54 50 Q68 42 62 30 Q54 35 53 45 Z" fill="currentColor" fillOpacity="0.15" />
              <path d="M49 35 Q30 28 36 18 Q45 20 48 28 Z" fill="currentColor" fillOpacity="0.15" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2 flex-wrap">
              <span>你好，</span>
              <span className="text-indigo-600 font-extrabold">{currentCoach}教练</span>
              <span className="text-sm font-normal text-slate-500">👋 今天又是执教充满活力的一天！</span>
            </h1>
            <p className="text-[11px] text-slate-400 mt-1">Fever Plus 联营私教工作室专属管理大盘</p>
          </div>
        </div>

        {/* Quick actions row */}
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button
            onClick={onOpenLogClass}
            className="flex-1 md:flex-none py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/15 cursor-pointer text-sm transition-all"
          >
            <ClipboardCheck className="h-4 w-4 stroke-[2.5]" />
            快速消课
          </button>
          <button
            onClick={onOpenLogPayment}
            className="flex-1 md:flex-none py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/15 cursor-pointer text-sm transition-all"
          >
            <DollarSign className="h-4 w-4 stroke-[2.5]" />
            收学费开包
          </button>
          <button
            onClick={onOpenAddMember}
            className="flex-1 md:flex-none py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/15 cursor-pointer text-sm transition-all"
          >
            <UserPlus className="h-4 w-4 stroke-[2.5]" />
            登记学员
          </button>
        </div>
      </div>

      {/* Period Selection Controls Bar */}
      <div className="bg-slate-100 border border-slate-200 p-2 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
        <span className="text-xs font-bold text-slate-600 pl-2">📅 统计时间范围：</span>
        <div className="flex gap-1.5 bg-white p-1 rounded-lg border border-slate-200/60 w-full sm:w-auto">
          {[
            { key: 'today', name: '今天' },
            { key: 'week', name: '最近一周' },
            { key: 'month', name: '最近一月' },
            { key: 'year', name: '最近一年' },
            { key: 'all', name: '历史全部' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setPeriod(item.key as PeriodType)}
              className={`flex-1 sm:flex-none px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                period === item.key
                  ? 'bg-indigo-650 bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Low-session/Insufficient warning section (Always computed globally, independent of period) */}
      {lowSessionWarnings.length > 0 && (
        <div className="bg-amber-50/65 border border-amber-200/50 p-3.5 rounded-xl text-xs text-amber-900 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-xs" id="low-sessions-warning">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="font-bold flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0" />
              <span>课包余额预警 (剩余 ≤ 5节):</span>
            </span>
            <div className="flex flex-wrap gap-1.5 font-bold">
              {lowSessionWarnings.map(({ member, totalRemaining }) => (
                <button
                  key={member.id}
                  onClick={() => onNavigateToMember(member.id)}
                  className="px-2 py-0.5 bg-white border border-amber-200 hover:border-amber-450 text-amber-800 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 hover:bg-amber-50"
                  title="点击查看此学员并提醒续课"
                >
                  <span>{member.name}</span>
                  <span className="text-[10px] bg-amber-100 text-amber-900 px-1 rounded">
                    {totalRemaining}节
                  </span>
                </button>
              ))}
            </div>
          </div>
          <span className="text-[10px] text-amber-600 font-bold md:text-right">有提醒作用，建议及时提醒跟进</span>
        </div>
      )}

      {/* KPI Stats Grid - Period Responsive (3 Columns: Completed Sessions, Revenue, Unique Students) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Completed sessions in period */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-xs font-semibold">消课数量</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ClipboardCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-slate-800 font-mono">
              {periodCompletedSessions}
            </span>
            <span className="text-xs text-slate-450 font-bold">节</span>
          </div>
        </div>

        {/* Revenue in period */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-xs font-semibold">周期学费</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex flex-col">
            <span className="text-2xl font-extrabold text-slate-800 font-mono">
              {formatCurrency(periodRevenue)}
            </span>
          </div>
        </div>

        {/* Unique active members in period */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-xs font-semibold">消课人数</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-800 font-mono">
              {periodUniqueStudents}
            </span>
            <span className="text-[10px] text-slate-400 font-bold">人上过课 (总 {state.members.length} 人)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Data trends and logging */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coach Activity Breakdown - ONLY THE CHART AS REQUESTED */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 lg:col-span-1 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-600" />
              教练消课课时占比分布
            </h3>
            
            {periodClassLogs.length > 0 ? (
              <div className="flex flex-col items-center py-4">
                {/* SVG Doughnut Pie Chart */}
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {/* Background Ring */}
                    <circle
                      cx="50"
                      cy="50"
                      r="36"
                      fill="transparent"
                      stroke="#F1F0EA"
                      strokeWidth="10"
                    />
                    
                    {/* segment 1: 力王 (Deep Green / Indigo-600) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="36"
                      fill="transparent"
                      stroke="#1F4538"
                      strokeWidth="10"
                      strokeDasharray="226.2"
                      strokeDashoffset={226.2 - (liwangPercent / 100) * 226.2}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />

                    {/* segment 2: 花花 (Sage Green / Indigo-400 / Emerald-500) */}
                    {huahuaPercent > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="36"
                        fill="transparent"
                        stroke="#5D9275"
                        strokeWidth="10"
                        strokeDasharray="226.2"
                        strokeDashoffset={226.2 - (huahuaPercent / 100) * 226.2}
                        strokeLinecap="round"
                        transform={`rotate(${(liwangPercent / 100) * 360}, 50, 50)`}
                        className="transition-all duration-500"
                      />
                    )}
                  </svg>
                  
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-slate-400 font-bold tracking-wider">本期总消课</span>
                    <span className="text-xl font-extrabold text-slate-800">{periodClassLogs.length}<b className="text-xs font-semibold ml-0.5">节</b></span>
                  </div>
                </div>

                {/* Pie Chart Legend */}
                <div className="mt-6 w-full space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#1F4538]" />
                      <span className="font-semibold text-slate-600">力王教练</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800">
                      {coachClassCount['力王']} 节 ({liwangPercent || 0}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#5D9275]" />
                      <span className="font-semibold text-slate-600">花花教练</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800">
                      {coachClassCount['花花']} 节 ({huahuaPercent || 0}%)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-450 text-xs text-slate-400 font-medium">
                本时间周期内无消课行为。
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 font-bold">
              力王与花花联营执教数据
            </span>
          </div>
        </div>

        {/* Recent Class Logs in period */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 lg:col-span-2 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              最新消课动态 (本期)
            </h3>
            <button 
              onClick={() => onNavigateToTab('logs')}
              className="text-xs text-indigo-600 hover:text-indigo-500 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              全部记录
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            {periodClassLogs.length > 0 ? (
              periodClassLogs.slice(0, 5).map((log) => (
                <div 
                  key={log.id} 
                  onClick={() => onNavigateToMember(log.memberId)}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-100/40 transition-all duration-150 cursor-pointer flex justify-between items-center group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-indigo-50 rounded-lg border border-indigo-100/50 flex items-center justify-center font-black text-indigo-600 text-sm">
                      {log.memberName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">{log.memberName}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${
                          log.coach === '力王' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-150' 
                            : 'bg-rose-50 text-rose-600 border-rose-150'
                        }`}>
                          {log.coach}教练
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 max-w-[260px] md:max-w-md font-medium">
                        {log.content}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-rose-500 font-mono">
                      -{log.sessionCount} 节
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {log.date.split(' ')[0]}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs font-medium">
                当前周期内暂无扣课记录，点击右上角“快速消课”开始！
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Second Row: Recent Payments */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Payments */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-500" />
              最新学费缴入 (本期)
            </h3>
            <button 
              onClick={() => onNavigateToTab('payments')}
              className="text-xs text-indigo-600 hover:text-indigo-500 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              全部账单
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            {periodPaymentLogs.length > 0 ? (
              periodPaymentLogs.slice(0, 5).map((pay) => {
                const cleanPayPackName = pay.coursePackName.includes('私教课') ? pay.coursePackName : `私教课`;
                return (
                  <div 
                    key={pay.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-200/50 text-amber-600 flex items-center justify-center text-xs font-bold font-mono">
                        {pay.paymentMethod === 'wechat' ? '微' : pay.paymentMethod === 'alipay' ? '支' : pay.paymentMethod === 'bank' ? '卡' : '现'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800">{pay.payerName}</span>
                          <span className="text-[10px] text-slate-500 line-clamp-1 max-w-[150px] md:max-w-xs font-medium">
                            购买了: {cleanPayPackName}
                          </span>
                          {pay.receiver && (
                            <span className="text-[9px] bg-slate-200 text-slate-600 px-1 py-0.2 rounded font-semibold">
                              收款人: {pay.receiver}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                          交易时间: {pay.payDate}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-emerald-600 font-mono">
                        +{formatCurrency(pay.amount)}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        已到账
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                当前周期内暂无缴费入账，点击右上角“收学费开包”登记！
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
