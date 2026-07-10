import React from 'react';
import { ClipboardCheck, DollarSign, Layers, Plus } from 'lucide-react';
import { GymState } from '../types';
import ClassLogsScreen from './ClassLogsScreen';
import CoursePackScreen from './CoursePackScreen';
import PaymentLogsScreen from './PaymentLogsScreen';

export type RecordsTab = 'logs' | 'payments' | 'packs';

interface RecordsScreenProps {
  state: GymState;
  activeTab: RecordsTab;
  onChangeTab: (tab: RecordsTab) => void;
  onOpenLogClass: () => void;
  onOpenLogPayment: () => void;
  onNavigateToMember: (memberId: string) => void;
  onUndoClass: (logId: string) => void;
}

const tabs: { key: RecordsTab; name: string; icon: typeof ClipboardCheck }[] = [
  { key: 'logs', name: '消课记录', icon: ClipboardCheck },
  { key: 'payments', name: '收款记录', icon: DollarSign },
  { key: 'packs', name: '课包记录', icon: Layers },
];

export default function RecordsScreen({
  state,
  activeTab,
  onChangeTab,
  onOpenLogClass,
  onOpenLogPayment,
  onNavigateToMember,
  onUndoClass,
}: RecordsScreenProps) {
  return (
    <div className="space-y-5" id="records-container">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">记录</h1>
          <p className="mt-1 text-sm text-slate-500">消课、收款和共享课包都在一个地方。</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenLogClass}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700"
          >
            <ClipboardCheck className="h-4 w-4" />
            记消课
          </button>
          <button
            onClick={onOpenLogPayment}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            记收款
          </button>
        </div>
      </header>

      <div className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1" role="tablist">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => onChangeTab(tab.key)}
              className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-bold transition-colors ${
                activeTab === tab.key
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              role="tab"
              aria-selected={activeTab === tab.key}
            >
              <Icon className="h-4 w-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {activeTab === 'logs' && (
        <ClassLogsScreen
          state={state}
          onNavigateToMember={onNavigateToMember}
          onUndoLog={onUndoClass}
          embedded
        />
      )}
      {activeTab === 'payments' && <PaymentLogsScreen state={state} embedded />}
      {activeTab === 'packs' && (
        <CoursePackScreen
          state={state}
          onOpenLogPayment={onOpenLogPayment}
          onNavigateToMember={onNavigateToMember}
          embedded
        />
      )}
    </div>
  );
}
