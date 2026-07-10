import React, { useState } from 'react';
import { Layers, Users, Calendar, Plus, ChevronDown, ChevronUp, Search, ExternalLink } from 'lucide-react';
import { GymState, CoursePack } from '../types';
import {
  formatCurrency,
  getGiftedSessions,
  getPurchasedSessions,
  getRemainingGiftedSessions,
  getRemainingPurchasedSessions,
} from '../utils';

interface CoursePackScreenProps {
  state: GymState;
  onOpenLogPayment: () => void;
  onNavigateToMember: (memberId: string) => void;
  embedded?: boolean;
}

export default function CoursePackScreen({
  state,
  onOpenLogPayment,
  onNavigateToMember,
  embedded = false,
}: CoursePackScreenProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Track which row is expanded to show details
  const [expandedPackId, setExpandedPackId] = useState<string | null>(null);

  const toggleExpand = (packId: string) => {
    setExpandedPackId(expandedPackId === packId ? null : packId);
  };

  // Filter packs by status and search student name
  const filteredPacks = state.coursePacks.filter((pack) => {
    // 1. Status Filter
    const matchesStatus = filter === 'all' 
      ? true 
      : filter === 'active' 
        ? (pack.status === 'active' && pack.remainingSessions > 0)
        : (pack.status === 'completed' || pack.remainingSessions <= 0);

    // 2. Student Name Search (Point 7: course packs are inherently tied to members)
    const matchesSearch = searchTerm.trim() === ''
      ? true
      : pack.memberIds.some((mid) => {
          const boundMember = state.members.find((m) => m.id === mid);
          return boundMember && boundMember.name.toLowerCase().includes(searchTerm.toLowerCase());
        });

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6" id="course-pack-container">
      
      {!embedded && (
        <header>
          <h1 className="text-2xl font-extrabold text-slate-900">课包记录</h1>
          <p className="mt-1 text-sm text-slate-500">查看剩余课时、赠送课时和共享学员。</p>
        </header>
      )}

      {/* Control Header with Filters & Search by Student Name */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
          {/* Search bar specifically searching student name */}
          <div className="relative flex-1 md:max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="输入学员姓名搜索课包..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm"
            />
          </div>

          <div className="flex gap-2">
            {[
              { key: 'active', name: '服务中' },
              { key: 'completed', name: '已消完' },
              { key: 'all', name: '全部课包' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as any)}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  filter === item.key
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        {!embedded && (
          <button
            onClick={onOpenLogPayment}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 md:w-auto"
          >
            <Plus className="h-4 w-4" />
            记收款并开包
          </button>
        )}
      </div>

      {/* Course Packs Vertical List (竖向排列，一条一条) */}
      <div className="flex flex-col gap-3">
        {filteredPacks.length > 0 ? (
          filteredPacks.map((pack) => {
            const isExpanded = expandedPackId === pack.id;
            const consumedPercent = Math.round(
              ((pack.totalSessions - pack.remainingSessions) / pack.totalSessions) * 100
            );
            const purchasedSessions = getPurchasedSessions(pack);
            const giftedSessions = getGiftedSessions(pack);
            const remainingPurchasedSessions = getRemainingPurchasedSessions(pack);
            const remainingGiftedSessions = getRemainingGiftedSessions(pack);
            const linkedPayment = state.paymentLogs.find((payment) => payment.coursePackId === pack.id);

            // Fetch list of members bound to this pack
            const boundMembersList = pack.memberIds.map((mid) => {
              const m = state.members.find((mem) => mem.id === mid);
              return m ? m.name : '未知';
            }).filter(Boolean);

            const displayStudentNames = boundMembersList.join('、') || '未绑定学员';

            return (
              <div
                key={pack.id}
                className="bg-white border border-slate-200 rounded-2xl hover:border-slate-350 overflow-hidden shadow-sm transition-all"
              >
                {/* Main Row summary click-to-toggle details */}
                <button
                  type="button"
                  onClick={() => toggleExpand(pack.id)}
                  className="flex w-full flex-col justify-between gap-4 p-4 text-left hover:bg-slate-50/40 sm:flex-row sm:items-center sm:p-5"
                  aria-expanded={isExpanded}
                >
                  {/* Left block: student name label & date */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 bg-indigo-50/85 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <span>{displayStudentNames}</span>
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold mt-1">
                        <span className="flex items-center gap-0.5">
                          <Calendar className="h-3 w-3" />
                          购买: {pack.purchaseDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right block: basic price, remaining sessions & expand trigger */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="grid grid-cols-2 gap-6 text-right font-mono text-xs sm:flex sm:items-center sm:gap-6">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">应收 / 实收</span>
                        <span className="font-bold text-slate-750 font-sans">
                          {formatCurrency(pack.price)} / {formatCurrency(linkedPayment?.amount ?? pack.price)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">课时余额</span>
                        <span className={`font-extrabold ${
                          pack.remainingSessions > 5 ? 'text-indigo-600' : pack.remainingSessions > 0 ? 'text-amber-600' : 'text-slate-400'
                        }`}>
                          {pack.remainingSessions} / {pack.totalSessions} 节
                        </span>
                      </div>
                    </div>

                    <div className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors shrink-0">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </button>

                {/* Expanded content details block */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 bg-slate-50/30 space-y-4">
                    {/* Progress slider indicator */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-500 font-medium font-semibold">
                        <span>课消进度: {consumedPercent}%</span>
                        <span className="font-mono text-slate-600">
                          已消课 {pack.totalSessions - pack.remainingSessions} 节 / 共 {pack.totalSessions} 节
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            pack.remainingSessions === 0
                              ? 'bg-slate-300'
                              : 'bg-indigo-600'
                          }`}
                          style={{ width: `${consumedPercent}%` }}
                        />
                      </div>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <dt className="text-xs font-semibold text-slate-500">已购课时</dt>
                        <dd className="mt-1 text-sm font-bold text-slate-900">{remainingPurchasedSessions} / {purchasedSessions} 节</dd>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <dt className="text-xs font-semibold text-slate-500">赠送课时</dt>
                        <dd className="mt-1 text-sm font-bold text-emerald-700">{remainingGiftedSessions} / {giftedSessions} 节</dd>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <dt className="text-xs font-semibold text-slate-500">有效期</dt>
                        <dd className="mt-1 text-sm font-bold text-slate-900">{pack.expiresAt || '无限期'}</dd>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <dt className="text-xs font-semibold text-slate-500">状态</dt>
                        <dd className="mt-1 text-sm font-bold text-slate-900">
                          {pack.status === 'active' ? '使用中' : pack.status === 'frozen' ? '已冻结' : pack.status === 'completed' ? '已用完' : '已退款'}
                        </dd>
                      </div>
                    </dl>

                    {/* Member details with navigation links */}
                    <div className="p-3 bg-white border border-slate-200/60 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400 font-semibold" />
                        绑定的上课学员列表
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {pack.memberIds.map((mid) => {
                          const boundMember = state.members.find((m) => m.id === mid);
                          if (!boundMember) return null;
                          return (
                            <button
                              key={mid}
                              onClick={() => onNavigateToMember(mid)}
                              className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center gap-1.5 transition-all cursor-pointer"
                              title="点击前往学员详情档案"
                            >
                              <span>{boundMember.name} ({boundMember.phone.slice(-4)})</span>
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl text-slate-400 text-xs shadow-sm font-medium">
            未找到匹配的课包档案记录。
          </div>
        )}
      </div>

    </div>
  );
}
