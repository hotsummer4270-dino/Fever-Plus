import React, { useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Mars,
  Phone,
  Search,
  Share2,
  UserPlus,
  Venus,
} from 'lucide-react';
import { GymState } from '../types';
import DefaultAvatar from './DefaultAvatar';

interface MemberManagementScreenProps {
  state: GymState;
  onOpenAddMember: () => void;
  onNavigateToMember: (memberId: string) => void;
}

type BalanceFilter = 'all' | 'low' | 'empty';
type ActivityFilter = 'all' | 'inactive';

export default function MemberManagementScreen({
  state,
  onOpenAddMember,
  onNavigateToMember,
}: MemberManagementScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>('all');

  const getMemberPackInfo = (memberId: string) => {
    const activePacks = state.coursePacks.filter(
      (pack) => pack.status === 'active' && pack.memberIds.includes(memberId),
    );
    const remaining = activePacks.reduce((sum, pack) => sum + pack.remainingSessions, 0);
    const sharedMemberNames = Array.from(
      new Set(
        activePacks
          .flatMap((pack) => pack.memberIds)
          .filter((id) => id !== memberId)
          .map((id) => state.members.find((member) => member.id === id)?.name)
          .filter((name): name is string => Boolean(name)),
      ),
    );
    return { remaining, sharedWith: sharedMemberNames.join('、') || null };
  };

  const latestClassByMember = new Map<string, string>();
  [...state.classLogs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((log) => {
      if (!latestClassByMember.has(log.memberId)) {
        latestClassByMember.set(log.memberId, log.date);
      }
    });

  const getMemberActivity = (memberId: string, joinDate: string) => {
    const latestClass = latestClassByMember.get(memberId);
    const sourceDate = new Date((latestClass || joinDate).replace(' ', 'T'));
    const inactiveDays = Number.isNaN(sourceDate.getTime())
      ? 0
      : Math.max(0, Math.floor((Date.now() - sourceDate.getTime()) / 86_400_000));
    return { latestClass, inactiveDays, isInactive: inactiveDays >= 30 };
  };

  const filteredMembers = state.members.filter((member) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      member.name.toLowerCase().includes(normalizedSearch) || member.phone.includes(normalizedSearch);
    const { isInactive } = getMemberActivity(member.id, member.joinDate);
    const matchesActivity = activityFilter === 'all' || isInactive;
    const { remaining } = getMemberPackInfo(member.id);
    const matchesBalance =
      balanceFilter === 'all' ||
      (balanceFilter === 'low' && remaining > 0 && remaining <= 5) ||
      (balanceFilter === 'empty' && remaining === 0);
    return matchesSearch && matchesActivity && matchesBalance;
  });

  const renderGenderIcon = (gender: 'male' | 'female' | 'unknown') =>
    gender === 'female' ? (
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-50 text-rose-600" title="女性">
        <Venus className="h-3.5 w-3.5" />
      </span>
    ) : gender === 'male' ? (
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600" title="男性">
        <Mars className="h-3.5 w-3.5" />
      </span>
    ) : (
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500" title="性别未登记">?</span>
    );

  return (
    <div className="space-y-5" id="member-management-container">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">学员</h1>
          <p className="mt-1 text-sm text-slate-500">共 {state.members.length} 位学员，当前显示 {filteredMembers.length} 位</p>
        </div>
        <button
          onClick={onOpenAddMember}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <UserPlus className="h-4 w-4" />
          新建学员
        </button>
      </header>

      <div className="flex flex-col gap-3 border-y border-slate-200 py-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1 lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="搜索姓名或手机号"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <select
            value={balanceFilter}
            onChange={(event) => setBalanceFilter(event.target.value as BalanceFilter)}
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500"
            aria-label="课时筛选"
          >
            <option value="all">全部课时</option>
            <option value="low">低课时（1-5）</option>
            <option value="empty">无可用课时</option>
          </select>
          <select
            value={activityFilter}
            onChange={(event) => setActivityFilter(event.target.value as ActivityFilter)}
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500"
            aria-label="上课活跃度筛选"
          >
            <option value="all">全部上课状态</option>
            <option value="inactive">30 天未上课</option>
          </select>
        </div>
      </div>

      {filteredMembers.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white xl:block">
            <div className="grid grid-cols-[minmax(190px,1.2fr)_100px_150px_140px_minmax(160px,1fr)_36px] items-center gap-4 border-b border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-500">
              <span>学员</span>
              <span>剩余课时</span>
              <span>课包关系</span>
              <span>最近上课</span>
              <span>训练备注</span>
              <span className="sr-only">查看</span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredMembers.map((member) => {
                const { remaining, sharedWith } = getMemberPackInfo(member.id);
                const { latestClass, inactiveDays, isInactive } = getMemberActivity(member.id, member.joinDate);
                return (
                  <button
                    key={member.id}
                    onClick={() => onNavigateToMember(member.id)}
                    className={`group grid w-full grid-cols-[minmax(190px,1.2fr)_100px_150px_140px_minmax(160px,1fr)_36px] items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${isInactive ? 'bg-amber-50/40' : ''}`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <DefaultAvatar name={member.name} className="h-10 w-10 shrink-0" />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <strong className="truncate text-sm text-slate-900">{member.name}</strong>
                          {renderGenderIcon(member.gender)}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="h-3 w-3" /> {member.phone}
                        </span>
                      </span>
                    </span>

                    <strong className={`text-sm ${
                      remaining > 5 ? 'text-indigo-700' : remaining > 0 ? 'text-amber-700' : 'text-rose-600'
                    }`}>
                      {remaining} 节
                    </strong>

                    <span className="min-w-0 text-sm text-slate-600">
                      {sharedWith ? (
                        <span className="flex items-center gap-1 truncate" title={`与 ${sharedWith} 共享`}>
                          <Share2 className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                          与 {sharedWith} 共享
                        </span>
                      ) : (
                        '独立课包'
                      )}
                    </span>

                    <span className={isInactive ? 'text-sm font-semibold text-amber-700' : 'text-sm text-slate-600'}>
                      {latestClass?.split(' ')[0] || '暂无记录'}{isInactive ? ` · ${inactiveDays}天` : ''}
                    </span>
                    <span className="truncate text-sm text-slate-500">{member.note || '暂无训练备注'}</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-700" title="查看学员详情">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 xl:hidden">
            {filteredMembers.map((member) => {
              const { remaining, sharedWith } = getMemberPackInfo(member.id);
              const { latestClass, inactiveDays, isInactive } = getMemberActivity(member.id, member.joinDate);
              return (
                <button
                  key={member.id}
                  onClick={() => onNavigateToMember(member.id)}
                  className={`w-full rounded-lg border p-4 text-left shadow-sm transition-colors hover:border-indigo-300 ${isInactive ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200 bg-white'}`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-3">
                      <DefaultAvatar name={member.name} className="h-11 w-11 shrink-0" />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <strong className="truncate text-base text-slate-900">{member.name}</strong>
                          {renderGenderIcon(member.gender)}
                        </span>
                        <span className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                          <Phone className="h-3.5 w-3.5" /> {member.phone}
                        </span>
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block text-xs font-semibold text-slate-500">剩余课时</span>
                      <strong className={`text-lg ${
                        remaining > 5 ? 'text-indigo-700' : remaining > 0 ? 'text-amber-700' : 'text-rose-600'
                      }`}>
                        {remaining} 节
                      </strong>
                    </span>
                  </span>

                  <span className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {latestClass?.split(' ')[0] || '暂无上课记录'}{isInactive ? ` · ${inactiveDays}天` : ''}
                    </span>
                    <span className="flex items-center justify-end gap-1.5 truncate">
                      {sharedWith && <Share2 className="h-3.5 w-3.5 shrink-0 text-indigo-600" />}
                      {sharedWith ? `与 ${sharedWith} 共享` : '独立课包'}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white py-14 text-center text-sm text-slate-500">
          没有符合当前筛选条件的学员
        </div>
      )}
    </div>
  );
}
