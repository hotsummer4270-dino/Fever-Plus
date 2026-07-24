import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, CalendarClock, ChevronRight } from 'lucide-react';
import type { GymState } from '../types';
import { getMemberAttention } from '../utils';

type AttentionTab = 'low' | 'inactive';

interface AttentionScreenProps {
  state: GymState;
  onBack: () => void;
  onNavigateToMember: (memberId: string) => void;
}

export default function AttentionScreen({ state, onBack, onNavigateToMember }: AttentionScreenProps) {
  const { lowSessionMembers, inactiveMembers } = useMemo(() => getMemberAttention(state), [state]);
  const [activeTab, setActiveTab] = useState<AttentionTab>('low');
  const items = activeTab === 'low' ? lowSessionMembers : inactiveMembers;

  return (
    <div className="space-y-5" id="attention-screen">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <button onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> 返回工作台</button>
          <h1 className="text-2xl font-extrabold text-slate-900">需要关注</h1>
          <p className="mt-1 text-sm text-slate-500">只保留正在使用的课包提醒；迁移来的历史冻结卡不会出现在这里。</p>
        </div>
      </header>

      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1" role="tablist" aria-label="关注清单类型">
        <button role="tab" aria-selected={activeTab === 'low'} onClick={() => setActiveTab('low')} className={`min-h-9 rounded-md px-3 text-sm font-bold ${activeTab === 'low' ? 'bg-amber-50 text-amber-800' : 'text-slate-500 hover:bg-slate-50'}`}>课时不多 {lowSessionMembers.length}</button>
        <button role="tab" aria-selected={activeTab === 'inactive'} onClick={() => setActiveTab('inactive')} className={`min-h-9 rounded-md px-3 text-sm font-bold ${activeTab === 'inactive' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}>久未上课 {inactiveMembers.length}</button>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4 text-sm font-bold text-slate-900">
          {activeTab === 'low' ? <AlertTriangle className="h-4 w-4 text-amber-600" /> : <CalendarClock className="h-4 w-4 text-slate-500" />}
          {activeTab === 'low' ? '剩余 1 至 5 节的学员' : '已经超过 30 天未上课的学员'}
        </div>
        {items.length === 0 ? <p className="p-10 text-center text-sm text-slate-400">当前没有需要关注的学员。</p> : <div className="divide-y divide-slate-100">{items.map((item) => <button key={item.member.id} onClick={() => onNavigateToMember(item.member.id)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 text-left hover:bg-slate-50"><span className="min-w-0"><strong className="block text-sm text-slate-900">{item.member.name}</strong><span className="mt-1 block text-sm text-slate-500">{item.member.phone === '未登记' ? '未登记手机号' : item.member.phone}</span></span><span className="flex items-center gap-3"><strong className={activeTab === 'low' ? 'text-sm text-amber-700' : 'text-sm text-slate-700'}>{activeTab === 'low' ? `${item.remaining} 节` : `${item.days} 天`}</strong><ChevronRight className="h-4 w-4 text-slate-400" /></span></button>)}</div>}
      </section>
    </div>
  );
}
