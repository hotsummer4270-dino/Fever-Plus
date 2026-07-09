import React, { useRef } from 'react';
import { X, Dumbbell, Award, Flame, Calendar, Sparkles, Share2, Printer, Heart } from 'lucide-react';
import { Member, ClassLog, CoursePack } from '../types';
import { formatCurrency, formatDateTime } from '../utils';
import DefaultAvatar from './DefaultAvatar';

interface MemberReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  classLogs: ClassLog[];
  coursePacks: CoursePack[];
}

export default function MemberReportModal({
  isOpen,
  onClose,
  member,
  classLogs,
  coursePacks,
}: MemberReportModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Compute stats for this specific member
  const memberClassLogs = classLogs.filter((l) => l.memberId === member.id);
  const totalClassesCompleted = memberClassLogs.reduce((acc, l) => acc + l.sessionCount, 0);
  
  // Active Remaining lessons
  const activePacks = coursePacks.filter((p) => p.status === 'active' && p.memberIds.includes(member.id));
  const remainingLessons = activePacks.reduce((acc, p) => acc + p.remainingSessions, 0);
  
  // Calculate attendance streak (simple calculation of classes within last 30 days)
  const classesLastMonth = memberClassLogs.filter((l) => {
    const classDate = new Date(l.date.replace(' ', 'T'));
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    return classDate >= oneMonthAgo;
  }).length;

  // Extract a few recent movements/weights from the logs
  const parsePRs = () => {
    const prList: string[] = [];
    // Check if the note contains common PR movements
    const textToSearch = memberClassLogs.map(l => l.content).join('\n');
    
    const patterns = [
      { name: '硬拉', regex: /硬拉[:\s]*(\d+k?g?)/i },
      { name: '深蹲', regex: /深蹲[:\s]*(\d+k?g?)/i },
      { name: '卧推', regex: /卧推[:\s]*(\d+k?g?)/i },
      { name: '臀桥', regex: /臀桥[:\s]*(\d+k?g?)/i },
      { name: '平板支撑', regex: /平板支撑[:\s]*(\d+[^()\n]*)/i }
    ];

    patterns.forEach(p => {
      const match = textToSearch.match(p.regex);
      if (match && match[1]) {
        prList.push(`${p.name} - ${match[1]}`);
      }
    });

    if (prList.length === 0) {
      // Default based on gender
      if (member.gender === 'male') {
        prList.push('核心硬拉控制 (良好)');
        prList.push('力量推胸突破 (持续中)');
      } else {
        prList.push('臀腿核心激活 (极佳)');
        prList.push('体态脊柱梳理 (改善明显)');
      }
    }
    return prList;
  };

  const prs = parsePRs();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      {/* Modal Card wrapper */}
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col my-8">
        
        {/* Actions bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <span className="text-xs text-slate-700 font-bold">生成海报预览</span>
          <div className="flex gap-1.5">
            <button 
              onClick={handlePrint}
              title="打印或保存PDF"
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-rose-600 cursor-pointer transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Poster Content (Designed to look like a mobile report) */}
        <div 
          ref={printRef}
          className="bg-slate-50/50 p-6 relative overflow-hidden flex-1 select-none border-b border-slate-100"
          id="report-poster"
        >
          {/* Visual abstract ornaments */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-500/10 to-blue-500/0 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-rose-500/10 to-pink-500/0 rounded-full blur-2xl" />

          {/* Poster Header */}
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-xs">
                <Dumbbell className="h-4 w-4 text-white stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-850 tracking-wide">Fever Plus</h4>
                <span className="text-[8px] text-slate-400 font-mono font-extrabold">POWERED BY LIWANG & HUAHUA</span>
              </div>
            </div>
            
            <div className="bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md text-[8px] text-indigo-700 font-mono font-bold">
              PRO REPORT
            </div>
          </div>

          {/* Member Card Hero */}
          <div className="bg-white border border-slate-150 p-4 rounded-2xl mb-5 relative z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <DefaultAvatar name={member.name} className="h-12 w-12" />
              <div>
                <h2 className="text-sm font-bold text-slate-850">{member.name}</h2>
                <span className="text-[10px] text-slate-600 block mt-0.5">
                  已累计在 Fever Plus 训练了 <b className="text-indigo-600 font-mono text-xs font-black">{totalClassesCompleted}</b> 节私教课
                </span>
              </div>
            </div>
          </div>

          {/* Stats Badges Grid */}
          <div className="grid grid-cols-2 gap-3 mb-5 relative z-10">
            
            {/* Streak card */}
            <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="h-8 w-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center shrink-0 border border-rose-100">
                <Flame className="h-4 w-4 fill-rose-50" />
              </div>
              <div>
                <span className="text-[8px] text-slate-400 block font-bold">近30天出勤</span>
                <span className="text-xs font-extrabold text-slate-800 font-mono">{classesLastMonth} 节</span>
              </div>
            </div>

            {/* Remaining classes card */}
            <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="h-8 w-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0 border border-indigo-100">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[8px] text-slate-400 block font-bold">剩余可用课时</span>
                <span className="text-xs font-extrabold text-indigo-600 font-mono">{remainingLessons} 节</span>
              </div>
            </div>

          </div>

          {/* Training Achievements / PR */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 relative z-10 shadow-sm">
            <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 mb-2 border-b border-slate-100 pb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              阶段性训练突破 / 重点方向
            </h3>
            <ul className="space-y-1.5 text-[11px] text-slate-600 font-mono font-medium">
              {prs.map((pr, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>{pr}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Coach Quote Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 relative z-10 shadow-sm">
            <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-50" />
              教练寄语与评估
            </h3>
            <p className="text-[10px] text-slate-600 leading-relaxed italic font-medium">
              "{member.gender === 'female' 
                ? '花花教练：看到你在拉伸平衡和核心姿势控制上的巨大蜕变。每一次发力都更加精准，继续坚持，你正在塑造更完美的体态！' 
                : '力王教练：对待训练绝对严谨，大重量深蹲和硬拉动作标准！核心日渐扎实。让我们继续冲刺下一个最大极限重量，加油！'}"
            </p>
          </div>

          {/* Poster Footer (Branding) */}
          <div className="border-t border-slate-200 pt-4 text-center relative z-10">
            <span className="text-[8px] text-slate-400 uppercase tracking-widest font-mono font-bold">
              - 汗水不会欺骗你 • FEVER PLUS -
            </span>
            <p className="text-[7px] text-slate-500 mt-0.5 font-medium">
              地址：朝阳区私教能量一号店 • 电话：138-1234-5678
            </p>
          </div>

        </div>

        {/* Bottom prompt to capture */}
        <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
          <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5 font-semibold">
            <Share2 className="h-3.5 w-3.5 text-indigo-600" />
            <span>可直接使用手机截图或打印分享给学员</span>
          </p>
        </div>

      </div>
    </div>
  );
}
