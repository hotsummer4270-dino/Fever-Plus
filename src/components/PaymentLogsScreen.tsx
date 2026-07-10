import React, { useState } from 'react';
import { Calendar, DollarSign, Search, Tag } from 'lucide-react';
import { GymState, PaymentLog } from '../types';
import { formatCurrency } from '../utils';

interface PaymentLogsScreenProps {
  state: GymState;
  embedded?: boolean;
}

type PeriodType = 'week' | 'month' | 'year' | 'all';
type PaymentMethod = 'wechat' | 'alipay' | 'bank' | 'cash';

const methodNames: Record<PaymentMethod, string> = {
  wechat: '微信',
  alipay: '支付宝',
  bank: '银行卡',
  cash: '现金',
};

export default function PaymentLogsScreen({ state, embedded = false }: PaymentLogsScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | PaymentMethod>('all');
  const [period, setPeriod] = useState<PeriodType>('month');

  const filterByPeriod = (logs: PaymentLog[]) => {
    if (period === 'all') return logs;
    const now = new Date();
    const limitDate = new Date(now);
    if (period === 'week') limitDate.setDate(now.getDate() - 7);
    if (period === 'month') limitDate.setDate(now.getDate() - 30);
    if (period === 'year') limitDate.setFullYear(now.getFullYear() - 1);
    return logs.filter((log) => {
      const logDate = new Date(log.payDate.replace(' ', 'T'));
      return !Number.isNaN(logDate.getTime()) && logDate >= limitDate && logDate <= now;
    });
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredLogs = filterByPeriod([...state.paymentLogs])
    .filter((log) => {
      const matchesSearch =
        log.payerName.toLowerCase().includes(normalizedSearch) ||
        log.coursePackName.toLowerCase().includes(normalizedSearch) ||
        log.note.toLowerCase().includes(normalizedSearch);
      return matchesSearch && (methodFilter === 'all' || log.paymentMethod === methodFilter);
    })
    .sort((a, b) => b.payDate.localeCompare(a.payDate));

  const totalReceivable = filteredLogs.reduce(
    (sum, log) => sum + (log.receivableAmount ?? log.amount),
    0,
  );
  const totalReceived = filteredLogs.reduce((sum, log) => sum + log.amount, 0);
  const totalDifference = totalReceivable - totalReceived;

  return (
    <div className="space-y-4" id="payment-logs-container">
      {!embedded && (
        <header>
          <h1 className="text-2xl font-extrabold text-slate-900">收款记录</h1>
          <p className="mt-1 text-sm text-slate-500">记录微信转账等实际到账，并保留应收差额。</p>
        </header>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="收款汇总">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-sm font-semibold text-slate-500">应收</span>
          <strong className="mt-2 block text-2xl font-extrabold text-slate-900">{formatCurrency(totalReceivable)}</strong>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <span className="text-sm font-semibold text-emerald-700">实收</span>
          <strong className="mt-2 block text-2xl font-extrabold text-emerald-800">{formatCurrency(totalReceived)}</strong>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-sm font-semibold text-slate-500">应收与实收差额</span>
          <strong className={`mt-2 block text-2xl font-extrabold ${totalDifference ? 'text-amber-700' : 'text-slate-900'}`}>
            {formatCurrency(totalDifference)}
          </strong>
        </div>
      </section>

      <div className="flex flex-col gap-3 border-y border-slate-200 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1 lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="搜索付款人、课包或备注"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="min-h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={methodFilter}
            onChange={(event) => setMethodFilter(event.target.value as 'all' | PaymentMethod)}
            className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500"
            aria-label="付款方式筛选"
          >
            <option value="all">全部方式</option>
            <option value="wechat">微信</option>
            <option value="alipay">支付宝</option>
            <option value="bank">银行卡</option>
            <option value="cash">现金</option>
          </select>
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
          {[
            { key: 'week', name: '近 7 天' },
            { key: 'month', name: '近 30 天' },
            { key: 'year', name: '近一年' },
            { key: 'all', name: '全部' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setPeriod(item.key as PeriodType)}
              className={`min-h-8 flex-1 whitespace-nowrap rounded-md px-3 text-sm font-semibold sm:flex-none ${
                period === item.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredLogs.length > 0 ? filteredLogs.map((log) => {
          const receivable = log.receivableAmount ?? log.amount;
          const difference = receivable - log.amount;
          return (
            <article key={log.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{log.payerName}</h3>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
                      {methodNames[log.paymentMethod]}
                    </span>
                    {log.receiver && (
                      <span className="text-xs font-medium text-slate-500">{log.receiver}登记</span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-600">{log.coursePackName}</p>
                  <span className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="h-3 w-3" /> {log.payDate}
                  </span>
                  {(log.discountReason || log.note) && (
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-500">
                      <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {log.discountReason || log.note}
                    </p>
                  )}
                </div>

                <dl className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-3 text-right md:border-l md:border-t-0 md:pl-5 md:pt-0">
                  <div>
                    <dt className="text-xs font-semibold text-slate-400">应收</dt>
                    <dd className="mt-1 text-sm font-bold text-slate-700">{formatCurrency(receivable)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-400">实收</dt>
                    <dd className="mt-1 text-sm font-extrabold text-emerald-700">{formatCurrency(log.amount)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-400">差额</dt>
                    <dd className={`mt-1 text-sm font-bold ${difference ? 'text-amber-700' : 'text-slate-500'}`}>
                      {formatCurrency(difference)}
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          );
        }) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white py-12 text-center">
            <DollarSign className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">当前范围内没有收款记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
