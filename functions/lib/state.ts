import type { Appointment, ClassLog, CoursePack, GymState, Member, PaymentLog, TrainingPlan } from '../../src/types';

type Row = Record<string, unknown>;

const asNumber = (value: unknown) => Number(value ?? 0);
const asText = (value: unknown) => String(value ?? '');
const centsToAmount = (value: unknown) => asNumber(value) / 100;
const amountToCents = (value: number) => Math.round(value * 100);

export { amountToCents, centsToAmount };

export async function getGymState(db: D1Database): Promise<GymState> {
  const [memberRows, packRows, packMemberRows, paymentRows, classRows, planRows, appointmentRows] = await db.batch([
    db.prepare('SELECT * FROM members ORDER BY join_date DESC, name ASC'),
    db.prepare('SELECT * FROM course_packs ORDER BY purchase_date DESC, created_at DESC'),
    db.prepare('SELECT course_pack_id, member_id FROM course_pack_members'),
    db.prepare('SELECT p.*, cp.name AS course_pack_name FROM payment_logs p JOIN course_packs cp ON cp.id = p.course_pack_id ORDER BY p.pay_date DESC, p.created_at DESC'),
    db.prepare('SELECT c.*, m.name AS member_name, cp.name AS course_pack_name FROM class_logs c JOIN members m ON m.id = c.member_id JOIN course_packs cp ON cp.id = c.course_pack_id ORDER BY c.class_date DESC, c.created_at DESC'),
    db.prepare('SELECT * FROM training_plans ORDER BY is_active DESC, updated_at DESC'),
    db.prepare('SELECT a.*, m.name AS member_name FROM appointments a JOIN members m ON m.id = a.member_id ORDER BY a.start_at ASC'),
  ]);

  const memberIdsByPack = new Map<string, string[]>();
  for (const row of (packMemberRows.results ?? []) as Row[]) {
    const packId = asText(row.course_pack_id);
    memberIdsByPack.set(packId, [...(memberIdsByPack.get(packId) ?? []), asText(row.member_id)]);
  }

  const members: Member[] = ((memberRows.results ?? []) as Row[]).map((row) => ({
    id: asText(row.id), name: asText(row.name), phone: asText(row.phone),
    gender: ['male', 'female', 'unknown'].includes(asText(row.gender)) ? asText(row.gender) as Member['gender'] : 'unknown', avatar: asText(row.avatar),
    joinDate: asText(row.join_date), note: asText(row.note),
    status: row.status === 'inactive' ? 'inactive' : 'active',
  }));
  const coursePacks: CoursePack[] = ((packRows.results ?? []) as Row[]).map((row) => {
    const purchasedSessions = asNumber(row.purchased_sessions);
    const giftedSessions = asNumber(row.gifted_sessions);
    const remainingPurchasedSessions = asNumber(row.remaining_purchased_sessions);
    const remainingGiftedSessions = asNumber(row.remaining_gifted_sessions);
    return {
      id: asText(row.id), name: asText(row.name), totalSessions: purchasedSessions + giftedSessions,
      remainingSessions: remainingPurchasedSessions + remainingGiftedSessions,
      purchasedSessions, giftedSessions, remainingPurchasedSessions, remainingGiftedSessions,
      price: centsToAmount(row.receivable_cents), purchaseDate: asText(row.purchase_date),
      expiresAt: row.expires_at ? asText(row.expires_at) : null,
      memberIds: memberIdsByPack.get(asText(row.id)) ?? [],
      status: ['active', 'completed', 'frozen', 'refunded'].includes(asText(row.status))
        ? asText(row.status) as CoursePack['status'] : 'active',
    };
  });
  const paymentLogs: PaymentLog[] = ((paymentRows.results ?? []) as Row[]).map((row) => ({
    id: asText(row.id), coursePackId: asText(row.course_pack_id), coursePackName: asText(row.course_pack_name),
    amount: centsToAmount(row.actual_cents), receivableAmount: centsToAmount(row.receivable_cents),
    discountAmount: centsToAmount(row.discount_cents), discountReason: asText(row.discount_reason),
    payDate: asText(row.pay_date), payerName: asText(row.payer_name),
    paymentMethod: asText(row.payment_method) as PaymentLog['paymentMethod'], note: asText(row.note),
    receiver: asText(row.receiver) as PaymentLog['receiver'],
  }));
  const classLogs: ClassLog[] = ((classRows.results ?? []) as Row[]).map((row) => ({
    id: asText(row.id), memberId: asText(row.member_id), memberName: asText(row.member_name),
    coach: asText(row.coach) as ClassLog['coach'], coursePackId: asText(row.course_pack_id),
    coursePackName: asText(row.course_pack_name), date: asText(row.class_date),
    duration: asNumber(row.duration_minutes), content: asText(row.content), sessionCount: asNumber(row.session_count),
    deductedPurchasedSessions: asNumber(row.deducted_purchased_sessions),
    deductedGiftedSessions: asNumber(row.deducted_gifted_sessions),
  }));
  const trainingPlans: TrainingPlan[] = ((planRows.results ?? []) as Row[]).flatMap((row) => {
    try {
      const days = JSON.parse(asText(row.days_json));
      return [{ id: asText(row.id), memberId: asText(row.member_id), title: asText(row.title),
        createdAt: asText(row.created_at), updatedAt: asText(row.updated_at), days,
        isActive: asNumber(row.is_active) === 1 } as TrainingPlan];
    } catch { return []; }
  });
  const appointments: Appointment[] = ((appointmentRows.results ?? []) as Row[]).map((row) => ({
    id: asText(row.id), memberId: asText(row.member_id), memberName: asText(row.member_name),
    coach: asText(row.coach) as Appointment['coach'], startAt: asText(row.start_at),
    duration: asNumber(row.duration_minutes), status: row.status === 'cancelled' ? 'cancelled' : 'confirmed',
    note: asText(row.note),
  }));
  return { schemaVersion: 3, members, coursePacks, paymentLogs, classLogs, trainingPlans, appointments };
}

export async function dbIsEmpty(db: D1Database): Promise<boolean> {
  const row = await db.prepare('SELECT COUNT(*) AS count FROM members').first<{ count: number }>();
  return Number(row?.count ?? 0) === 0;
}

function ensureArray(value: unknown, name: string): Record<string, unknown>[] {
  if (!Array.isArray(value)) throw new Error(`${name} 格式不正确。`);
  return value as Record<string, unknown>[];
}

function requiredText(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} 不能为空。`);
  return value.trim();
}

function nonNegative(value: unknown, name: string): number {
  const result = Number(value);
  if (!Number.isFinite(result) || result < 0) throw new Error(`${name} 必须是非负数字。`);
  return result;
}

export async function importGymState(db: D1Database, raw: unknown, actorEmail: string): Promise<void> {
  if (!raw || typeof raw !== 'object') throw new Error('备份内容无效。');
  const state = raw as Record<string, unknown>;
  const members = ensureArray(state.members, '学员');
  const packs = ensureArray(state.coursePacks, '课包');
  const payments = ensureArray(state.paymentLogs, '收款记录');
  const classes = ensureArray(state.classLogs, '消课记录');
  const plans = ensureArray(state.trainingPlans, '训练计划');
  const appointments = Array.isArray(state.appointments) ? state.appointments as Record<string, unknown>[] : [];
  const statements: D1PreparedStatement[] = [];

  for (const member of members) {
    const id = requiredText(member.id, '学员 ID');
    const gender = member.gender === 'male' || member.gender === 'female' ? member.gender : 'unknown';
    const status = member.status === 'inactive' ? 'inactive' : 'active';
    statements.push(db.prepare('INSERT INTO members (id, name, phone, gender, avatar, join_date, note, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, requiredText(member.name, '学员姓名'), requiredText(member.phone, '联系电话'), gender,
        typeof member.avatar === 'string' ? member.avatar : '', requiredText(member.joinDate, '建档日期'),
        typeof member.note === 'string' ? member.note : '', status));
  }
  for (const pack of packs) {
    const id = requiredText(pack.id, '课包 ID');
    const purchased = nonNegative(pack.purchasedSessions ?? pack.totalSessions, '已购课时');
    const gifted = nonNegative(pack.giftedSessions ?? 0, '赠送课时');
    const remainingPurchased = nonNegative(pack.remainingPurchasedSessions ?? Math.min(purchased, nonNegative(pack.remainingSessions, '剩余课时')), '已购剩余课时');
    const remainingGifted = nonNegative(pack.remainingGiftedSessions ?? Math.max(0, nonNegative(pack.remainingSessions, '剩余课时') - remainingPurchased), '赠送剩余课时');
    const status = ['active', 'completed', 'frozen', 'refunded'].includes(String(pack.status)) ? String(pack.status) : 'active';
    statements.push(db.prepare('INSERT INTO course_packs (id, name, purchased_sessions, gifted_sessions, remaining_purchased_sessions, remaining_gifted_sessions, receivable_cents, purchase_date, expires_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, requiredText(pack.name, '课包名称'), purchased, gifted, remainingPurchased, remainingGifted,
        amountToCents(nonNegative(pack.price, '应收金额')), requiredText(pack.purchaseDate, '购买日期'),
        typeof pack.expiresAt === 'string' ? pack.expiresAt : null, status));
    const memberIds = ensureArray(pack.memberIds, '课包学员').map((value) => requiredText(value, '课包学员 ID'));
    for (const memberId of memberIds) statements.push(db.prepare('INSERT INTO course_pack_members (course_pack_id, member_id) VALUES (?, ?)').bind(id, memberId));
  }
  for (const payment of payments) {
    statements.push(db.prepare('INSERT INTO payment_logs (id, course_pack_id, actual_cents, receivable_cents, discount_cents, discount_reason, pay_date, payer_name, payment_method, note, receiver, actor_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(requiredText(payment.id, '收款 ID'), requiredText(payment.coursePackId, '收款课包 ID'),
        amountToCents(nonNegative(payment.amount, '实收金额')), amountToCents(nonNegative(payment.receivableAmount ?? payment.amount, '应收金额')),
        amountToCents(nonNegative(payment.discountAmount ?? 0, '差额')), typeof payment.discountReason === 'string' ? payment.discountReason : '',
        requiredText(payment.payDate, '收款日期'), requiredText(payment.payerName, '付款人'), requiredText(payment.paymentMethod, '付款方式'),
        typeof payment.note === 'string' ? payment.note : '', payment.receiver === '花花' ? '花花' : '力王', actorEmail));
  }
  for (const log of classes) {
    statements.push(db.prepare('INSERT INTO class_logs (id, member_id, coach, course_pack_id, class_date, duration_minutes, content, session_count, deducted_purchased_sessions, deducted_gifted_sessions, actor_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(requiredText(log.id, '消课 ID'), requiredText(log.memberId, '消课学员 ID'), log.coach === '花花' ? '花花' : '力王',
        requiredText(log.coursePackId, '消课课包 ID'), requiredText(log.date, '上课时间'), nonNegative(log.duration, '上课时长'),
        typeof log.content === 'string' ? log.content : '', nonNegative(log.sessionCount, '扣课节数'),
        nonNegative(log.deductedPurchasedSessions ?? log.sessionCount, '已购扣课'), nonNegative(log.deductedGiftedSessions ?? 0, '赠送扣课'), actorEmail));
  }
  for (const plan of plans) {
    if (!Array.isArray(plan.days)) continue;
    statements.push(db.prepare('INSERT INTO training_plans (id, member_id, title, days_json, is_active, created_at, updated_at, actor_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(requiredText(plan.id, '计划 ID'), requiredText(plan.memberId, '计划学员 ID'), requiredText(plan.title, '计划标题'), JSON.stringify(plan.days),
        plan.isActive ? 1 : 0, requiredText(plan.createdAt, '计划创建日期'), requiredText(plan.updatedAt, '计划更新日期'), actorEmail));
  }
  for (const appointment of appointments) {
    statements.push(db.prepare('INSERT INTO appointments (id, member_id, coach, start_at, duration_minutes, status, note, actor_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(requiredText(appointment.id, '预约 ID'), requiredText(appointment.memberId, '预约学员 ID'),
        appointment.coach === '花花' ? '花花' : '力王', requiredText(appointment.startAt, '预约时间'),
        nonNegative(appointment.duration, '预约时长'), appointment.status === 'cancelled' ? 'cancelled' : 'confirmed',
        typeof appointment.note === 'string' ? appointment.note : '', actorEmail));
  }
  if (statements.length) await db.batch(statements);
}
