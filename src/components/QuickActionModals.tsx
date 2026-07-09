import React, { useState, useEffect } from 'react';
import { X, Calendar, Plus, Check, DollarSign, Dumbbell, UserPlus, Info } from 'lucide-react';
import { GymState, Member, CoursePack, ClassLog, PaymentLog, Coach } from '../types';
import { generateId } from '../utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GymState;
  onUpdateState: (newState: GymState) => void;
  currentCoach?: Coach;
}

// 1. Log Class Modal (消课登记)
export function LogClassModal({ isOpen, onClose, state, onUpdateState, currentCoach }: ModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedPackId, setSelectedPackId] = useState('');
  const [coach, setCoach] = useState<Coach>(currentCoach || '力王');
  const [dateTime, setDateTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [content, setContent] = useState('');
  const [sessionCount, setSessionCount] = useState(1);
  const [error, setError] = useState('');

  // Auto-set date-time when opened
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const localString = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0');
      setDateTime(localString);
      setError('');
      // Auto-select first active member
      if (state.members.length > 0) {
        setSelectedMemberId(state.members[0].id);
      }
    }
  }, [isOpen, state.members]);

  const getTodayTrainingContent = (memberId: string): string => {
    if (!state.trainingPlans) return '';
    const activePlan = state.trainingPlans.find(p => p.memberId === memberId && p.isActive);
    if (!activePlan) return '';
    
    const todayStr = '2026-07-09';
    // Find a workout matching today's date
    let targetDay = activePlan.days.find(day => day.dayTitle.includes(todayStr));
    
    // Fallback to latest plan day if none matches today
    if (!targetDay && activePlan.days.length > 0) {
      targetDay = activePlan.days[activePlan.days.length - 1];
    }
    
    if (targetDay) {
      const idx = targetDay.dayTitle.indexOf(' | ');
      const title = idx !== -1 ? targetDay.dayTitle.substring(idx + 3) : targetDay.dayTitle;
      
      let text = `【授课计划：${title}】\n`;
      targetDay.exercises.forEach((ex, index) => {
        text += `${index + 1}. ${ex.name}: ${ex.sets}组 x ${ex.reps}次 (${ex.weight || '无'})\n`;
        if (ex.note) {
          text += `   提示: ${ex.note}\n`;
        }
      });
      return text;
    }
    return '';
  };

  // Update selected pack and autofill training plan whenever selected member changes
  useEffect(() => {
    if (selectedMemberId) {
      const memberPacks = state.coursePacks.filter(
        (p) => p.status === 'active' && p.remainingSessions > 0 && p.memberIds.includes(selectedMemberId)
      );
      if (memberPacks.length > 0) {
        setSelectedPackId(memberPacks[0].id);
        setError('');
      } else {
        setSelectedPackId('');
      }

      // Auto-fill training content with today's plan if available
      const planText = getTodayTrainingContent(selectedMemberId);
      if (planText) {
        setContent(planText);
      } else {
        setContent('');
      }
    }
  }, [selectedMemberId, state.coursePacks, state.trainingPlans]);

  if (!isOpen) return null;

  const handleMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMemberId(e.target.value);
  };

  const selectedMember = state.members.find((m) => m.id === selectedMemberId);
  const availablePacks = selectedMemberId
    ? state.coursePacks.filter((p) => p.status === 'active' && p.remainingSessions > 0 && p.memberIds.includes(selectedMemberId))
    : [];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setError('请选择学员');
      return;
    }
    if (!selectedPackId) {
      setError('该学员目前没有可用课包（请先办理新课包或充值）');
      return;
    }
    if (!content.trim()) {
      setError('请填写今日训练内容（如：深蹲 60kg 4x10 等）');
      return;
    }

    const pack = state.coursePacks.find((p) => p.id === selectedPackId);
    if (!pack || pack.remainingSessions < sessionCount) {
      setError('所选课包剩余课时不足！');
      return;
    }

    // Deduct course session
    const updatedPacks = state.coursePacks.map((p) => {
      if (p.id === selectedPackId) {
        const remaining = p.remainingSessions - sessionCount;
        return {
          ...p,
          remainingSessions: remaining,
          status: remaining <= 0 ? 'completed' as const : p.status,
        };
      }
      return p;
    });

    // Create log
    const newLog: ClassLog = {
      id: generateId('log'),
      memberId: selectedMemberId,
      memberName: selectedMember?.name || '',
      coach,
      coursePackId: selectedPackId,
      coursePackName: pack.name,
      date: dateTime,
      duration,
      content,
      sessionCount,
    };

    onUpdateState({
      ...state,
      coursePacks: updatedPacks,
      classLogs: [newLog, ...state.classLogs],
    });

    // Reset
    setContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-100">
              <Dumbbell className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-850">消课登记 • 快速记录</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs flex items-start gap-2 font-bold animate-shake">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-650 mb-1.5">选择学员</label>
              <select
                value={selectedMemberId}
                onChange={handleMemberChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm font-medium transition-all"
              >
                <option value="" disabled>-- 选择学员 --</option>
                {state.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.phone.slice(-4)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-650 mb-1.5">执教教练</label>
              <select
                value={coach}
                onChange={(e) => setCoach(e.target.value as Coach)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm font-medium transition-all"
              >
                <option value="力王">力王 (主教练)</option>
                <option value="花花">花花 (主教练)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-650 mb-1.5">选择消课包</label>
            {availablePacks.length > 0 ? (
              <select
                value={selectedPackId}
                onChange={(e) => setSelectedPackId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm font-medium transition-all"
              >
                {availablePacks.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (余 {p.remainingSessions} / {p.totalSessions} 节)
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl text-xs flex items-start gap-2 font-medium">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">该会员目前无可用课包！</span>
                  <p className="opacity-90 mt-1">请先去“收学费”办理一个包含此学员的课包。</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-650 mb-1.5">上课时间</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="YYYY-MM-DD HH:MM"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono text-sm font-medium transition-all"
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-650 mb-1.5">本次消课数 (节)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={sessionCount}
                onChange={(e) => setSessionCount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono text-sm font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-650 mb-1.5">今日训练内容与表现备注</label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="例如：
【腿臀塑形】
1. 负重深蹲: 15kg 4x12 (核心收紧较好)
2. 哑铃保加利亚蹲: 6kgx10 (会员左脚平衡需加强)
3. 绳索后蹬: 10kg 3x15"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm font-medium transition-all"
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>操作提示：保存后将自动扣除相应课时，并同步上课记录。</span>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-bold rounded-xl text-center cursor-pointer text-sm shadow-xs transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!selectedPackId}
              className={`flex-1 py-2.5 font-bold rounded-xl text-center flex items-center justify-center gap-1 cursor-pointer text-sm transition-all ${
                selectedPackId
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
              确认扣课并记录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 2. Add Member Modal (新增会员)
export function AddMemberModal({ isOpen, onClose, state, onUpdateState }: ModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('请输入会员姓名');
      return;
    }
    if (!phone.trim()) {
      setError('请输入会员电话');
      return;
    }

    const newMember: Member = {
      id: generateId('m'),
      name: name.trim(),
      phone: phone.trim(),
      gender,
      avatar: gender === 'male'
        ? 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
      joinDate: new Date().toISOString().split('T')[0],
      note: note.trim() || '新录入学员，暂无备注。',
      status: 'active',
    };

    onUpdateState({
      ...state,
      members: [...state.members, newMember],
    });

    // Reset
    setName('');
    setPhone('');
    setGender('female');
    setNote('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-100">
              <UserPlus className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-850">新增学员档案</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold animate-shake">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-650 mb-1.5">姓名 *</label>
            <input
              type="text"
              placeholder="例如：陈大雷"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm font-medium transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-650 mb-1.5">联系电话 *</label>
            <input
              type="tel"
              placeholder="13xxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono text-sm font-medium transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-650 mb-1.5">性别</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  gender === 'female'
                    ? 'bg-rose-50 border-rose-200 text-rose-600 font-bold'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-xs'
                }`}
              >
                女性
              </button>
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  gender === 'male'
                    ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-xs'
                }`}
              >
                男性
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-650 mb-1.5">基础体态评估及训练方向</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例：零基础，想要臀大肌塑形及纤细手臂；久坐有轻微骨盆前倾，上背有酸痛感。"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm font-medium transition-all"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-bold rounded-xl text-center cursor-pointer text-sm shadow-xs transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-center flex items-center justify-center gap-1 cursor-pointer text-sm shadow-sm transition-all"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
              建立学员档案
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 3. Log Payment Modal (收学费登记新课包)
export function LogPaymentModal({ isOpen, onClose, state, onUpdateState, currentCoach }: ModalProps) {
  const [packName, setPackName] = useState('私教课 20节');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [totalSessions, setTotalSessions] = useState(20);
  const [price, setPrice] = useState(8000);
  const [amount, setAmount] = useState(8000);
  const [payerName, setPayerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay' | 'cash' | 'bank'>('wechat');
  const [receiver, setReceiver] = useState<Coach>(currentCoach || '力王');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && state.members.length > 0) {
      setSelectedMemberIds([state.members[0].id]);
      setPayerName(state.members[0].name);
      setError('');
    }
  }, [isOpen, state.members]);

  if (!isOpen) return null;

  const toggleMemberSelection = (id: string) => {
    setSelectedMemberIds((prev) => {
      const next = prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id];
      // Automatically update payer to first selected member
      if (next.length > 0 && !next.includes(state.members.find(m => m.name === payerName)?.id || '')) {
        const firstMem = state.members.find(m => m.id === next[0]);
        if (firstMem) setPayerName(firstMem.name);
      }
      return next;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMemberIds.length === 0) {
      setError('必须至少绑定一个学员 (此课包可绑定多个家庭/伙伴学员共享扣课)');
      return;
    }
    if (!packName.trim()) {
      setError('请填写课包名称');
      return;
    }
    if (totalSessions <= 0) {
      setError('总课时数必须大于 0');
      return;
    }
    if (price <= 0) {
      setError('标价必须大于 0');
      return;
    }
    if (amount < 0) {
      setError('实收金额不能小于 0');
      return;
    }
    if (!payerName.trim()) {
      setError('请指定缴费付款人姓名');
      return;
    }

    const newPackId = generateId('p');
    
    // 1. Create course pack
    const newPack: CoursePack = {
      id: newPackId,
      name: packName.trim(),
      totalSessions,
      remainingSessions: totalSessions,
      price,
      purchaseDate: new Date().toISOString().split('T')[0],
      memberIds: selectedMemberIds,
      status: 'active',
    };

    // 2. Create Payment log
    const newPaymentLog: PaymentLog = {
      id: generateId('pay'),
      coursePackId: newPackId,
      coursePackName: packName.trim(),
      amount,
      payDate: new Date().toISOString().split('T')[0],
      payerName: payerName.trim(),
      paymentMethod,
      note: note.trim() || '全款购买课包，交易入账。',
      receiver,
    };

    onUpdateState({
      ...state,
      coursePacks: [...state.coursePacks, newPack],
      paymentLogs: [newPaymentLog, ...state.paymentLogs],
    });

    // Reset
    setPackName('私教课 20节');
    setTotalSessions(20);
    setPrice(8000);
    setAmount(8000);
    setNote('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-100">
              <DollarSign className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-850">开通课包 & 登记缴费</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold animate-shake">
              {error}
            </div>
          )}

          {/* Member Binder (Multi-select) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-650">
                绑定上课学员 (支持多选，全家多口人共享课时) *
              </label>
              <span className="text-[10px] text-slate-400 font-bold">点选以勾选/取消</span>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200/60 shadow-xs">
              {state.members.map((m) => {
                const isSelected = selectedMemberIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMemberSelection(m.id)}
                    className={`px-3 py-1.5 rounded-lg border text-left text-xs flex justify-between items-center transition-all cursor-pointer font-bold ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-xs'
                    }`}
                  >
                    <span>{m.name}</span>
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-650 mb-1.5">新课包名称 *</label>
            <input
              type="text"
              placeholder="例如：私教课 40节 (共享版)"
              value={packName}
              onChange={(e) => setPackName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm font-medium transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-650 mb-1.5">总课时 (节数) *</label>
              <input
                type="number"
                value={totalSessions}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setTotalSessions(val);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono text-sm font-medium transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-650 mb-1.5">课包官方标价 (元) *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setPrice(val);
                  setAmount(val); // default sync amount
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono text-sm font-medium transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-650 mb-1.5">实收缴费金额 (元) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono text-sm font-medium transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-650 mb-1.5">缴费付款人姓名 *</label>
              <input
                type="text"
                placeholder="例如：张大姐"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm font-medium transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-650 mb-1.5">交易支付渠道</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'wechat', name: '微信' },
                { key: 'alipay', name: '支付宝' },
                { key: 'bank', name: '银行卡' },
                { key: 'cash', name: '现金' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPaymentMethod(item.key as any)}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                    paymentMethod === item.key
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-xs'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-655 text-slate-600 mb-1.5">收款负责人 *</label>
              <select
                value={receiver}
                onChange={(e) => setReceiver(e.target.value as Coach)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-xs font-bold transition-all"
              >
                <option value="力王">力王 (主教练)</option>
                <option value="花花">花花 (主教练)</option>
              </select>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-bold mb-0.5">夫妻工作室对账对齐:</span>
              <span className="text-[10px] text-slate-400 leading-tight">登记后将记入对应合伙人的实收名下</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-650 mb-1.5">缴费备注 (如转账凭证、折扣原因等)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例：丈夫替其付，大额优惠 300 元。"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm font-medium transition-all"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-bold rounded-xl text-center cursor-pointer text-sm shadow-xs transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-center flex items-center justify-center gap-1 cursor-pointer text-sm shadow-sm transition-all"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
              开课并入账
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
