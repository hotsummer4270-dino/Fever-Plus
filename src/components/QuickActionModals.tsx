import React, { useState, useEffect } from 'react';
import { X, Check, DollarSign, Dumbbell, UserPlus, Info } from 'lucide-react';
import { GymState, Member, CoursePack, ClassLog, PaymentLog, Coach } from '../types';
import {
  deductSessionsFromPack,
  formatLocalDate,
  formatLocalDateTime,
  generateId,
} from '../utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GymState;
  onUpdateState: (newState: GymState) => void;
  currentCoach?: Coach;
  initialMemberId?: string;
  onCreateClass?: (input: Pick<ClassLog, 'memberId' | 'coursePackId' | 'coach' | 'date' | 'duration' | 'content' | 'sessionCount'>) => Promise<void>;
  onCreateMember?: (member: Member) => Promise<void>;
  onCreatePayment?: (input: {
    memberIds: string[]; purchasedSessions: number; giftedSessions: number; receivableAmount: number; actualAmount: number;
    differenceReason: string; payerName: string; paymentMethod: PaymentLog['paymentMethod']; receiver: Coach; note: string; purchaseDate: string; packName: string;
  }) => Promise<void>;
}

// 1. Log Class Modal (消课登记)
export function LogClassModal({
  isOpen,
  onClose,
  state,
  onUpdateState,
  currentCoach,
  initialMemberId,
  onCreateClass,
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
      setContent('');
      setError('');
      const targetMember = state.members.find((member) => member.id === initialMemberId);
      setSelectedMemberId(targetMember?.id || state.members[0]?.id || '');
    }
  }, [currentCoach, initialMemberId, isOpen, state.members]);

  // Select the first usable package when the member changes.
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

      setContent('');
    } else {
      setSelectedPackId('');
      setContent('');
    }
  }, [selectedMemberId, state.coursePacks]);

  if (!isOpen) return null;

  const handleMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMemberId(e.target.value);
  };

  const selectedMember = state.members.find((m) => m.id === selectedMemberId);
  const availablePacks = selectedMemberId
    ? state.coursePacks.filter((p) => p.status === 'active' && p.remainingSessions > 0 && p.memberIds.includes(selectedMemberId))
    : [];
  const selectedPack = availablePacks.find((pack) => pack.id === selectedPackId);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setError('请选择学员');
      return;
    }
    if (!selectedPackId) {
      setError('该学员目前没有可用课包（请先办理新课包或充值）');
      return;
    }
    const pack = state.coursePacks.find((p) => p.id === selectedPackId);
    if (!pack || pack.remainingSessions < sessionCount) {
      setError('所选课包剩余课时不足！');
      return;
    }

    if (onCreateClass) {
      try {
        await onCreateClass({ memberId: selectedMemberId, coursePackId: selectedPackId, coach, date: dateTime, duration, content: content.trim(), sessionCount });
        setContent('');
        onClose();
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : '消课保存失败，请稍后重试。');
      }
      return;
    }

    const deduction = deductSessionsFromPack(pack, sessionCount);
    const updatedPacks = state.coursePacks.map((p) => {
      if (p.id === selectedPackId) {
        return deduction.pack;
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
      content: content.trim(),
      sessionCount,
      deductedPurchasedSessions: deduction.deductedPurchasedSessions,
      deductedGiftedSessions: deduction.deductedGiftedSessions,
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
              <p className="text-sm text-slate-500">选学员，保存后扣除课时</p>
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
              上课备注 <span className="font-medium text-slate-400">（选填）</span>
            </label>
            <textarea
              id="log-class-content"
              rows={5}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="有需要再记，例如：今天练腿，下次注意膝盖稳定。"
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
export function AddMemberModal({ isOpen, onClose, state, onUpdateState, onCreateMember }: ModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
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
      joinDate: formatLocalDate(),
      note: note.trim(),
      status: 'active',
    };

    if (onCreateMember) {
      try {
        await onCreateMember(newMember);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : '学员创建失败，请稍后重试。');
        return;
      }
    } else onUpdateState({
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
            <label className="block text-xs font-bold text-slate-650 mb-1.5">备注（选填）</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="微信名、上课习惯或其他需要记住的事。"
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

// 3. Log Payment Modal (登记收款并创建课包)
export function LogPaymentModal({
  isOpen,
  onClose,
  state,
  onUpdateState,
  currentCoach,
  initialMemberId,
  onCreatePayment,
}: ModalProps) {
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [purchasedSessions, setPurchasedSessions] = useState(20);
  const [giftedSessions, setGiftedSessions] = useState(0);
  const [receivableAmount, setReceivableAmount] = useState(8000);
  const [actualAmount, setActualAmount] = useState(8000);
  const [differenceReason, setDifferenceReason] = useState('');
  const [customPackName, setCustomPackName] = useState('');
  const [payerName, setPayerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay' | 'cash' | 'bank'>('wechat');
  const [receiver, setReceiver] = useState<Coach>(currentCoach || '力王');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const targetMember = state.members.find((member) => member.id === initialMemberId) || state.members[0];
    setSelectedMemberIds(targetMember ? [targetMember.id] : []);
    setPayerName(targetMember?.name || '');
    setPurchasedSessions(20);
    setGiftedSessions(0);
    setReceivableAmount(8000);
    setActualAmount(8000);
    setDifferenceReason('');
    setCustomPackName('');
    setPaymentMethod('wechat');
    setReceiver(currentCoach || '力王');
    setNote('');
    setError('');
  }, [currentCoach, initialMemberId, isOpen, state.members]);

  if (!isOpen) return null;

  const totalSessions = purchasedSessions + giftedSessions;
  const generatedPackName = `私教课 ${totalSessions}节`;
  const finalPackName = customPackName.trim() || generatedPackName;
  const amountDifference = receivableAmount - actualAmount;

  const toggleMemberSelection = (id: string) => {
    setSelectedMemberIds((current) => {
      const next = current.includes(id) ? current.filter((memberId) => memberId !== id) : [...current, id];
      const currentPayer = state.members.find((member) => member.name === payerName);
      if (!currentPayer || !next.includes(currentPayer.id)) {
        setPayerName(state.members.find((member) => member.id === next[0])?.name || '');
      }
      return next;
    });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedMemberIds.length === 0) {
      setError('请至少选择一位使用课包的学员。');
      return;
    }
    if (purchasedSessions <= 0) {
      setError('已购课时必须大于 0。');
      return;
    }
    if (giftedSessions < 0) {
      setError('赠送课时不能小于 0。');
      return;
    }
    if (receivableAmount <= 0 || actualAmount < 0) {
      setError('请检查应收和实收金额。');
      return;
    }
    if (amountDifference !== 0 && !differenceReason.trim()) {
      setError('应收与实收不一致时，请写明差额原因。');
      return;
    }
    if (!payerName.trim()) {
      setError('请填写付款人。');
      return;
    }

    if (onCreatePayment) {
      try {
        await onCreatePayment({
          memberIds: selectedMemberIds, purchasedSessions, giftedSessions, receivableAmount, actualAmount,
          differenceReason, payerName: payerName.trim(), paymentMethod, receiver, note: note.trim(),
          purchaseDate: formatLocalDate(), packName: finalPackName,
        });
        onClose();
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : '收款保存失败，请稍后重试。');
      }
      return;
    }

    const newPackId = generateId('p');
    const today = formatLocalDate();
    const newPack: CoursePack = {
      id: newPackId,
      name: finalPackName,
      totalSessions,
      remainingSessions: totalSessions,
      purchasedSessions,
      giftedSessions,
      remainingPurchasedSessions: purchasedSessions,
      remainingGiftedSessions: giftedSessions,
      price: receivableAmount,
      purchaseDate: today,
      expiresAt: null,
      memberIds: selectedMemberIds,
      status: 'active',
    };

    const newPaymentLog: PaymentLog = {
      id: generateId('pay'),
      coursePackId: newPackId,
      coursePackName: finalPackName,
      amount: actualAmount,
      receivableAmount,
      discountAmount: Math.max(0, amountDifference),
      discountReason: amountDifference === 0 ? '' : differenceReason.trim(),
      payDate: today,
      payerName: payerName.trim(),
      paymentMethod,
      note: note.trim(),
      receiver,
    };

    onUpdateState({
      ...state,
      coursePacks: [...state.coursePacks, newPack],
      paymentLogs: [newPaymentLog, ...state.paymentLogs],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[94vh] w-full max-w-xl flex-col overflow-hidden rounded-t-lg border border-slate-200 bg-white shadow-2xl sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">记收款并开课包</h2>
              <p className="text-sm text-slate-500">微信到账后，顺手把课时记清楚</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="关闭收款登记"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 space-y-5 overflow-y-auto p-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <fieldset>
            <legend className="mb-2 text-sm font-bold text-slate-700">
              谁可以用这个课包 <span className="font-medium text-slate-400">（可多选共享）</span>
            </legend>
            <div className="grid max-h-36 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 sm:grid-cols-3">
              {state.members.map((member) => {
                const selected = selectedMemberIds.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleMemberSelection(member.id)}
                    className={`flex min-h-10 items-center justify-between rounded-md border px-3 text-sm font-bold ${
                      selected
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                    aria-pressed={selected}
                  >
                    <span className="truncate">{member.name}</span>
                    {selected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700" htmlFor="payment-purchased">已购课时</label>
              <input
                id="payment-purchased"
                type="number"
                min={1}
                value={purchasedSessions}
                onChange={(event) => setPurchasedSessions(parseInt(event.target.value, 10) || 0)}
                className="min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700" htmlFor="payment-gifted">赠送课时</label>
              <input
                id="payment-gifted"
                type="number"
                min={0}
                value={giftedSessions}
                onChange={(event) => setGiftedSessions(parseInt(event.target.value, 10) || 0)}
                className="min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700" htmlFor="payment-receivable">应收金额</label>
              <input
                id="payment-receivable"
                type="number"
                min={0}
                value={receivableAmount}
                onChange={(event) => setReceivableAmount(Number(event.target.value) || 0)}
                className="min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700" htmlFor="payment-actual">实收金额</label>
              <input
                id="payment-actual"
                type="number"
                min={0}
                value={actualAmount}
                onChange={(event) => setActualAmount(Number(event.target.value) || 0)}
                className="min-h-11 w-full rounded-lg border border-emerald-300 bg-emerald-50 px-3 text-sm font-bold text-emerald-900 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {amountDifference !== 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <label className="mb-1.5 block text-sm font-bold text-amber-900" htmlFor="payment-difference-reason">
                {amountDifference > 0 ? `少收 ${amountDifference} 元，原因` : `多收 ${Math.abs(amountDifference)} 元，原因`}
              </label>
              <input
                id="payment-difference-reason"
                type="text"
                value={differenceReason}
                onChange={(event) => setDifferenceReason(event.target.value)}
                placeholder="例如：老学员优惠"
                className="min-h-10 w-full rounded-lg border border-amber-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-amber-500"
              />
            </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            将创建 <strong className="text-slate-900">{finalPackName}</strong>，共{' '}
            <strong className="text-slate-900">{totalSessions} 节</strong>，默认无限期。
          </div>

          <details className="rounded-lg border border-slate-200 bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-700">付款人与其他信息</summary>
            <div className="space-y-4 border-t border-slate-200 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-600" htmlFor="payment-payer">付款人</label>
                  <input
                    id="payment-payer"
                    type="text"
                    value={payerName}
                    onChange={(event) => setPayerName(event.target.value)}
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-600" htmlFor="payment-receiver">登记人</label>
                  <select
                    id="payment-receiver"
                    value={receiver}
                    onChange={(event) => setReceiver(event.target.value as Coach)}
                    className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  >
                    <option value="力王">力王</option>
                    <option value="花花">花花</option>
                  </select>
                </div>
              </div>

              <div>
                <span className="mb-1.5 block text-sm font-semibold text-slate-600">付款方式</span>
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
                      onClick={() => setPaymentMethod(item.key as typeof paymentMethod)}
                      className={`min-h-9 rounded-md border text-xs font-bold ${
                        paymentMethod === item.key
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-600" htmlFor="payment-pack-name">课包名称（选填）</label>
                <input
                  id="payment-pack-name"
                  type="text"
                  value={customPackName}
                  onChange={(event) => setCustomPackName(event.target.value)}
                  placeholder={generatedPackName}
                  className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-600" htmlFor="payment-note">备注（选填）</label>
                <input
                  id="payment-note"
                  type="text"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="例如：家属代付"
                  className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </details>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 flex-1 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="inline-flex min-h-11 flex-[1.5] items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700"
            >
              <Check className="h-4 w-4" />
              保存收款与课包
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
