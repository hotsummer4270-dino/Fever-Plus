import React, { useState } from 'react';
import { Dumbbell, Eye, EyeOff, Lock, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginScreenProps {
  onLogin: (coach: '力王' | '花花') => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [selectedCoach, setSelectedCoach] = useState<'力王' | '花花'>('力王');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '8888' || pin === '6666' || pin === '') {
      onLogin(selectedCoach);
    } else {
      setError('PIN 码错误 (提示：默认 8888 或留空直接登录)');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xl relative z-10"
        id="login-card"
      >
        <div className="flex flex-col items-center mb-6">
          {/* Beautiful Potted Plant Illustration */}
          <svg viewBox="0 0 200 120" className="w-48 h-28 mx-auto opacity-95 mb-2" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Sun/Zen backdrop */}
            <circle cx="130" cy="45" r="16" fill="#EBEAE4" opacity="0.9" />
            {/* Pot */}
            <path d="M75 105 L125 105 L118 80 L82 80 Z" fill="#D2C7B1" stroke="#202824" strokeWidth="2" strokeLinejoin="round" />
            {/* Soil line */}
            <path d="M80 80 Q100 78 120 80" stroke="#202824" strokeWidth="2" />
            {/* Main stalk 1 */}
            <path d="M100 80 Q98 45 110 20" stroke="#202824" strokeWidth="2.5" strokeLinecap="round" />
            {/* Leaves 1 */}
            <path d="M110 20 Q122 15 125 28 Q112 30 110 20 Z" fill="#5D9275" stroke="#202824" strokeWidth="1.5" />
            <path d="M105 45 Q118 42 122 52 Q108 55 105 45 Z" fill="#1F4538" stroke="#202824" strokeWidth="1.5" />
            <path d="M101 62 Q85 58 83 68 Q97 70 101 62 Z" fill="#5D9275" stroke="#202824" strokeWidth="1.5" />
            {/* Main stalk 2 */}
            <path d="M92 80 Q80 55 72 35" stroke="#202824" strokeWidth="2" strokeLinecap="round" />
            {/* Leaves 2 */}
            <path d="M72 35 Q60 32 58 45 Q70 48 72 35 Z" fill="#5D9275" stroke="#202824" strokeWidth="1.5" />
            <path d="M84 55 Q70 52 68 62 Q82 65 84 55 Z" fill="#1F4538" stroke="#202824" strokeWidth="1.5" />
          </svg>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Fever Plus
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">力王 & 花花 私教工作室管理系统</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Coach Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              当前登录教练
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['力王', '花花'] as const).map((coach) => (
                <button
                  key={coach}
                  type="button"
                  onClick={() => {
                    setSelectedCoach(coach);
                    setError('');
                  }}
                  className={`py-5 rounded-xl border text-lg font-bold transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    selectedCoach === coach
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/80'
                  }`}
                >
                  <span>{coach}</span>
                </button>
              ))}
            </div>
          </div>

          {/* PIN Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="pin-input" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                工作台 PIN 密匙
              </label>
              <span className="text-[10px] text-slate-400">提示：默认 PIN 为 8888</span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                id="pin-input"
                type={showPin ? 'text' : 'password'}
                placeholder="请输入 4 位 PIN 码 (直接登录免输)"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                maxLength={8}
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono tracking-widest text-center"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-500 mt-2 text-center font-medium">
                {error}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="h-5 w-5 fill-white" />
            进入管理工作台
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[11px] text-slate-400">
            夫妻共用账号模式已激活 • 数据保存在本地设备上
          </p>
        </div>
      </motion.div>
    </div>
  );
}
