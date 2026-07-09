import React, { useState } from 'react';
import { Search, UserPlus, Phone, Calendar, ArrowRight, Share2 } from 'lucide-react';
import { GymState, Member } from '../types';
import DefaultAvatar from './DefaultAvatar';

interface MemberManagementScreenProps {
  state: GymState;
  onOpenAddMember: () => void;
  onNavigateToMember: (memberId: string) => void;
  onUpdateState: (newState: GymState) => void;
}

export default function MemberManagementScreen({
  state,
  onOpenAddMember,
  onNavigateToMember,
  onUpdateState,
}: MemberManagementScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');

  // Get single course pack info for each member as they only have one pack
  const getMemberPackInfo = (memberId: string) => {
    const pack = state.coursePacks.find((p) => p.status === 'active' && p.memberIds.includes(memberId));
    if (!pack) {
      return { remaining: 0, sharedWith: null };
    }
    
    // Check if it's shared with someone else
    let sharedWith: string | null = null;
    if (pack.memberIds.length > 1) {
      const otherId = pack.memberIds.find((id) => id !== memberId);
      const otherMember = state.members.find((m) => m.id === otherId);
      if (otherMember) {
        sharedWith = otherMember.name;
      }
    }
    return { remaining: pack.remainingSessions, sharedWith };
  };

  // Filter members (removed status matching)
  const filteredMembers = state.members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm);
    const matchesGender = genderFilter === 'all' || member.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  return (
    <div className="space-y-6" id="member-management-container">
      
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">学员管理</h2>
          <p className="text-xs text-slate-500 mt-0.5">登记、查看和维护工作室所有私教合伙学员</p>
        </div>
      </div>

      {/* Search and Filters Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
          {/* Search bar */}
          <div className="relative flex-1 md:max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="搜索学员姓名或手机号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm font-medium"
            />
          </div>

          {/* Filters Select */}
          <div className="flex gap-2">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500 text-xs font-bold"
            >
              <option value="all">所有性别</option>
              <option value="male">男性</option>
              <option value="female">女性</option>
            </select>
          </div>
        </div>

        {/* Create button */}
        <button
          onClick={onOpenAddMember}
          className="w-full md:w-auto py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/15 cursor-pointer text-xs transition-all"
        >
          <UserPlus className="h-4 w-4 stroke-[2.5]" />
          手动新建学员
        </button>
      </div>

      {/* Members List - Vertical list */}
      <div className="flex flex-col gap-3">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => {
            const { remaining, sharedWith } = getMemberPackInfo(member.id);
            return (
              <div
                key={member.id}
                onClick={() => onNavigateToMember(member.id)}
                className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 hover:border-indigo-300 hover:bg-slate-50/20 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden shadow-sm"
              >
                {/* Visual Gender Accent Line */}
                <div className={`absolute top-0 bottom-0 left-0 w-1.5 h-full ${member.gender === 'female' ? 'bg-rose-500' : 'bg-blue-500'}`} />

                 {/* Left Side: Avatar, Name & Gender Icon */}
                <div className="flex items-center gap-4 pl-1">
                  <DefaultAvatar name={member.name} className="h-11 w-11" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-800">
                        {member.name}
                      </h3>
                      
                      {/* Minimalist Gender Icon representation instead of text labels */}
                      <span className={`p-1 rounded-lg ${
                        member.gender === 'female'
                          ? 'bg-rose-50 text-rose-600 border border-rose-100/40'
                          : 'bg-blue-50 text-blue-600 border border-blue-100/40'
                      }`} title={member.gender === 'female' ? '女性' : '男性'}>
                        {member.gender === 'female' ? (
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-rose-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="10" r="5" />
                            <path d="M12 15v7M9 19h6" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="10" cy="14" r="5" />
                            <path d="M14 10l6-6M14 4h6v6" />
                          </svg>
                        )}
                      </span>

                      {sharedWith && (
                        <span className="flex items-center gap-0.5 bg-indigo-50 border border-indigo-150/40 text-indigo-700 px-1.5 py-0.5 rounded-lg text-[10px] font-bold">
                          <Share2 className="h-2.5 w-2.5" />
                          与{sharedWith}共享
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-3 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="h-3 w-3 text-slate-450" />
                        {member.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-450" />
                        注册: {member.joinDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle Section: Assessment Note */}
                <div className="flex-1 md:px-6 min-w-0">
                  <p className="text-xs text-slate-500 line-clamp-2 md:line-clamp-1 italic font-medium leading-relaxed">
                    {member.note || '暂无体态备注，点击详情进行编辑记录。'}
                  </p>
                </div>

                 {/* Right Side: Remaining Sessions, Course Pack Info & Share Marker */}
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div className="flex flex-col md:items-end">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
                      <span>私教课包余额</span>
                    </div>
                    <span className={`text-base font-extrabold font-mono mt-0.5 ${remaining > 5 ? 'text-emerald-600' : remaining > 0 ? 'text-amber-650 text-amber-600' : 'text-rose-500'}`}>
                      {remaining} 节
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-indigo-650 font-bold group-hover:translate-x-0.5 transition-all flex items-center gap-1 bg-indigo-50 px-2.5 py-1.5 rounded-xl border border-indigo-100/50">
                      档案详情
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl text-slate-400 text-xs shadow-sm font-medium">
            未找到匹配的学员。您可以清除筛选条件，或点击右上方“手动新建学员”按钮！
          </div>
        )}
      </div>

    </div>
  );
}
