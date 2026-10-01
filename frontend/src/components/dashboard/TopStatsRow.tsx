import React from 'react';
import { Car, Users, IndianRupee } from 'lucide-react';

interface TopStatsRowProps {
  totalSlots: number;
  occupiedSlots: number;
  availableSlots: number;
  occupancyPercentage: number;
  todaysVehicles: number;
  todaysRevenue: number;
  timeOfDay?: 'DAY' | 'NIGHT';
}

export const TopStatsRow: React.FC<TopStatsRowProps> = ({
  totalSlots = 20,
  occupiedSlots = 0,
  availableSlots = 20,
  occupancyPercentage = 0,
  todaysVehicles = 0,
  todaysRevenue = 0,
  timeOfDay = 'DAY',
}) => {
  const isDay = timeOfDay === 'DAY';
  const availablePercent = totalSlots > 0 ? Math.round((availableSlots / totalSlots) * 100) : 100;

  const cardStyle = isDay
    ? 'bg-white border-slate-200/90 text-slate-800 shadow-sm hover:border-slate-300'
    : 'bg-slate-900/80 border-slate-800 text-slate-100 shadow-md hover:border-slate-700';

  const titleStyle = isDay ? 'text-slate-500 font-semibold' : 'text-slate-400 font-medium';
  const numberStyle = isDay ? 'text-slate-900' : 'text-white';
  const subStyle = isDay ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="grid grid-cols-5 gap-3.5 select-none">
      {/* 1. Total Slots */}
      <div className={`border rounded-xl p-3.5 flex items-center space-x-3.5 transition-all ${cardStyle}`}>
        <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-600/30">
          <Car className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className={`text-[11px] leading-tight ${titleStyle}`}>Total Slots</div>
          <div className={`text-xl font-extrabold font-mono mt-0.5 ${numberStyle}`}>{totalSlots}</div>
          <div className={`text-[10px] truncate mt-0.5 ${subStyle}`}>Parking slots available</div>
        </div>
      </div>

      {/* 2. Occupied Slots */}
      <div className={`border rounded-xl p-3.5 flex items-center space-x-3.5 transition-all ${cardStyle}`}>
        <div className="w-11 h-11 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-red-500/30">
          <Car className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className={`text-[11px] leading-tight ${titleStyle}`}>Occupied Slots</div>
          <div className={`text-xl font-extrabold font-mono mt-0.5 ${numberStyle}`}>{occupiedSlots}</div>
          <div className={`text-[10px] truncate mt-0.5 ${subStyle}`}>{occupancyPercentage}% occupancy</div>
        </div>
      </div>

      {/* 3. Available Slots */}
      <div className={`border rounded-xl p-3.5 flex items-center space-x-3.5 transition-all ${cardStyle}`}>
        <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/30">
          <Car className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className={`text-[11px] leading-tight ${titleStyle}`}>Available Slots</div>
          <div className={`text-xl font-extrabold font-mono mt-0.5 ${numberStyle}`}>{availableSlots}</div>
          <div className={`text-[10px] truncate mt-0.5 ${subStyle}`}>{availablePercent}% available</div>
        </div>
      </div>

      {/* 4. Today's Vehicles */}
      <div className={`border rounded-xl p-3.5 flex items-center space-x-3.5 transition-all ${cardStyle}`}>
        <div className="w-11 h-11 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-600/30">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className={`text-[11px] leading-tight ${titleStyle}`}>Today's Vehicles</div>
          <div className={`text-xl font-extrabold font-mono mt-0.5 ${numberStyle}`}>{todaysVehicles}</div>
          <div className={`text-[10px] truncate mt-0.5 ${subStyle}`}>Total entries today</div>
        </div>
      </div>

      {/* 5. Today's Revenue */}
      <div className={`border rounded-xl p-3.5 flex items-center space-x-3.5 transition-all ${cardStyle}`}>
        <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/30">
          <IndianRupee className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className={`text-[11px] leading-tight ${titleStyle}`}>Today's Revenue</div>
          <div className={`text-xl font-extrabold font-mono mt-0.5 ${numberStyle}`}>₹{todaysRevenue.toLocaleString('en-IN')}</div>
          <div className={`text-[10px] truncate mt-0.5 ${subStyle}`}>Total revenue today</div>
        </div>
      </div>
    </div>
  );
};
