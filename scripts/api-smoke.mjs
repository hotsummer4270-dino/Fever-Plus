const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:8788';
const headers = {
  'content-type': 'application/json',
  'x-fever-local-email': process.env.LOCAL_ACTOR_EMAIL ?? 'local@example.com',
};

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  const payload = await response.json();
  if (!response.ok) throw new Error(`${options.method ?? 'GET'} ${path}: ${payload.error ?? response.status}`);
  return payload;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

let state = (await request('/api/bootstrap')).state;
assert(state.members.length === 0, '测试数据库必须为空。请先重新运行本地迁移。');

state = (await request('/api/members', { method: 'POST', body: JSON.stringify({ name: '测试学员甲', phone: '13800000001', gender: 'female', joinDate: '2026-07-10', note: 'API smoke test' }) })).state;
const memberA = state.members[0];
state = (await request('/api/members', { method: 'POST', body: JSON.stringify({ name: '测试学员乙', phone: '13800000002', gender: 'male', joinDate: '2026-07-10', note: '' }) })).state;
const memberB = state.members.find((member) => member.name === '测试学员乙');

state = (await request('/api/payments', { method: 'POST', body: JSON.stringify({
  memberIds: [memberA.id, memberB.id], purchasedSessions: 10, giftedSessions: 2,
  receivableAmount: 3000, actualAmount: 2800, differenceReason: '老学员优惠',
  payerName: '测试学员甲', paymentMethod: 'wechat', receiver: '力王', note: '共享课包',
  purchaseDate: '2026-07-10', packName: '共享测试课包',
}) })).state;
assert(state.coursePacks.length === 1 && state.paymentLogs.length === 1, '收款与开课包未同时写入。');
const pack = state.coursePacks[0];
assert(pack.remainingPurchasedSessions === 10 && pack.remainingGiftedSessions === 2, '课包初始课时不正确。');

state = (await request('/api/classes', { method: 'POST', body: JSON.stringify({
  memberId: memberA.id, coursePackId: pack.id, coach: '花花', date: '2026-07-10 10:00',
  duration: 60, content: '核心流程测试', sessionCount: 11,
}) })).state;
assert(state.classLogs.length === 1, '消课记录未写入。');
assert(state.coursePacks[0].remainingPurchasedSessions === 0 && state.coursePacks[0].remainingGiftedSessions === 1, '消课没有按已购优先、赠送随后扣除。');

state = (await request(`/api/classes/${state.classLogs[0].id}/undo`, { method: 'POST', body: '{}' })).state;
assert(state.classLogs.length === 0, '撤销消课未删除记录。');
assert(state.coursePacks[0].remainingPurchasedSessions === 10 && state.coursePacks[0].remainingGiftedSessions === 2, '撤销消课没有恢复课时。');

state = (await request('/api/appointments', { method: 'POST', body: JSON.stringify({
  memberId: memberA.id, coach: '力王', startAt: '2026-07-11T10:00', duration: 60, note: '预约流程测试',
}) })).state;
assert(state.appointments.length === 1 && state.appointments[0].status === 'confirmed', '预约没有写入。');
const appointment = state.appointments[0];

state = (await request(`/api/appointments/${appointment.id}/cancel`, { method: 'POST', body: '{}' })).state;
assert(state.appointments[0].status === 'cancelled', '取消预约没有生效。');

const exported = await request('/api/export');
assert(exported.state.paymentLogs[0].amount === 2800, '金额精度不正确。');
assert(exported.state.appointments[0].status === 'cancelled', '预约状态没有导出。');
console.log('API core flow passed: member, shared package/payment, class deduction, undo, appointment, export.');
