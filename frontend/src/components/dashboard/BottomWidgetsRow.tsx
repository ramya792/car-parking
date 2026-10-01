import React from 'react';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { useParkingStore } from '../../store/parkingStore';

interface BottomWidgetsRowProps {
  occupiedCount: number;
  availableCount: number;
  reservedCount?: number;
  occupancyPercent: number;
  todaysRevenue: number;
  onViewAllEntries?: () => void;
  timeOfDay?: 'DAY' | 'NIGHT';
}

export const BottomWidgetsRow: React.FC<BottomWidgetsRowProps> = ({
  occupiedCount = 0,
  availableCount = 20,
  reservedCount = 0,
  occupancyPercent = 0,
  todaysRevenue = 0,
  onViewAllEntries,
  timeOfDay = 'DAY',
}) => {
  const isDay = timeOfDay === 'DAY';

  const { slots } = useParkingStore();
  const occupiedSlots = slots.filter((s) => s.status === 'OCCUPIED' && s.currentVehicle);
  const recentEntries = occupiedSlots.map((s) => ({
    time: s.currentVehicle?.entryTime || 'Just now',
    plate: s.currentVehicle?.plateNumber || '',
    slot: s.id,
    status: 'PARKED',
  }));

  const revenueBars = todaysRevenue > 0 ? [
    { time: '6AM', height: Math.min(100, Math.round((todaysRevenue * 0.15))) },
    { time: '9AM', height: Math.min(100, Math.round((todaysRevenue * 0.25))) },
    { time: '12PM', height: Math.min(100, Math.round((todaysRevenue * 0.40))) },
    { time: '3PM', height: Math.min(100, Math.round((todaysRevenue * 0.60))) },
    { time: '6PM', height: Math.min(100, Math.round((todaysRevenue * 0.35))) },
    { time: '9PM', height: Math.min(100, Math.round((todaysRevenue * 0.50))) },
  ] : [
    { time: '6AM', height: 4 },
    { time: '9AM', height: 4 },
    { time: '12PM', height: 4 },
    { time: '3PM', height: 4 },
    { time: '6PM', height: 4 },
    { time: '9PM', height: 4 },
  ];

  // SVG Donut calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (occupancyPercent / 100) * circumference;

  const widgetCard = isDay
    ? 'bg-white border-slate-200/90 text-slate-800 shadow-sm'
    : 'bg-slate-900/80 border-slate-800 text-slate-100 shadow-md';

  const headerBorder = isDay ? 'border-slate-200' : 'border-slate-800/80';
  const headerText = isDay ? 'text-slate-900 font-bold' : 'text-white font-bold';
  const tableBorder = isDay ? 'border-slate-100' : 'border-slate-800/30';
  const tableText = isDay ? 'text-slate-700' : 'text-slate-300';
  const tableHeader = isDay ? 'text-slate-400 font-mono border-slate-200' : 'text-slate-400 font-mono border-slate-800/50';

  return (
    <div className="grid grid-cols-4 gap-3.5 select-none">
      
      {/* 1. Recent Vehicle Entries */}
      <div className={`border rounded-xl p-3.5 flex flex-col justify-between transition-all ${widgetCard}`}>
        <div>
          <div className={`flex items-center justify-between pb-2 border-b ${headerBorder}`}>
            <h3 className={`text-xs tracking-wide ${headerText}`}>Recent Vehicle Entries</h3>
            <button
              onClick={onViewAllEntries}
              className="text-[10px] text-blue-600 hover:text-blue-500 font-semibold"
            >
              View All
            </button>
          </div>

          <table className="w-full text-[10px] mt-2 border-collapse">
            <thead>
              <tr className={tableHeader}>
                <th className="text-left font-normal pb-1.5">Time</th>
                <th className="text-left font-normal pb-1.5">Vehicle Number</th>
                <th className="text-left font-normal pb-1.5">Slot</th>
                <th className="text-center font-normal pb-1.5">Image</th>
                <th className="text-right font-normal pb-1.5">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${tableBorder}`}>
              {recentEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 font-sans text-xs">
                    No active parked vehicles
                  </td>
                </tr>
              ) : (
                recentEntries.map((row, idx) => (
                  <tr key={idx} className={isDay ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'}>
                    <td className={`py-1.5 font-mono ${tableText}`}>{row.time}</td>
                    <td className={`py-1.5 font-mono font-bold ${isDay ? 'text-slate-900' : 'text-slate-100'}`}>{row.plate}</td>
                    <td className="py-1.5 font-mono text-slate-400">{row.slot}</td>
                    <td className="py-1.5 text-center">
                      <img
                        src="/cameras/car_thumb.jpg"
                        alt={row.plate}
                        className="w-5 h-3.5 rounded object-cover inline-block border border-slate-300"
                      />
                    </td>
                    <td className="py-1.5 text-right">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Parking Statistics */}
      <div className={`border rounded-xl p-3.5 flex flex-col justify-between transition-all ${widgetCard}`}>
        <div className={`flex items-center justify-between pb-2 border-b ${headerBorder}`}>
          <h3 className={`text-xs tracking-wide ${headerText}`}>Parking Statistics</h3>
        </div>

        <div className="flex items-center justify-around py-2">
          {/* Radial Donut Progress */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-emerald-500"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Progress Circle (Occupied in Red) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-red-500 transition-all duration-1000 ease-out"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-base font-extrabold font-mono leading-none ${isDay ? 'text-slate-900' : 'text-white'}`}>
                {occupancyPercent}%
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">Occupied</span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />
              <span className={`font-medium ${isDay ? 'text-slate-700' : 'text-slate-300'}`}>Occupied ({occupiedCount})</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              <span className={`font-medium ${isDay ? 'text-slate-700' : 'text-slate-300'}`}>Available ({availableCount})</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
              <span className={`font-medium ${isDay ? 'text-slate-700' : 'text-slate-300'}`}>Reserved ({reservedCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Today's Revenue */}
      <div className={`border rounded-xl p-3.5 flex flex-col justify-between transition-all ${widgetCard}`}>
        <div className={`flex items-center justify-between pb-1`}>
          <h3 className={`text-xs tracking-wide ${headerText}`}>Today's Revenue</h3>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
        </div>

        <div className="flex items-baseline space-x-2">
          <span className={`text-2xl font-black font-mono ${isDay ? 'text-slate-900' : 'text-white'}`}>
            ₹{todaysRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 rounded flex items-center font-bold">
            <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> 12%
          </span>
        </div>

        {/* Hourly Bar Chart */}
        <div className="pt-2">
          <div className={`h-16 flex items-end justify-between gap-1.5 px-1 pb-1 border-b ${isDay ? 'border-slate-200' : 'border-slate-800/60'}`}>
            {revenueBars.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div
                  style={{ height: `${bar.height}%` }}
                  className="w-full bg-blue-500 hover:bg-blue-600 rounded-t transition-all"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[8px] text-slate-400 font-mono pt-1">
            {revenueBars.map((bar, i) => (
              <span key={i} className="flex-1 text-center">{bar.time}</span>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
