import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  Calendar, 
  Notebook, 
  Dumbbell, 
  DollarSign, 
  ClipboardCheck, 
  Activity, 
  Plus, 
  Trash2, 
  Save, 
  Edit2, 
  Share2, 
  Check, 
  X,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';
import { GymState, Member, ClassLog, CoursePack, PaymentLog, TrainingPlan, PlanDay, Exercise } from '../types';
import {
  formatCurrency,
  formatLocalDate,
  generateId,
  getGiftedSessions,
  getPurchasedSessions,
  getRemainingGiftedSessions,
  getRemainingPurchasedSessions,
} from '../utils';
import DefaultAvatar from './DefaultAvatar';

interface MemberDetailScreenProps {
  memberId: string;
  state: GymState;
  onBack: () => void;
  onUpdateState: (newState: GymState) => void;
  onOpenLogClass: () => void;
  onOpenLogPayment: () => void;
}

export default function MemberDetailScreen({
  memberId,
  state,
  onBack,
  onUpdateState,
  onOpenLogClass,
  onOpenLogPayment,
}: MemberDetailScreenProps) {
  const parseDayTitle = (dayTitle: string) => {
    const index = dayTitle.indexOf(' | ');
    if (index !== -1) {
      const date = dayTitle.substring(0, index);
      const title = dayTitle.substring(index + 3);
      return { date, title };
    }
    return { date: formatLocalDate(), title: dayTitle };
  };

  const member = state.members.find((m) => m.id === memberId);
  const [subTab, setSubTab] = useState<'plan' | 'logs' | 'packs' | 'profile'>('logs');
  
  // States for Editing profile
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGender, setEditGender] = useState<'male' | 'female'>('female');
  const [editNote, setEditNote] = useState('');

  // States for Training Plan Builder
  const [isBuildingPlan, setIsBuildingPlan] = useState(false);
  const [planTitle, setPlanTitle] = useState('');
  
  const todayDateStr = formatLocalDate();
  const [planDays, setPlanDays] = useState<PlanDay[]>([
    { dayTitle: `${todayDateStr} | 全身力量训练`, exercises: [{ name: '', sets: 4, reps: '10', weight: '20kg', note: '' }] }
  ]);

  // Initialize edit forms if member exists
  React.useEffect(() => {
    if (member) {
      setEditName(member.name);
      setEditPhone(member.phone);
      setEditGender(member.gender);
      setEditNote(member.note);
    }
  }, [member]);

  if (!member) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white py-12 text-center shadow-sm">
        <p className="text-sm font-semibold text-slate-500">学员未找到</p>
        <button onClick={onBack} className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200">返回学员列表</button>
      </div>
    );
  }

  // Filter logs specifically for this member
  const memberClassLogs = state.classLogs
    .filter((l) => l.memberId === member.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const memberPacks = state.coursePacks.filter((p) => p.memberIds.includes(member.id));
  const memberPayments = state.paymentLogs.filter((p) => {
    // Linked either directly to member's packs
    const packIds = memberPacks.map(mp => mp.id);
    return packIds.includes(p.coursePackId) || p.payerName === member.name;
  }).sort((a, b) => b.payDate.localeCompare(a.payDate));
  const memberPlans = state.trainingPlans.filter((p) => p.memberId === member.id);
  const activePlan = memberPlans.find((p) => p.isActive);

  // Remaining lessons calculation
  const remainingLessons = memberPacks
    .filter(p => p.status === 'active')
    .reduce((acc, p) => acc + p.remainingSessions, 0);
  const completedLessons = memberClassLogs.reduce((sum, log) => sum + log.sessionCount, 0);

  // Save profile changes
  const handleSaveProfile = () => {
    const updatedMembers = state.members.map((m) => {
      if (m.id === member.id) {
        return {
          ...m,
          name: editName,
          phone: editPhone,
          gender: editGender,
          note: editNote,
        };
      }
      return m;
    });

    onUpdateState({
      ...state,
      members: updatedMembers,
    });
    setIsEditingProfile(false);
  };

  // Helper: Adding day or exercise in builder
  const addDayToPlan = () => {
    const todayStr = formatLocalDate();
    setPlanDays([...planDays, { dayTitle: `${todayStr} | 自定义训练`, exercises: [{ name: '', sets: 4, reps: '12', weight: '10kg', note: '' }] }]);
  };

  const removeDayFromPlan = (dayIdx: number) => {
    setPlanDays(planDays.filter((_, idx) => idx !== dayIdx));
  };

  const addExerciseToDay = (dayIdx: number) => {
    const updated = [...planDays];
    updated[dayIdx].exercises.push({ name: '', sets: 4, reps: '10', weight: '20kg', note: '' });
    setPlanDays(updated);
  };

  const removeExerciseFromDay = (dayIdx: number, exIdx: number) => {
    const updated = [...planDays];
    updated[dayIdx].exercises = updated[dayIdx].exercises.filter((_, idx) => idx !== exIdx);
    setPlanDays(updated);
  };

  const updateExerciseField = (dayIdx: number, exIdx: number, field: keyof Exercise, value: any) => {
    const updated = [...planDays];
    updated[dayIdx].exercises[exIdx] = {
      ...updated[dayIdx].exercises[exIdx],
      [field]: value
    };
    setPlanDays(updated);
  };

  const updateDayTitle = (dayIdx: number, value: string) => {
    const updated = [...planDays];
    updated[dayIdx].dayTitle = value;
    setPlanDays(updated);
  };

  // Save training plan
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle.trim()) return;

    // Filter out empty exercises
    const cleanDays = planDays.map(day => ({
      ...day,
      exercises: day.exercises.filter(ex => ex.name.trim() !== '')
    })).filter(day => day.exercises.length > 0);

    if (cleanDays.length === 0) {
      alert('计划中必须包含至少一个填有名称的训练动作！');
      return;
    }

    // Set other plans of this member to inactive
    const updatedPlans = state.trainingPlans.map(p => {
      if (p.memberId === member.id) {
        return { ...p, isActive: false };
      }
      return p;
    });

    const newPlan: TrainingPlan = {
      id: generateId('plan'),
      memberId: member.id,
      title: planTitle.trim(),
      createdAt: formatLocalDate(),
      updatedAt: formatLocalDate(),
      days: cleanDays,
      isActive: true
    };

    onUpdateState({
      ...state,
      trainingPlans: [newPlan, ...updatedPlans]
    });

    setIsBuildingPlan(false);
    setPlanTitle('');
    setPlanDays([{ dayTitle: `${todayDateStr} | 全身力量训练`, exercises: [{ name: '', sets: 4, reps: '10', weight: '20kg', note: '' }] }]);
  };

  const deletePlan = (planId: string) => {
    onUpdateState({
      ...state,
      trainingPlans: state.trainingPlans.filter(p => p.id !== planId)
    });
  };

  const getSharedMemberName = () => {
    const pack = state.coursePacks.find((p) => p.status === 'active' && p.memberIds.includes(member.id));
    if (pack && pack.memberIds.length > 1) {
      const otherId = pack.memberIds.find((id) => id !== member.id);
      const otherMember = state.members.find((m) => m.id === otherId);
      return otherMember ? otherMember.name : null;
    }
    return null;
  };
  const sharedName = getSharedMemberName();

  return (
    <div className="space-y-5" id="member-detail-container">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          返回学员列表
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenLogClass}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
          >
            <ClipboardCheck className="h-4 w-4" />
            记消课
          </button>
          <button
            onClick={onOpenLogPayment}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
          >
            <DollarSign className="h-4 w-4" />
            记收款
          </button>
        </div>
      </div>

      {/* Member Profile Card */}
      <div className="relative z-10 overflow-hidden rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur md:sticky md:top-4" id="profile-card">
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-indigo-600" />
        
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="flex items-start gap-4">
            <DefaultAvatar name={member.name} className="h-16 w-16 text-2xl" />
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{member.name}</h2>
                <span className={`p-1 rounded-lg ${
                  member.gender === 'female' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                }`} title={member.gender === 'female' ? '女性' : '男性'}>
                  {member.gender === 'female' ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="10" r="5" />
                      <path d="M12 15v7M9 19h6" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="10" cy="14" r="5" />
                      <path d="M14 10l6-6M14 4h6v6" />
                    </svg>
                  )}
                </span>
                {sharedName && (
                  <span className="flex items-center gap-1 rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
                    <Share2 className="h-3 w-3" />
                    与 {sharedName} 共享课包
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="flex items-center gap-1 font-semibold">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {member.phone}
                </span>
                <span className="flex items-center gap-1 font-semibold">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  建档日期：{member.joinDate}
                </span>
              </div>

              <p className="mt-2 max-w-2xl rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm font-medium leading-6 text-slate-650">
                <b className="mb-0.5 block font-bold text-slate-500">备注</b>
                {member.note || '暂无备注'}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 md:self-center md:text-right">
            <div className="min-w-[120px] rounded-lg border border-slate-100 bg-slate-50 p-3 text-center md:text-right">
              <span className="block text-sm font-semibold text-slate-500">剩余课时</span>
              <span className={`text-2xl font-black ${remainingLessons > 5 ? 'text-indigo-700' : 'text-amber-700'}`}>
                {remainingLessons} <small className="text-sm">节</small>
              </span>
            </div>
            
            <div className="min-w-[120px] rounded-lg border border-slate-100 bg-slate-50 p-3 text-center md:text-right">
              <span className="block text-sm font-semibold text-slate-500">累计消课</span>
              <span className="text-2xl font-black text-slate-900">
                {completedLessons} <small className="text-sm">节</small>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex gap-5 overflow-x-auto border-b border-slate-200">
        {[
          { key: 'logs', name: '消课记录', icon: ClipboardCheck },
          { key: 'packs', name: '课包与收款', icon: DollarSign },
          { key: 'plan', name: '训练计划', icon: Dumbbell },
          { key: 'profile', name: '基本资料', icon: Notebook },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setSubTab(tab.key as any);
                setIsEditingProfile(false);
                setIsBuildingPlan(false);
              }}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 pb-3 text-sm font-bold transition-colors ${
                isActive 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Sub Tab Content Panels */}
      <div className="min-h-[250px]" id="member-subtab-content">
        
        {/* 1. TRAINING PLAN TAB */}
        {subTab === 'plan' && (
          <div className="space-y-4">
            {!isBuildingPlan ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-850 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-indigo-600" />
                    当前执行中的训练计划
                  </h3>
                  <button
                    onClick={() => {
                      setPlanTitle(`${member.name} - 新一轮力量训练计划`);
                      setIsBuildingPlan(true);
                    }}
                    className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 font-bold rounded-xl flex items-center gap-1 cursor-pointer text-xs transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                    定制新训练计划
                  </button>
                </div>

                {/* Active Plan View */}
                {activePlan ? (
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden p-6 space-y-6 shadow-sm">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                      <div>
                        <h4 className="text-base font-bold text-slate-800">{activePlan.title}</h4>
                        <span className="text-[10px] text-slate-400 block mt-1 font-mono font-medium">
                          定制于: {activePlan.createdAt} • 最近更新: {activePlan.updatedAt}
                        </span>
                      </div>
                      <button
                        onClick={() => deletePlan(activePlan.id)}
                        className="p-2 hover:bg-rose-50 border border-transparent hover:border-rose-100 text-slate-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                        title="删除此计划"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Days listing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {activePlan.days.map((day, dIdx) => {
                        const { date, title } = parseDayTitle(day.dayTitle);
                        return (
                          <div key={dIdx} className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded border border-slate-300 font-mono">
                                {date || todayDateStr}
                              </span>
                              <span className="text-[11px] font-bold text-indigo-750 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                🏋️ {title}
                              </span>
                            </div>
                            
                            <div className="space-y-2.5">
                              {day.exercises.map((ex, eIdx) => (
                                <div key={eIdx} className="p-2.5 bg-white rounded-lg border border-slate-200/60 flex justify-between items-center text-xs shadow-xs">
                                  <div>
                                    <span className="font-bold text-slate-800 block">{ex.name}</span>
                                    {ex.note && <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">💡 {ex.note}</span>}
                                  </div>
                                  <div className="text-right font-mono">
                                    <span className="text-slate-600 block font-semibold">{ex.sets} 组 x {ex.reps} 次</span>
                                    <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">负重: {ex.weight}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white border border-slate-200 shadow-sm rounded-2xl text-slate-400 text-xs font-medium">
                    <span>当前暂无生效计划。点击右上角“定制新训练计划”为该学员快速配课！</span>
                  </div>
                )}

                {/* Inactive historical plans */}
                {memberPlans.filter(p => !p.isActive).length > 0 && (
                  <div className="space-y-2 mt-6">
                    <h4 className="text-xs font-bold text-slate-400">历史训练方案备份</h4>
                    <div className="space-y-2">
                      {memberPlans.filter(p => !p.isActive).map((p) => (
                        <div key={p.id} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center text-xs text-slate-500 shadow-xs">
                          <span className="font-medium">{p.title} (定制日期: {p.createdAt})</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                // Toggle active state
                                const updated = state.trainingPlans.map(tp => {
                                  if (tp.memberId === member.id) {
                                    return { ...tp, isActive: tp.id === p.id };
                                  }
                                  return tp;
                                });
                                onUpdateState({ ...state, trainingPlans: updated });
                              }}
                              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg cursor-pointer font-bold text-[11px] transition-colors"
                            >
                              重新启用
                            </button>
                            <button
                              onClick={() => deletePlan(p.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // 2. Training Plan Builder Form
              <form onSubmit={handleSavePlan} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">正在录入新健身方案</h4>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">保存后会自动成为该学员当前默认的主训方案</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBuildingPlan(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1.5">计划方案总标题 *</label>
                  <input
                    type="text"
                    value={planTitle}
                    onChange={(e) => setPlanTitle(e.target.value)}
                    placeholder="例如：陈小强 - 核心提升与深蹲硬拉突破一期"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm"
                    required
                  />
                </div>

                {/* Days Builder */}
                <div className="space-y-6">
                  {planDays.map((day, dIdx) => {
                    const { date, title } = parseDayTitle(day.dayTitle);
                    return (
                      <div key={dIdx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                          <div className="flex items-center gap-2 flex-1 flex-wrap">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase">训练日期:</span>
                            <input
                              type="date"
                              value={date || todayDateStr}
                              onChange={(e) => {
                                const newDate = e.target.value;
                                updateDayTitle(dIdx, `${newDate} | ${title || '全身力量训练'}`);
                              }}
                              className="bg-white border border-slate-200 px-2.5 py-1 text-xs text-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono"
                              required
                            />
                            
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase sm:ml-2">自定义名字:</span>
                            <input
                              type="text"
                              value={title}
                              onChange={(e) => {
                                const newTitle = e.target.value;
                                updateDayTitle(dIdx, `${date || todayDateStr} | ${newTitle}`);
                              }}
                              className="bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 flex-1 min-w-[150px]"
                              placeholder="例如：全身核心力量强化"
                              required
                            />
                          </div>
                          {planDays.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeDayFromPlan(dIdx)}
                              className="p-1 hover:text-rose-600 text-slate-400 transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                      {/* Exercises listing in day */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 px-1">
                          <span className="col-span-4">动作名称 *</span>
                          <span className="col-span-2">组数</span>
                          <span className="col-span-2">每组次数</span>
                          <span className="col-span-2">推荐负重</span>
                          <span className="col-span-2 text-right">操作</span>
                        </div>

                        {day.exercises.map((ex, eIdx) => (
                          <div key={eIdx} className="grid grid-cols-12 gap-2 items-center">
                            <input
                              type="text"
                              value={ex.name}
                              onChange={(e) => updateExerciseField(dIdx, eIdx, 'name', e.target.value)}
                              placeholder="例如：杠铃深蹲"
                              className="col-span-4 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                              required
                            />
                            <input
                              type="number"
                              min={1}
                              value={ex.sets}
                              onChange={(e) => updateExerciseField(dIdx, eIdx, 'sets', parseInt(e.target.value) || 1)}
                              className="col-span-2 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono"
                            />
                            <input
                              type="text"
                              value={ex.reps}
                              onChange={(e) => updateExerciseField(dIdx, eIdx, 'reps', e.target.value)}
                              className="col-span-2 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono"
                            />
                            <input
                              type="text"
                              value={ex.weight}
                              onChange={(e) => updateExerciseField(dIdx, eIdx, 'weight', e.target.value)}
                              placeholder="20kg"
                              className="col-span-2 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono"
                            />
                            <div className="col-span-2 text-right">
                              <button
                                type="button"
                                onClick={() => removeExerciseFromDay(dIdx, eIdx)}
                                className="p-1 hover:text-rose-600 text-slate-400 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Optional note line */}
                            <input
                              type="text"
                              value={ex.note || ''}
                              onChange={(e) => updateExerciseField(dIdx, eIdx, 'note', e.target.value)}
                              placeholder="备注提示（如：臀部向后折髋，膝盖不内扣）"
                              className="col-span-12 bg-slate-100/50 border border-slate-100 rounded-lg px-2.5 py-1 text-[11px] text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 italic font-medium"
                            />
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => addExerciseToDay(dIdx)}
                          className="text-[11px] text-indigo-600 hover:text-indigo-500 flex items-center gap-0.5 font-bold cursor-pointer mt-1 transition-colors"
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                          添加训练动作
                        </button>
                      </div>
                    </div>
                  );})}

                  <button
                    type="button"
                    onClick={addDayToPlan}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-bold rounded-xl text-center flex items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    增加计划板块/训练日
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-150 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBuildingPlan(false)}
                    className="py-2 px-4 border border-slate-25 bg-white border-slate-200 hover:bg-slate-50 text-slate-550 hover:text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    放弃取消
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    保存并激活计划
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 2. CLASS HISTORY LOGS */}
        {subTab === 'logs' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">
              课时扣除消课明细 ({memberClassLogs.length} 节)
            </h3>

            {memberClassLogs.length > 0 ? (
              <div className="space-y-3">
                {memberClassLogs.map((log) => (
                  <div key={log.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-sm">
                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <span className="font-extrabold text-slate-800">执教教练：{log.coach}教练</span>
                      </div>
                      <div className="text-right">
                        <span className="text-rose-600 font-extrabold font-mono text-sm">-{log.sessionCount} 节</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-mono font-medium">{log.date}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium whitespace-pre-wrap leading-relaxed">
                      {log.content || '未填写上课备注'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white border border-slate-200 shadow-sm rounded-2xl text-slate-400 text-xs font-medium">
                暂无上课消课记录
              </div>
            )}
          </div>
        )}

        {/* 3. COURSE PACKS AND BILLS */}
        {subTab === 'packs' && (
          <div className="space-y-6">
            {/* Active Packs */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">持有中的课程包</h4>
              {memberPacks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {memberPacks.map((pack) => {
                    const cleanPackName = pack.name.includes('私教课') ? pack.name : `私教课 ${pack.totalSessions}节`;
                    const purchasedSessions = getPurchasedSessions(pack);
                    const giftedSessions = getGiftedSessions(pack);
                    const remainingPurchased = getRemainingPurchasedSessions(pack);
                    const remainingGifted = getRemainingGiftedSessions(pack);
                    return (
                      <div key={pack.id} className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between shadow-sm">
                        <div>
                          <div className="flex justify-between items-start">
                            <h5 className="text-xs font-bold text-slate-800 leading-snug">{cleanPackName}</h5>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              pack.status === 'active' 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                : 'bg-slate-100 text-slate-500 border border-slate-250'
                            }`}>
                              {pack.status === 'active' ? '正常在读' : '已结课/终止'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 font-mono font-medium">建包日期: {pack.purchaseDate}</p>
                          
                          {/* Family sharing tags */}
                          {pack.memberIds.length > 1 && (
                            <div className="mt-2.5 flex flex-wrap gap-1 items-center">
                              <span className="text-[9px] text-slate-400 bg-slate-50 px-1 rounded">家庭共享学员:</span>
                              {pack.memberIds.map(mid => {
                                const mName = state.members.find(m => m.id === mid)?.name || '未知学员';
                                return (
                                  <span key={mid} className="text-[9px] bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200/60 text-slate-700 font-bold">
                                    {mName}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-end font-mono">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold">应收金额</span>
                            <span className="text-xs font-bold text-slate-700">{formatCurrency(pack.price)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 block font-semibold">剩余课时</span>
                            <span className="text-sm font-extrabold text-emerald-600">{pack.remainingSessions} / {pack.totalSessions} 节</span>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg bg-slate-50 px-3 py-2 text-slate-600">
                            已购 <strong className="text-slate-900">{remainingPurchased} / {purchasedSessions}</strong> 节
                          </div>
                          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
                            赠送 <strong>{remainingGifted} / {giftedSessions}</strong> 节
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-white border border-slate-200 rounded-xl text-slate-400 text-xs font-medium shadow-sm">
                  暂无持有的课程
                </div>
              )}
            </div>

            {/* Financial Payment logs */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">缴费账单记录</h4>
              {memberPayments.length > 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 p-3 bg-slate-50/60 border-b border-slate-100">
                    <span className="col-span-3">买课日期</span>
                    <span className="col-span-4">购买内容</span>
                    <span className="col-span-2">渠道</span>
                    <span className="col-span-3 text-right">应收 / 实收</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {memberPayments.map((pay) => {
                      const cleanPayPackName = pay.coursePackName.includes('私教课') ? pay.coursePackName : `私教课`;
                      return (
                        <div key={pay.id} className="grid grid-cols-12 gap-2 text-xs p-3 text-slate-600 items-center font-mono">
                          <span className="col-span-3 text-[11px] text-slate-400 font-semibold">{pay.payDate}</span>
                          <span className="col-span-4 font-sans text-slate-800 line-clamp-1 font-bold">{cleanPayPackName}</span>
                          <span className="col-span-2 text-slate-500 font-sans font-semibold">
                            {pay.paymentMethod === 'wechat' ? '微信' : pay.paymentMethod === 'alipay' ? '支付宝' : pay.paymentMethod === 'bank' ? '银行卡' : '现金'}
                          </span>
                          <span className="col-span-3 text-right font-bold">
                            <span className="text-slate-500">{formatCurrency(pay.receivableAmount ?? pay.amount)}</span>
                            <span className="mx-1 text-slate-300">/</span>
                            <span className="text-emerald-600">{formatCurrency(pay.amount)}</span>
                          </span>
                          {pay.note && (
                            <span className="col-span-12 text-[10px] text-slate-400 font-sans italic mt-1 pl-1 font-medium">
                              备注: {pay.note}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-white border border-slate-200 rounded-xl text-slate-400 text-xs font-medium shadow-sm">
                  暂无付款对账单
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. EDIT PROFILE TAB */}
        {subTab === 'profile' && (
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 max-w-xl shadow-sm">
            <h3 className="text-sm font-bold text-slate-850 mb-2">更新学员基本资料</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1.5">学员姓名 *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1.5">手机号码 *</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-650 mb-1.5">学员性别</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEditGender('female')}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    editGender === 'female'
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-xs'
                  }`}
                >
                  女性
                </button>
                <button
                  type="button"
                  onClick={() => setEditGender('male')}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    editGender === 'male'
                      ? 'bg-blue-50 border-blue-200 text-blue-600'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-xs'
                  }`}
                >
                  男性
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-650 mb-1.5">备注</label>
              <textarea
                rows={4}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditName(member.name);
                  setEditPhone(member.phone);
                  setEditGender(member.gender);
                  setEditNote(member.note);
                  alert('已重置！');
                }}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                取消重置
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Check className="h-4 w-4 stroke-[2.5]" />
                保存学员基本资料
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
