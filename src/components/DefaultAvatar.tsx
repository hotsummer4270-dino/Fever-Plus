import React from 'react';

interface DefaultAvatarProps {
  name: string;
  className?: string;
}

export default function DefaultAvatar({ name, className = "h-11 w-11" }: DefaultAvatarProps) {
  // Simple deterministic hash based on name
  const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const hash = getHash(name);
  const type = hash % 4;

  // Colors based on type
  const bgClasses = [
    'bg-amber-50 border-amber-200 text-amber-700',
    'bg-emerald-50 border-emerald-200 text-emerald-700',
    'bg-rose-50 border-rose-200 text-rose-700',
    'bg-indigo-50 border-indigo-200 text-indigo-700',
  ];

  const selectedBg = bgClasses[type];

  return (
    <div className={`${className} ${selectedBg} rounded-xl border shrink-0 flex items-center justify-center overflow-hidden transition-all duration-300 relative group`}>
      {type === 0 && (
        /* Zen Mountain & Sun */
        <svg viewBox="0 0 100 100" className="w-4/5 h-4/5 opacity-85" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="35" r="14" fill="#FCD34D" opacity="0.6" />
          <path d="M20 75 L45 42 L65 75 Z" fill="#D1FAE5" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M40 75 L65 52 L90 75 Z" fill="#A7F3D0" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          <line x1="15" y1="75" x2="85" y2="75" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}

      {type === 1 && (
        /* Organic Branch / Monstera Leaf */
        <svg viewBox="0 0 100 100" className="w-4/5 h-4/5 opacity-85" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 80 Q50 35 68 20" />
          <path d="M50 65 Q32 55 38 45 Q46 43 50 55 Z" fill="#10B981" fillOpacity="0.2" />
          <path d="M52 48 Q68 40 62 30 Q54 34 52 42 Z" fill="#34D399" fillOpacity="0.3" />
          <path d="M49 35 Q30 28 35 18 Q44 20 48 28 Z" fill="#A7F3D0" fillOpacity="0.4" />
        </svg>
      )}

      {type === 2 && (
        /* Zen Lotus Flower */
        <svg viewBox="0 0 100 100" className="w-4/5 h-4/5 opacity-85" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 75 C42 60 28 65 32 45 C36 25 50 35 50 35 C50 35 64 25 68 45 C72 65 58 60 50 75 Z" fill="#FDA4AF" fillOpacity="0.25" />
          <path d="M50 75 C45 62 35 60 40 50 C45 40 50 48 50 48 C50 48 55 40 60 50 C65 60 55 62 50 75 Z" fill="#F43F5E" fillOpacity="0.15" />
          <circle cx="50" cy="48" r="4" fill="#FB7185" />
          <line x1="25" y1="75" x2="75" y2="75" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}

      {type === 3 && (
        /* Wave / Heart Energy Pulse */
        <svg viewBox="0 0 100 100" className="w-4/5 h-4/5 opacity-85" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 50 Q28 50 33 35 Q38 20 44 60 Q49 78 54 50 L85 50" stroke="currentColor" strokeWidth="3" />
          <circle cx="44" cy="60" r="3.5" fill="#6366F1" />
          <circle cx="33" cy="35" r="3.5" fill="#818CF8" />
        </svg>
      )}

      {/* Tiny first letter overlay on hover as a nice transition detail */}
      <span className="absolute inset-0 bg-slate-900/5 backdrop-blur-[0.5px] opacity-0 group-hover:opacity-100 flex items-center justify-center font-black text-xs text-slate-800 tracking-tight transition-all duration-200">
        {name[0]}
      </span>
    </div>
  );
}
