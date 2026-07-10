import React, { useState } from 'react';
import { ArrowRight, Dumbbell, Eye, EyeOff, Lock } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (coach: '力王' | '花花') => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [selectedCoach, setSelectedCoach] = useState<'力王' | '花花'>('力王');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (pin === '8888' || pin === '6666') {
      onLogin(selectedCoach);
      return;
    }
    setError(pin ? 'PIN 码不正确' : '请输入 PIN 码');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-lg sm:p-8" id="login-card">
        <header className="mb-7 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Fever Plus</h1>
            <p className="mt-0.5 text-sm text-slate-500">力王和花花的工作室账本</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-bold text-slate-700">今天是谁在记</legend>
            <div className="grid grid-cols-2 gap-2">
              {(['力王', '花花'] as const).map((coach) => {
                const selected = coach === selectedCoach;
                return (
                  <button
                    key={coach}
                    type="button"
                    onClick={() => {
                      setSelectedCoach(coach);
                      setError('');
                    }}
                    className={`min-h-12 rounded-lg border text-base font-bold transition-colors ${
                      selected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                    aria-pressed={selected}
                  >
                    {coach}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="pin-input" className="mb-2 block text-sm font-bold text-slate-700">PIN 码</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="pin-input"
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete="current-password"
                placeholder="请输入 PIN"
                value={pin}
                onChange={(event) => {
                  setPin(event.target.value);
                  setError('');
                }}
                maxLength={8}
                className="min-h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-11 text-center font-mono text-base tracking-widest text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPin((current) => !current)}
                className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label={showPin ? '隐藏 PIN' : '显示 PIN'}
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="mt-2 text-sm font-semibold text-rose-600">{error}</p>}
          </div>

          <button
            type="submit"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800"
          >
            进入工作台
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-400">
          当前版本的数据保存在这台设备的浏览器中
        </p>
      </section>
    </main>
  );
}
