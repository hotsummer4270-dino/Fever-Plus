import React, { useState } from 'react';
import { ClassLog } from '../types';
import { Calendar, Activity, Info } from 'lucide-react';

interface TrainingActivityMapProps {
  classLogs: ClassLog[];
  joinDate?: string;
}

export default function TrainingActivityMap({ classLogs, joinDate }: TrainingActivityMapProps) {
  const [viewType, setViewType] = useState<'daily' | 'weekly' | 'cumulative'>('weekly');
  const [hoveredCell, setHoveredCell] = useState<{
    weekLabel: string;
    details: string;
    count: number;
  } | null>(null);

  // Parse YYYY-MM-DD from full date string
  const getLocalDateString = (dateObj: Date) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // We want to construct a grid of 53 weeks ending on the coming Sunday (to complete this week)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
  // Align to Sunday of this week as the end of the grid
  const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const gridEnd = new Date(today);
  gridEnd.setDate(today.getDate() + daysToSunday);
  gridEnd.setHours(23, 59, 59, 999);

  // Start Monday is 52 weeks (364 days) before the start of the current week (which is 6 days before gridEnd)
  const gridStart = new Date(gridEnd);
  gridStart.setDate(gridEnd.getDate() - 53 * 7 + 1);
  gridStart.setHours(0, 0, 0, 0);

  // Generate 53 weeks
  interface WeekData {
    weekIndex: number;
    startDate: Date;
    endDate: Date;
    monthLabel: string;
    logs: ClassLog[];
    count: number;
    cumulativeCount: number;
  }

  const weeks: WeekData[] = [];
  let runningCumulative = 0;
  let prevMonth = -1;

  for (let i = 0; i < 53; i++) {
    const wStart = new Date(gridStart);
    wStart.setDate(gridStart.getDate() + i * 7);
    const wEnd = new Date(wStart);
    wEnd.setDate(wStart.getDate() + 6);
    wEnd.setHours(23, 59, 59, 999);

    // Filter class logs within this week
    const weekLogs = classLogs.filter((log) => {
      // log.date is in format "YYYY-MM-DD" or "YYYY-MM-DD HH:mm"
      const datePart = log.date.split(' ')[0];
      const logTime = new Date(datePart).getTime();
      return logTime >= wStart.getTime() && logTime <= wEnd.getTime();
    });

    runningCumulative += weekLogs.length;

    // We label the month if the month of the start of the week changes
    const currentMonth = wStart.getMonth();
    let monthLabel = '';
    if (currentMonth !== prevMonth) {
      monthLabel = `${currentMonth + 1}月`;
      prevMonth = currentMonth;
    }

    weeks.push({
      weekIndex: i,
      startDate: wStart,
      endDate: wEnd,
      monthLabel,
      logs: weekLogs,
      count: weekLogs.length,
      cumulativeCount: runningCumulative,
    });
  }

  const maxCumulative = runningCumulative > 0 ? runningCumulative : 1;

  // Render a column's cell status
  const getCellStatus = (week: WeekData, row: number) => {
    // row is from 0 (top) to 6 (bottom)
    if (viewType === 'weekly') {
      // Vertical histogram stack filled from bottom (row 6) up
      const activeBlocks = Math.min(week.count, 7);
      const isActive = (6 - row) < activeBlocks;
      return {
        isActive,
        colorClass: isActive ? 'bg-blue-500 hover:bg-blue-600 shadow-xs' : 'bg-slate-100/75 border border-slate-200/20',
        tooltip: `${week.startDate.getMonth() + 1}月${week.startDate.getDate()}日 ~ ${week.endDate.getMonth() + 1}月${week.endDate.getDate()}日：本周训练消课 ${week.count} 节`,
        count: week.count
      };
    } else if (viewType === 'daily') {
      // Classic GitHub Contribution Heatmap where each cell is a day of the week
      // Row 0 = Monday, Row 6 = Sunday
      const cellDate = new Date(week.startDate);
      cellDate.setDate(week.startDate.getDate() + row);
      const dateStr = getLocalDateString(cellDate);

      const dayLogs = week.logs.filter(log => log.date.startsWith(dateStr));
      const isActive = dayLogs.length > 0;
      
      let colorClass = 'bg-slate-100/75 border border-slate-200/20';
      if (isActive) {
        if (dayLogs.length === 1) colorClass = 'bg-blue-400 hover:bg-blue-500';
        else if (dayLogs.length === 2) colorClass = 'bg-blue-600 hover:bg-blue-750 bg-blue-600';
        else colorClass = 'bg-indigo-600 hover:bg-indigo-700';
      }

      const formattedDate = `${cellDate.getMonth() + 1}月${cellDate.getDate()}日`;
      return {
        isActive,
        colorClass,
        tooltip: `${formattedDate}：训练 ${dayLogs.length} 次`,
        count: dayLogs.length
      };
    } else {
      // Cumulative view: heights scaled progressively over the 52 weeks
      const scaledHeight = Math.round((week.cumulativeCount / maxCumulative) * 7);
      const isActive = (6 - row) < scaledHeight;
      return {
        isActive,
        colorClass: isActive ? 'bg-indigo-500 hover:bg-indigo-600 shadow-xs' : 'bg-slate-100/75 border border-slate-200/20',
        tooltip: `截止至 ${week.endDate.getMonth() + 1}月${week.endDate.getDate()}日：累计训练消课 ${week.cumulativeCount} 节`,
        count: week.cumulativeCount
      };
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs" id="training-activity-map">
      {/* Title Header with Options */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Activity className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">训练消课活跃度</h3>
            <p className="text-[10px] text-slate-400 font-medium">记录学员全年在店执教训练的每日/每周上课频次热力图</p>
          </div>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl self-end sm:self-auto">
          {[
            { key: 'daily', label: '每日' },
            { key: 'weekly', label: '每周' },
            { key: 'cumulative', label: '累计' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setViewType(item.key as any)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewType === item.key
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Heatmap Container */}
      <div className="relative">
        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <div className="min-w-[760px] select-none">
            {/* The Dot Grid Map */}
            <div className="grid grid-flow-col grid-cols-[repeat(53,1fr)] gap-[3px]">
              {weeks.map((week) => (
                <div key={week.weekIndex} className="flex flex-col gap-[3px]">
                  {Array.from({ length: 7 }).map((_, rIdx) => {
                    const cellInfo = getCellStatus(week, rIdx);
                    return (
                      <div
                        key={rIdx}
                        className={`h-3 w-3 rounded-[3px] transition-all duration-200 cursor-pointer ${cellInfo.colorClass}`}
                        onMouseEnter={() =>
                          setHoveredCell({
                            weekLabel: `${week.startDate.getMonth() + 1}月${week.startDate.getDate()}日 ~ ${week.endDate.getMonth() + 1}月${week.endDate.getDate()}日`,
                            details: cellInfo.tooltip,
                            count: cellInfo.count,
                          })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Bottom Month Labels */}
            <div className="grid grid-flow-col grid-cols-[repeat(53,1fr)] gap-[3px] mt-2 text-[10px] text-slate-400 font-semibold font-sans">
              {weeks.map((week) => (
                <div key={week.weekIndex} className="truncate text-left pl-0.5">
                  {week.monthLabel || ''}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Tooltip Indicator */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-50 pt-2 font-medium">
          <div className="flex items-center gap-1">
            <Info className="h-3.5 w-3.5 text-slate-350" />
            {hoveredCell ? (
              <span className="text-slate-650 transition-all duration-150 animate-fade-in font-bold">
                {hoveredCell.details}
              </span>
            ) : (
              <span>将鼠标悬停在方块上查看具体周期的训练消课节数</span>
            )}
          </div>

          {/* Color Guide Legend */}
          <div className="flex items-center gap-1 text-[10px]">
            <span>极少</span>
            <div className="h-2.5 w-2.5 rounded-[2px] bg-slate-100" />
            <div className="h-2.5 w-2.5 rounded-[2px] bg-blue-300" />
            <div className="h-2.5 w-2.5 rounded-[2px] bg-blue-500" />
            <div className="h-2.5 w-2.5 rounded-[2px] bg-indigo-600" />
            <span>频繁</span>
          </div>
        </div>
      </div>
    </div>
  );
}
