import React, { useState } from 'react';
import { DollarSign, Search, Calendar, CreditCard, Tag, UserCheck } from 'lucide-react';
import { GymState, PaymentLog } from '../types';
import { formatCurrency } from '../utils';

interface PaymentLogsScreenProps {
  state: GymState;
}

type PeriodType = 'week' | 'month' | 'year' | 'all';

export default function PaymentLogsScreen({ state }: PaymentLogsScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'wechat' | 'alipay' | 'bank' | 'cash'>('all');
  
  // 1. Period selection state - Point 10 (Default to 'month')
  const [period, setPeriod] = useState<PeriodType>('month');

  // Helper to filter data by the selected period
  const filterByPeriod = (logs: PaymentLog[]): PaymentLog[] => {
    if (period === 'all') return logs;
    
    const now = new Date();
    const limitDate = new Date(now);
    
    if (period === 'week') {
      limitDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      limitDate.setDate(now.getDate() - 30);
    } else if (period === 'year') {
      limitDate.setFullYear(now.getFullYear() - 1);
    }
    
    return logs.filter(log => {
      if (!log.payDate) return false;
      const logDate = new Date(log.payDate.replace(' ', 'T'));
      return logDate >= limitDate && logDate <= now;
    });
  };

  const periodLogs = filterByPeriod(state.paymentLogs);

  const filteredLogs = periodLogs.filter((log) => {
    const matchesSearch =
      log.payerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.coursePackName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === 'all' || log.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const grandTotal = filteredLogs.reduce((acc, log) => acc + log.amount, 0);

  return (
    <div className="space-y-6" id="payment-logs-container">
      
      {/* Top Ledger Overview Card */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-sm">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">所选周期内收费汇总</h2>
          <span className="text-3xl font-black text-emerald-600 font-mono block mt-1.5">
            {formatCurrency(grandTotal)}
          </span>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">
            包含当前筛选出的 {filteredLogs.length} 笔收费明细 • 实收账款合伙对账
          </p>
        </div>

        {/* Channels mini stats */}
        <div className="flex flex-wrap gap-3">
          {['wechat', 'alipay', 'bank', 'cash'].map((method) => {
            const sum = periodLogs
              .filter(l => l.paymentMethod === method)
              .reduce((acc, l) => acc + l.amount, 0);
            return (
              <div key={method} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center min-w-[75px]">
                <span className="text-[9px] text-slate-400 block uppercase font-bold">
                  {method === 'wechat' ? '微信' : method === 'alipay' ? '支付宝' : method === 'bank' ? '卡转账' : '现金'}
                </span>
                <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">{formatCurrency(sum)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time Period Filter Bar (Point 10) */}
      <div className="bg-slate-100 border border-slate-200 p-2 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
        <span className="text-xs font-bold text-slate-655 text-slate-600 pl-2">📅 账单对账范围：</span>
        <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200/60 w-full sm:w-auto">
          {[
            { key: 'week', name: '最近一周' },
            { key: 'month', name: '最近一月' },
            { key: 'year', name: '最近一年' },
            { key: 'all', name: '历史全部' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setPeriod(item.key as PeriodType)}
              className={`flex-1 sm:flex-none px-3.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                period === item.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Control Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
          {/* Search bar */}
          <div className="relative flex-1 md:max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="搜索付款人或购买课包..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-55 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm"
            />
          </div>

          {/* Payment Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as any)}
            className="px-3.5 py-2 bg-slate-55 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500 text-xs font-bold"
          >
            <option value="all">所有付款渠道</option>
            <option value="wechat">仅看微信支付</option>
            <option value="alipay">仅看支付宝</option>
            <option value="bank">仅看银行转账</option>
            <option value="cash">仅看现金</option>
          </select>
        </div>
      </div>

      {/* Payment List Table/Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 p-4 bg-slate-50/60 border-b border-slate-100">
          <span className="col-span-3">缴费日期</span>
          <span className="col-span-3">买课人 / 学员</span>
          <span className="col-span-3">开通课包 / 备注</span>
          <span className="col-span-1.5">收款负责人</span>
          <span className="col-span-1.5 text-right">实收金额</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 space-y-2">
                <div className="grid grid-cols-12 gap-2 items-center text-xs font-mono text-slate-600">
                  <span className="col-span-3 text-slate-400 flex items-center gap-1 font-semibold">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {log.payDate}
                  </span>
                  
                  <span className="col-span-3 text-slate-800 font-bold font-sans">
                    {log.payerName}
                  </span>

                  <span className="col-span-3 text-slate-600 font-sans truncate pr-2 font-medium">
                    {log.coursePackName}
                  </span>

                  {/* 收款人 Field - Point 10 */}
                  <span className="col-span-1.5 font-sans font-semibold text-indigo-650 flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                    {log.receiver || '力王'}
                  </span>

                  <span className="col-span-1.5 text-right text-emerald-600 font-bold font-mono">
                    {formatCurrency(log.amount)}
                  </span>
                </div>

                {log.note && (
                  <div className="pl-4 border-l border-slate-200 text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-semibold">
                    <Tag className="h-3 w-3 text-slate-450 shrink-0" />
                    <span>备注: {log.note}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-455 text-slate-450 text-xs font-medium">
              当前统计周期范围内无匹配的收费凭证记录。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
