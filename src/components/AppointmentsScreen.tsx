import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus, Search, UserRound, X } from 'lucide-react';
import type { Appointment, Coach, GymState } from '../types';
import { formatLocalDate, generateId } from '../utils';

interface AppointmentsScreenProps {
  state: GymState;
  currentCoach: Coach;
  onUpdateState: (state: GymState) => void;
  onCreateAppointment?: (appointment: { memberId: string; coach: Coach; startAt: string; duration: number; note: string }) => Promise<void>;
  onCancelAppointment?: (appointmentId: string) => Promise<void>;
}

type ViewMode = 'day' | 'week';
type CoachFilter = 'all' | Coach;

const DAY_START_HOUR = 9;
const DAY_END_HOUR = 21;
const HOUR_HEIGHT = 64;
const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function asLocalDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`);
}

function addDays(date: Date, offset: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
}

function mondayOf(date: Date) {
  const weekday = date.getDay() || 7;
  return addDays(date, 1 - weekday);
}

function localDateTime(date: string, hour: number) {
  return `${date}T${String(hour).padStart(2, '0')}:00`;
}

function minutesSinceDayStart(startAt: string) {
  const date = new Date(startAt.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, (date.getHours() - DAY_START_HOUR) * 60 + date.getMinutes());
}

function timeLabel(startAt: string) {
  const date = new Date(startAt.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return startAt;
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function dateLabel(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function isSameAppointmentDay(appointment: Appointment, day: Date) {
  return appointment.startAt.slice(0, 10) === formatLocalDate(day);
}

export default function AppointmentsScreen({ state, currentCoach, onUpdateState, onCreateAppointment, onCancelAppointment }: AppointmentsScreenProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(formatLocalDate());
  const [coachFilter, setCoachFilter] = useState<CoachFilter>(currentCoach);
  const [isCreating, setIsCreating] = useState(false);
  const [memberId, setMemberId] = useState(state.members[0]?.id ?? '');
  const [memberQuery, setMemberQuery] = useState('');
  const [coach, setCoach] = useState<Coach>(currentCoach);
  const [startAt, setStartAt] = useState(`${formatLocalDate()}T10:00`);
  const [duration, setDuration] = useState(60);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const confirmedAppointments = useMemo(
    () => state.appointments.filter((appointment) => appointment.status === 'confirmed').sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [state.appointments],
  );
  const selectedDay = asLocalDate(selectedDate);
  const days = useMemo(() => {
    if (viewMode === 'day') return [selectedDay];
    const monday = mondayOf(selectedDay);
    return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  }, [selectedDate, viewMode]);
  const filteredMembers = useMemo(() => {
    const keyword = memberQuery.trim().toLowerCase();
    return state.members.filter((member) => member.status === 'active' && (!keyword || member.name.toLowerCase().includes(keyword) || member.phone.includes(keyword)));
  }, [memberQuery, state.members]);
  const cancelledCount = state.appointments.filter((appointment) => appointment.status === 'cancelled').length;
  const visibleAppointments = confirmedAppointments.filter((appointment) => (
    days.some((day) => isSameAppointmentDay(appointment, day))
    && (coachFilter === 'all' || appointment.coach === coachFilter)
  ));

  const openCreate = (presetStartAt?: string) => {
    if (!state.members.some((member) => member.status === 'active')) {
      window.alert('请先新增一位在馆学员，再安排预约。');
      return;
    }
    setMemberId(state.members.find((member) => member.status === 'active')?.id ?? '');
    setMemberQuery('');
    setCoach(coachFilter === 'all' ? currentCoach : coachFilter);
    setStartAt(presetStartAt ?? `${selectedDate}T10:00`);
    setDuration(60);
    setNote('');
    setError('');
    setIsCreating(true);
  };

  const hasConflict = () => {
    const newStart = new Date(startAt.replace(' ', 'T')).getTime();
    const newEnd = newStart + duration * 60_000;
    return state.appointments.some((appointment) => {
      if (appointment.status !== 'confirmed' || appointment.coach !== coach) return false;
      const existingStart = new Date(appointment.startAt.replace(' ', 'T')).getTime();
      const existingEnd = existingStart + appointment.duration * 60_000;
      return Number.isFinite(existingStart) && newStart < existingEnd && existingStart < newEnd;
    });
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!memberId || !startAt) {
      setError('请选择学员和预约时间。');
      return;
    }
    if (hasConflict()) {
      setError(`${coach}在这个时段已经有预约，请换一个时间。`);
      return;
    }
    const input = { memberId, coach, startAt, duration, note: note.trim() };
    try {
      if (onCreateAppointment) await onCreateAppointment(input);
      else {
        const member = state.members.find((item) => item.id === memberId);
        if (!member) throw new Error('学员不存在。');
        const next: Appointment = {
          id: generateId('appt'), memberId, memberName: member.name, coach, startAt, duration, note: input.note, status: 'confirmed',
        };
        onUpdateState({ ...state, appointments: [...state.appointments, next] });
      }
      setSelectedDate(startAt.slice(0, 10));
      setIsCreating(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '预约保存失败，请稍后重试。');
    }
  };

  const cancel = async (appointmentId: string) => {
    if (!window.confirm('确认取消这条预约？不会自动恢复或扣除课时。')) return;
    try {
      if (onCancelAppointment) await onCancelAppointment(appointmentId);
      else onUpdateState({ ...state, appointments: state.appointments.map((item) => item.id === appointmentId ? { ...item, status: 'cancelled' } : item) });
    } catch (requestError) {
      window.alert(requestError instanceof Error ? requestError.message : '取消预约失败，请稍后重试。');
    }
  };

  const moveDate = (direction: -1 | 1) => {
    const offset = viewMode === 'week' ? direction * 7 : direction;
    setSelectedDate(formatLocalDate(addDays(selectedDay, offset)));
  };

  const timelineHeight = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT;
  const title = viewMode === 'week'
    ? `${dateLabel(days[0])} - ${dateLabel(days[days.length - 1])}`
    : `${dateLabel(days[0])} ${weekdays[days[0].getDay()]}`;

  return (
    <div className="space-y-5" id="appointments-screen">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">预约排课</h2>
          <p className="mt-1 text-sm text-slate-500">点排课表空白时段即可约课。预约只占用教练时间，上完课后再单独登记消课。</p>
        </div>
        <button onClick={() => openCreate()} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> 新建预约
        </button>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-1">
            <button onClick={() => moveDate(-1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="查看上一段时间"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setSelectedDate(formatLocalDate())} className="min-h-9 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-600 hover:bg-slate-50">今天</button>
            <button onClick={() => moveDate(1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="查看下一段时间"><ChevronRight className="h-4 w-4" /></button>
            <span className="ml-2 text-sm font-bold text-slate-900">{title}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
              {(['day', 'week'] as ViewMode[]).map((mode) => <button key={mode} onClick={() => setViewMode(mode)} className={`min-h-8 rounded-md px-3 text-xs font-bold ${viewMode === mode ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{mode === 'day' ? '日' : '周'}</button>)}
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
              {(['all', '力王', '花花'] as CoachFilter[]).map((item) => <button key={item} onClick={() => setCoachFilter(item)} className={`min-h-8 rounded-md px-3 text-xs font-bold ${coachFilter === item ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{item === 'all' ? '全部教练' : item}</button>)}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid border-b border-slate-200 bg-slate-50" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(104px, 1fr))` }}>
              <div />
              {days.map((day) => {
                const isToday = formatLocalDate(day) === formatLocalDate();
                return <button key={formatLocalDate(day)} onClick={() => { setSelectedDate(formatLocalDate(day)); setViewMode('day'); }} className={`min-h-14 border-l border-slate-200 px-2 text-center text-sm font-bold ${isToday ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'}`}><span className="block text-xs font-medium text-slate-400">{weekdays[day.getDay()]}</span>{day.getDate()}</button>;
              })}
            </div>
            <div className="grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(104px, 1fr))` }}>
              <div className="relative border-r border-slate-200" style={{ height: `${timelineHeight}px` }}>
                {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, index) => <span key={index} className="absolute -top-2 right-2 text-xs font-medium text-slate-400" style={{ top: `${index * HOUR_HEIGHT}px` }}>{String(DAY_START_HOUR + index).padStart(2, '0')}:00</span>)}
              </div>
              {days.map((day) => {
                const dayAppointments = visibleAppointments.filter((appointment) => isSameAppointmentDay(appointment, day));
                return (
                  <div key={formatLocalDate(day)} className="relative border-r border-slate-200" style={{ height: `${timelineHeight}px` }}>
                    {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, index) => {
                      const hour = DAY_START_HOUR + index;
                      return <button key={hour} onClick={() => openCreate(localDateTime(formatLocalDate(day), hour))} className="absolute left-0 w-full border-b border-slate-100 text-left hover:bg-indigo-50/70" style={{ top: `${index * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }} aria-label={`在${dateLabel(day)} ${hour}:00新建预约`} />;
                    })}
                    {dayAppointments.map((appointment) => {
                      const lane = coachFilter === 'all' ? (appointment.coach === '力王' ? 0 : 1) : 0;
                      const top = Math.min(timelineHeight - 32, minutesSinceDayStart(appointment.startAt) * (HOUR_HEIGHT / 60));
                      const height = Math.max(36, Math.min(appointment.duration * (HOUR_HEIGHT / 60), timelineHeight - top));
                      const isLiWang = appointment.coach === '力王';
                      return (
                        <div key={appointment.id} title={`${appointment.memberName} · ${appointment.coach} · ${timeLabel(appointment.startAt)}`} className={`absolute z-10 overflow-hidden rounded-md border px-2 py-1.5 text-left shadow-sm ${isLiWang ? 'border-indigo-200 bg-indigo-100 text-indigo-950' : 'border-fuchsia-200 bg-fuchsia-100 text-fuchsia-950'}`} style={{ top: `${top}px`, height: `${height}px`, left: coachFilter === 'all' ? `calc(${lane * 50}% + 3px)` : '3px', width: coachFilter === 'all' ? 'calc(50% - 6px)' : 'calc(100% - 6px)' }}>
                          <p className="truncate text-xs font-black">{appointment.memberName}</p>
                          {height >= 50 && <p className="truncate text-[11px] font-medium opacity-75">{timeLabel(appointment.startAt)} · {appointment.coach}</p>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div className="flex items-center gap-2 text-sm font-bold text-slate-800"><CalendarDays className="h-4 w-4 text-indigo-600" />当前排课</div><span className="text-xs font-semibold text-slate-400">{visibleAppointments.length} 条</span></div>
        {visibleAppointments.length === 0 ? <p className="p-8 text-center text-sm text-slate-400">这一段时间还没有预约，点排课表空白处即可新增。</p> : <div className="divide-y divide-slate-100">{visibleAppointments.map((appointment) => <div key={appointment.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900"><UserRound className="h-4 w-4 text-slate-400" />{appointment.memberName}<span className={`rounded-md px-2 py-0.5 text-xs ${appointment.coach === '力王' ? 'bg-indigo-50 text-indigo-700' : 'bg-fuchsia-50 text-fuchsia-700'}`}>{appointment.coach}</span></div><div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500"><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{appointment.startAt.slice(0, 10)} {timeLabel(appointment.startAt)} · {appointment.duration} 分钟</span>{appointment.note && <span>{appointment.note}</span>}</div></div><button onClick={() => cancel(appointment.id)} className="min-h-9 self-start rounded-lg border border-rose-100 bg-rose-50 px-3 text-xs font-bold text-rose-600 hover:bg-rose-100 sm:self-auto">取消预约</button></div>)}</div>}
        {cancelledCount > 0 && <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">历史中有 {cancelledCount} 条已取消预约。</p>}
      </section>

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <form onSubmit={create} className="w-full max-w-lg space-y-4 rounded-t-lg border border-slate-200 bg-white p-5 shadow-2xl sm:rounded-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4"><div><h3 className="text-lg font-bold text-slate-900">新建预约</h3><p className="mt-1 text-xs text-slate-500">预约不会自动消课。</p></div><button type="button" onClick={() => setIsCreating(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="关闭"><X className="h-5 w-5" /></button></div>
            {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
            <label className="block text-sm font-bold text-slate-700">查找学员<div className="relative mt-1.5"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} placeholder="输入姓名或手机号" className="min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm font-medium" /></div></label>
            <label className="block text-sm font-bold text-slate-700">学员<select value={memberId} onChange={(event) => setMemberId(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium"><option value="">选择学员</option>{filteredMembers.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.phone.slice(-4)}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-3"><label className="text-sm font-bold text-slate-700">教练<select value={coach} onChange={(event) => setCoach(event.target.value as Coach)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium"><option value="力王">力王</option><option value="花花">花花</option></select></label><label className="text-sm font-bold text-slate-700">时长（分钟）<input type="number" min={15} max={360} step={15} value={duration} onChange={(event) => setDuration(Number(event.target.value) || 60)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium" /></label></div>
            <label className="block text-sm font-bold text-slate-700">预约时间<input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium" /></label>
            <label className="block text-sm font-bold text-slate-700">备注 <span className="font-medium text-slate-400">（选填）</span><textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="例如：约好练肩背。" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
            <button type="submit" className="min-h-11 w-full rounded-lg bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700">确认预约</button>
          </form>
        </div>
      )}
    </div>
  );
}
