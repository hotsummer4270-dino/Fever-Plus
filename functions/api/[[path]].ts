import { apiError, json } from '../lib/http';
import { amountToCents, dbIsEmpty, getGymState, importGymState } from '../lib/state';
import type { Env, RequestData } from '../lib/types';

type Context = EventContext<Env, string, RequestData>;
type Body = Record<string, unknown>;
const coaches = new Set(['力王', '花花']);
const paymentMethods = new Set(['wechat', 'alipay', 'cash', 'bank']);
const packStatuses = new Set(['active', 'completed', 'frozen', 'refunded']);

const text = (value: unknown, label: string, max = 500) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label}不能为空。`);
  const result = value.trim();
  if (result.length > max) throw new Error(`${label}过长。`);
  return result;
};
const optionalText = (value: unknown, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const integer = (value: unknown, label: string, min = 0, max = 100000) => {
  const result = Number(value);
  if (!Number.isInteger(result) || result < min || result > max) throw new Error(`${label}不正确。`);
  return result;
};
const amount = (value: unknown, label: string) => {
  const result = Number(value);
  if (!Number.isFinite(result) || result < 0 || result > 10_000_000) throw new Error(`${label}不正确。`);
  return result;
};
const id = () => crypto.randomUUID();

async function body(request: Request): Promise<Body> {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > 1_000_000) throw new Error('请求内容过大。');
  const parsed = await request.json();
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('请求格式不正确。');
  return parsed as Body;
}

async function stateResponse(context: Context, status = 200) {
  return json({ state: await getGymState(context.env.DB) }, { status });
}

function actor(context: Context) {
  if (!context.data.actorEmail) throw new Error('未能识别当前登录账号。');
  return context.data.actorEmail;
}

async function createMember(context: Context) {
  const input = await body(context.request);
  const gender = input.gender === 'male' || input.gender === 'female' ? input.gender : 'unknown';
  await context.env.DB.prepare('INSERT INTO members (id, name, phone, gender, avatar, join_date, note, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id(), text(input.name, '姓名', 100), text(input.phone, '联系电话', 50), gender, optionalText(input.avatar, 1000),
      text(input.joinDate, '建档日期', 30), optionalText(input.note, 2000), 'active').run();
  return stateResponse(context, 201);
}

async function updateMember(context: Context, memberId: string) {
  const input = await body(context.request);
  const existing = await context.env.DB.prepare('SELECT id FROM members WHERE id = ?').bind(memberId).first();
  if (!existing) return apiError(404, '学员不存在。');
  const gender = input.gender === 'male' || input.gender === 'female' ? input.gender : 'unknown';
  const status = input.status === 'inactive' ? 'inactive' : 'active';
  await context.env.DB.prepare("UPDATE members SET name = ?, phone = ?, gender = ?, note = ?, status = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(text(input.name, '姓名', 100), text(input.phone, '联系电话', 50), gender, optionalText(input.note, 2000), status, memberId).run();
  return stateResponse(context);
}

async function createPayment(context: Context) {
  const input = await body(context.request);
  const memberIds = Array.isArray(input.memberIds) ? [...new Set(input.memberIds.map((value) => String(value)))] : [];
  if (!memberIds.length) throw new Error('请至少选择一位使用课包的学员。');
  const purchased = integer(input.purchasedSessions, '已购课时', 1, 10000);
  const gifted = integer(input.giftedSessions ?? 0, '赠送课时', 0, 10000);
  const receivable = amount(input.receivableAmount, '应收金额');
  const actual = amount(input.actualAmount, '实收金额');
  const differenceReason = optionalText(input.differenceReason, 500);
  if (receivable !== actual && !differenceReason) throw new Error('应收与实收不一致时，请写明差额原因。');
  const method = text(input.paymentMethod, '付款方式', 20);
  if (!paymentMethods.has(method)) throw new Error('付款方式不正确。');
  const receiver = input.receiver === '花花' ? '花花' : '力王';
  const memberCount = await context.env.DB.prepare(`SELECT COUNT(*) AS count FROM members WHERE id IN (${memberIds.map(() => '?').join(',')})`).bind(...memberIds).first<{ count: number }>();
  if (Number(memberCount?.count ?? 0) !== memberIds.length) throw new Error('所选学员不存在。');
  const packId = id();
  const paymentId = id();
  const total = purchased + gifted;
  const packName = optionalText(input.packName, 100) || `私教课 ${total}节`;
  const purchaseDate = text(input.purchaseDate, '收款日期', 30);
  const statements: D1PreparedStatement[] = [
    context.env.DB.prepare('INSERT INTO course_packs (id, name, purchased_sessions, gifted_sessions, remaining_purchased_sessions, remaining_gifted_sessions, receivable_cents, purchase_date, expires_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)')
      .bind(packId, packName, purchased, gifted, purchased, gifted, amountToCents(receivable), purchaseDate, 'active'),
    ...memberIds.map((memberId) => context.env.DB.prepare('INSERT INTO course_pack_members (course_pack_id, member_id) VALUES (?, ?)').bind(packId, memberId)),
    context.env.DB.prepare('INSERT INTO payment_logs (id, course_pack_id, actual_cents, receivable_cents, discount_cents, discount_reason, pay_date, payer_name, payment_method, note, receiver, actor_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(paymentId, packId, amountToCents(actual), amountToCents(receivable), amountToCents(Math.max(0, receivable - actual)), differenceReason,
        purchaseDate, text(input.payerName, '付款人', 100), method, optionalText(input.note, 2000), receiver, actor(context)),
  ];
  await context.env.DB.batch(statements);
  return stateResponse(context, 201);
}

async function createClassLog(context: Context) {
  const input = await body(context.request);
  const memberId = text(input.memberId, '学员');
  const packId = text(input.coursePackId, '课包');
  const sessions = integer(input.sessionCount, '扣除节数', 1, 20);
  const pack = await context.env.DB.prepare('SELECT * FROM course_packs WHERE id = ?').bind(packId).first<Record<string, unknown>>();
  if (!pack || pack.status !== 'active') return apiError(409, '该课包当前不可消课。');
  const binding = await context.env.DB.prepare('SELECT 1 FROM course_pack_members WHERE course_pack_id = ? AND member_id = ?').bind(packId, memberId).first();
  if (!binding) return apiError(409, '该学员不能使用所选课包。');
  const remainingPurchased = Number(pack.remaining_purchased_sessions);
  const remainingGifted = Number(pack.remaining_gifted_sessions);
  if (remainingPurchased + remainingGifted < sessions) return apiError(409, '所选课包剩余课时不足。');
  const deductedPurchased = Math.min(remainingPurchased, sessions);
  const deductedGifted = sessions - deductedPurchased;
  const logId = id();
  const results = await context.env.DB.batch([
    context.env.DB.prepare("UPDATE course_packs SET remaining_purchased_sessions = ?, remaining_gifted_sessions = ?, revision = revision + 1, updated_at = datetime('now') WHERE id = ? AND revision = ? AND status = 'active' AND remaining_purchased_sessions + remaining_gifted_sessions >= ?")
      .bind(remainingPurchased - deductedPurchased, remainingGifted - deductedGifted, packId, Number(pack.revision), sessions),
    context.env.DB.prepare("INSERT INTO class_logs (id, member_id, coach, course_pack_id, class_date, duration_minutes, content, session_count, deducted_purchased_sessions, deducted_gifted_sessions, actor_email) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE changes() = 1")
      .bind(logId, memberId, input.coach === '花花' ? '花花' : '力王', packId, text(input.date, '上课时间', 40), integer(input.duration, '上课时长', 1, 600), optionalText(input.content, 4000), sessions, deductedPurchased, deductedGifted, actor(context)),
  ]);
  if (Number(results[0]?.meta.changes ?? 0) !== 1 || Number(results[1]?.meta.changes ?? 0) !== 1) return apiError(409, '课包刚刚被更新，请刷新后重试。');
  return stateResponse(context, 201);
}

async function undoClassLog(context: Context, logId: string) {
  const log = await context.env.DB.prepare('SELECT * FROM class_logs WHERE id = ?').bind(logId).first<Record<string, unknown>>();
  if (!log) return apiError(404, '消课记录不存在。');
  const pack = await context.env.DB.prepare('SELECT * FROM course_packs WHERE id = ?').bind(log.course_pack_id).first<Record<string, unknown>>();
  if (!pack) return apiError(409, '对应课包不存在，无法恢复课时。');
  const nextPurchased = Math.min(Number(pack.purchased_sessions), Number(pack.remaining_purchased_sessions) + Number(log.deducted_purchased_sessions));
  const nextGifted = Math.min(Number(pack.gifted_sessions), Number(pack.remaining_gifted_sessions) + Number(log.deducted_gifted_sessions));
  const results = await context.env.DB.batch([
    context.env.DB.prepare("UPDATE course_packs SET remaining_purchased_sessions = ?, remaining_gifted_sessions = ?, revision = revision + 1, updated_at = datetime('now') WHERE id = ? AND revision = ?")
      .bind(nextPurchased, nextGifted, pack.id, Number(pack.revision)),
    context.env.DB.prepare('DELETE FROM class_logs WHERE id = ? AND changes() = 1').bind(logId),
  ]);
  if (Number(results[0]?.meta.changes ?? 0) !== 1 || Number(results[1]?.meta.changes ?? 0) !== 1) return apiError(409, '记录刚刚被更新，请刷新后重试。');
  return stateResponse(context);
}

async function savePlan(context: Context) {
  const input = await body(context.request);
  const memberId = text(input.memberId, '学员');
  const days = input.days;
  if (!Array.isArray(days) || !days.length) throw new Error('训练计划至少需要一天内容。');
  const planId = id();
  const date = text(input.date, '计划日期', 30);
  await context.env.DB.batch([
    context.env.DB.prepare('UPDATE training_plans SET is_active = 0, updated_at = ? WHERE member_id = ?').bind(date, memberId),
    context.env.DB.prepare('INSERT INTO training_plans (id, member_id, title, days_json, is_active, created_at, updated_at, actor_email) VALUES (?, ?, ?, ?, 1, ?, ?, ?)')
      .bind(planId, memberId, text(input.title, '计划标题', 200), JSON.stringify(days), date, date, actor(context)),
  ]);
  return stateResponse(context, 201);
}

async function activatePlan(context: Context, planId: string) {
  const plan = await context.env.DB.prepare('SELECT member_id FROM training_plans WHERE id = ?').bind(planId).first<{ member_id: string }>();
  if (!plan) return apiError(404, '训练计划不存在。');
  await context.env.DB.batch([
    context.env.DB.prepare('UPDATE training_plans SET is_active = 0 WHERE member_id = ?').bind(plan.member_id),
    context.env.DB.prepare("UPDATE training_plans SET is_active = 1, updated_at = datetime('now') WHERE id = ?").bind(planId),
  ]);
  return stateResponse(context);
}

async function createAppointment(context: Context) {
  const input = await body(context.request);
  const memberId = text(input.memberId, '学员');
  const member = await context.env.DB.prepare('SELECT id FROM members WHERE id = ?').bind(memberId).first();
  if (!member) return apiError(404, '学员不存在。');
  const coach = input.coach === '花花' ? '花花' : '力王';
  const startAt = text(input.startAt, '预约时间', 40);
  const duration = integer(input.duration, '预约时长', 15, 360);
  const appointmentStart = new Date(startAt.replace(' ', 'T')).getTime();
  if (Number.isNaN(appointmentStart)) throw new Error('预约时间不正确。');
  const appointmentEnd = appointmentStart + duration * 60_000;
  const sameCoachAppointments = await context.env.DB.prepare("SELECT start_at, duration_minutes FROM appointments WHERE coach = ? AND status = 'confirmed'")
    .bind(coach).all<{ start_at: string; duration_minutes: number }>();
  const isConflict = (sameCoachAppointments.results ?? []).some((appointment) => {
    const existingStart = new Date(appointment.start_at.replace(' ', 'T')).getTime();
    const existingEnd = existingStart + Number(appointment.duration_minutes) * 60_000;
    return Number.isFinite(existingStart) && appointmentStart < existingEnd && existingStart < appointmentEnd;
  });
  if (isConflict) return apiError(409, `${coach}在这个时段已经有预约。`);
  await context.env.DB.prepare('INSERT INTO appointments (id, member_id, coach, start_at, duration_minutes, status, note, actor_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id(), memberId, coach, startAt, duration, 'confirmed', optionalText(input.note, 2000), actor(context)).run();
  return stateResponse(context, 201);
}

async function cancelAppointment(context: Context, appointmentId: string) {
  const result = await context.env.DB.prepare("UPDATE appointments SET status = 'cancelled', updated_at = datetime('now') WHERE id = ? AND status = 'confirmed'")
    .bind(appointmentId).run();
  if (Number(result.meta.changes ?? 0) !== 1) return apiError(404, '预约不存在或已取消。');
  return stateResponse(context);
}

export const onRequest: PagesFunction<Env, string, RequestData> = async (context) => {
  const url = new URL(context.request.url);
  const path = url.pathname.replace(/^\/api\/?/, '');
  try {
    actor(context);
    if (context.request.method === 'GET' && path === 'me') return json({ email: actor(context) });
    if (context.request.method === 'GET' && (path === 'bootstrap' || path === 'export')) return json({ state: await getGymState(context.env.DB) });
    if (context.request.method === 'POST' && path === 'members') return createMember(context);
    const memberMatch = path.match(/^members\/([^/]+)$/);
    if (context.request.method === 'PATCH' && memberMatch) return updateMember(context, memberMatch[1]);
    if (context.request.method === 'POST' && path === 'payments') return createPayment(context);
    if (context.request.method === 'POST' && path === 'classes') return createClassLog(context);
    const undoMatch = path.match(/^classes\/([^/]+)\/undo$/);
    if (context.request.method === 'POST' && undoMatch) return undoClassLog(context, undoMatch[1]);
    if (context.request.method === 'POST' && path === 'training-plans') return savePlan(context);
    const activeMatch = path.match(/^training-plans\/([^/]+)\/activate$/);
    if (context.request.method === 'POST' && activeMatch) return activatePlan(context, activeMatch[1]);
    const planMatch = path.match(/^training-plans\/([^/]+)$/);
    if (context.request.method === 'DELETE' && planMatch) {
      await context.env.DB.prepare('DELETE FROM training_plans WHERE id = ?').bind(planMatch[1]).run();
      return stateResponse(context);
    }
    if (context.request.method === 'POST' && path === 'appointments') return createAppointment(context);
    const appointmentCancelMatch = path.match(/^appointments\/([^/]+)\/cancel$/);
    if (context.request.method === 'POST' && appointmentCancelMatch) return cancelAppointment(context, appointmentCancelMatch[1]);
    if (context.request.method === 'POST' && path === 'import') {
      if (!(await dbIsEmpty(context.env.DB))) return apiError(409, '云端已有数据。为避免误覆盖，只允许首次导入。');
      const input = await body(context.request);
      await importGymState(context.env.DB, input.state, actor(context));
      return stateResponse(context, 201);
    }
    return apiError(404, '接口不存在。');
  } catch (error) {
    const message = error instanceof Error ? error.message : '请求处理失败。';
    return apiError(400, message);
  }
};
