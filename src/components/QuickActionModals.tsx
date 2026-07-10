import React, { useState, useEffect } from 'react';
import { X, Check, DollarSign, Dumbbell, UserPlus, Info } from 'lucide-react';
import { GymState, Member, CoursePack, ClassLog, PaymentLog, Coach } from '../types';
import { formatLocalDate, formatLocalDateTime, generateId } from '../utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GymState;
  onUpdateState: (newState: GymState) => void;
  currentCoach?: Coach;
  initialMemberId?: string;
}

// 1. Log Class Modal (消课登记)
export function LogClassModal({
  isOpen,
  onClose,
  state,
  onUpdateState,
  currentCoach,
  initialMemberId,
}: ModalProps) {
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
      setDateTime(formatLocalDateTime());
      setCoach(currentCoach || '力王');
      setDuration(60);
      setSessionCount(1);
      setError('');
      const targetMember = state.members.find((member) => member.id === initialMemberId);
      setSelectedMemberId(targetMember?.id || state.members[0]?.id || '');
    }
  }, [currentCoach, initialMemberId, isOpen, state.members]);

  const getTodayTrainingContent = (memberId: string): string => {
    if (!state.trainingPlans) return '';
    const activePlan = state.trainingPlans.find(p => p.memberId === memberId && p.isActive);
    if (!activePlan) return '';
    
    const todayStr = formatLocalDate();
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
    } else {
      setSelectedPackId('');
      setContent('');
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
  const selectedPack = availablePacks.find((pack) => pack.id === selectedPackId);

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-lg border border-slate-200 bg-white shadow-2xl sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">快速消课</h2>
              <p className="text-sm text-slate-500">选学员、记训练、保存</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="关闭快速消课"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 space-y-4 overflow-y-auto p-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700" htmlFor="log-class-member">
              学员
            </label>
            <select
              id="log-class-member"
              value={selectedMemberId}
              onChange={handleMemberChange}
              className="min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="" disabled>选择学员</option>
              {state.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} · 手机尾号 {member.phone.slice(-4)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700" htmlFor="log-class-pack">
              扣除课包
            </label>
            {availablePacks.length > 0 ? (
              <select
                id="log-class-pack"
                value={selectedPackId}
                onChange={(event) => setSelectedPackId(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                {availablePacks.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name} · 剩余 {pack.remainingSessions} 节
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>该学员没有可用课包，请先登记收款并开包。</span>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700" htmlFor="log-class-content">
              训练内容与表现
            </label>
            <textarea
              id="log-class-content"
              rows={5}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="例如：深蹲 60kg 4×10；最后一组稳定性下降，下次继续巩固。"
              className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <details className="rounded-lg border border-slate-200 bg-slate-50">
            <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-700">
              时间、教练与课时设置
            </summary>
            <div className="grid grid-cols-2 gap-3 border-t border-slate-200 p-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-sm font-semibold text-slate-600" htmlFor="log-class-time">上课时间</label>
                <input
                  id="log-class-time"
                  type="text"
                  value={dateTime}
                  onChange={(event) => setDateTime(event.target.value)}
                  className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-sm font-semibold text-slate-600" htmlFor="log-class-coach">执教教练</label>
                <select
                  id="log-class-coach"
                  value={coach}
                  onChange={(event) => setCoach(event.target.value as Coach)}
                  className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
                >
                  <option value="力王">力王</option>
                  <option value="花花">花花</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-600" htmlFor="log-class-count">扣除节数</label>
                <input
                  id="log-class-count"
                  type="number"
                  min={1}
                  max={10}
                  value={sessionCount}
                  onChange={(event) => setSessionCount(parseInt(event.target.value, 10) || 1)}
                  className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-600" htmlFor="log-class-duration">时长（分钟）</label>
                <input
                  id="log-class-duration"
                  type="number"
                  min={15}
                  step={15}
                  value={duration}
                  onChange={(event) => setDuration(parseInt(event.target.value, 10) || 60)}
                  className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </details>

          {selectedPack && (
            <div className={`rounded-lg border px-4 py-3 text-sm ${
              selectedPack.remainingSessions - sessionCount <= 5
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}>
              保存后扣除 <strong>{sessionCount} 节</strong>，课包剩余{' '}
              <strong>{Math.max(0, selectedPack.remainingSessions - sessionCount)} 节</strong>。
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 flex-1 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!selectedPackId}
              className={`inline-flex min-h-11 flex-[1.5] items-center justify-center gap-2 rounded-lg text-sm font-bold transition-colors ${
                selectedPackId
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400'
              }`}
            >
              <Check className="h-4 w-4" />
              确认消课
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
