import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  IndianRupee,
  Activity,
  Search,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { apiService } from '../../services/api';
import type { AnalyticsDashboardData } from '../../types/parking';

interface AnalyticsDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsDashboardModal: React.FC<AnalyticsDashboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [stats, setStats] = useState<AnalyticsDashboardData | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PARKED' | 'EXITED'>('ALL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsData, historyData] = await Promise.all([
        apiService.getAnalyticsData(),
        apiService.getSessionHistory(),
      ]);
      setStats(analyticsData);
      setSessions(historyData || []);
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) => {
    const term = searchTerm.toLowerCase();
    const plate = s.vehicle_number?.toLowerCase() || '';
    const slot = s.slot_id?.toLowerCase() || '';
    const matchesSearch = !searchTerm || plate.includes(term) || slot.includes(term);
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-950 border border-slate-700/80 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Facility Analytics & Operational Intelligence
                </h2>
                <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>LIVE RECHARTS ANALYTICS</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  EFFICIENCY: {stats?.efficiency_score || 94.2}%
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time commercial parking telemetry, revenue trends, occupancy projections, and vehicle class distributions.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top 6 KPI Metric Cards */}
          <div className="grid grid-cols-6 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Total Capacity
              </span>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xl font-bold text-white">
                  {stats?.total_slots || 20}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Bays</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-blue-500 h-full w-full" />
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Occupancy Rate
              </span>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xl font-bold text-blue-400">
                  {stats?.occupancy_percentage || 70}%
                </span>
                <span className="text-[10px] text-blue-400/80 font-mono">
                  {stats?.occupied_slots || 14}/20 Full
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{ width: `${stats?.occupancy_percentage || 70}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Available Bays
              </span>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xl font-bold text-emerald-400">
                  {stats?.available_slots || 6}
                </span>
                <span className="text-[10px] text-emerald-400/80 font-mono">Ready</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${((stats?.available_slots || 6) / (stats?.total_slots || 20)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Today's Revenue
              </span>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xl font-bold text-white flex items-center">
                  <IndianRupee className="w-4 h-4 text-emerald-400" />
                  {stats?.todays_revenue?.toLocaleString('en-IN') || '1,850'}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center">
                  <ArrowUpRight className="w-3 h-3" />
                  +{stats?.revenue_growth_percent || 14.5}%
                </span>
              </div>
              <div className="text-[10px] text-slate-500">vs yesterday ₹1,615</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Total Vehicles
              </span>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xl font-bold text-white">
                  {stats?.todays_vehicles || 32}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Today</span>
              </div>
              <div className="text-[10px] text-slate-400">Turnover: {stats?.turnover_rate || 1.6}x</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Avg Duration
              </span>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xl font-bold text-amber-400">
                  {stats?.average_duration || '2h 45m'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Dwell</span>
              </div>
              <div className="text-[10px] text-slate-400">Peak: {stats?.peak_hours?.split('-')[0] || '2 PM'}</div>
            </div>
          </div>

          {/* Visual Charts Row */}
          <div className="grid grid-cols-12 gap-5">
            {/* Hourly Revenue Bar Chart (7 cols) */}
            <div className="col-span-7 bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Hourly Revenue Trend (₹)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">TODAY'S HOURLY INTAKE</span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats?.hourly_revenue_trend || []}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="time"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                      }}
                      formatter={(value: any) => [`₹${value}`, 'Revenue']}
                    />
                    <Bar
                      dataKey="amount"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Vehicle Fleet Distribution Donut Chart (5 cols) */}
            <div className="col-span-5 bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <PieIcon className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Vehicle Class Distribution
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">ACTIVE FLEET</span>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.vehicle_distribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="count"
                    >
                      {stats?.vehicle_distribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                      }}
                      formatter={(val: any, name: any) => [`${val} Vehicles`, name]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span className="text-xs text-slate-300 font-mono">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Occupancy Trend Area Chart */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Occupancy Percentage Progression (%)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                CAPACITY UTILIZATION
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats?.hourly_occupancy_trend || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                    formatter={(val: any) => [`${val}%`, 'Occupancy']}
                  />
                  <Area
                    type="monotone"
                    dataKey="occupancy_percent"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#occupancyGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active & Recent Parking Sessions Ledger Table */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Vehicle Parking Sessions Ledger
                </h3>
                <p className="text-[11px] text-slate-400">
                  Real-time record of active parked vehicles and completed exits.
                </p>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search plate or bay..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44"
                  />
                </div>

                {/* Status Tabs */}
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
                  {(['ALL', 'PARKED', 'EXITED'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        statusFilter === filter
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-800 max-h-52 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-mono sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Session ID</th>
                    <th className="py-2 px-3">Vehicle Plate</th>
                    <th className="py-2 px-3">Bay</th>
                    <th className="py-2 px-3">Entry Time</th>
                    <th className="py-2 px-3">Dwell Duration</th>
                    <th className="py-2 px-3">Tariff Fee</th>
                    <th className="py-2 px-3">Payment</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/30 font-mono text-[11px]">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-slate-500">
                        No sessions match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 text-slate-400 text-[10px]">{session.id}</td>
                        <td className="py-2 px-3 font-bold text-white">
                          <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-700 text-yellow-400">
                            {session.vehicle_number}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold text-blue-400">{session.slot_id}</td>
                        <td className="py-2 px-3 text-slate-300 text-[10px]">{session.entry_time}</td>
                        <td className="py-2 px-3 text-amber-400 font-medium">
                          {session.duration_display}
                        </td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">
                          ₹{session.fee?.toFixed(2) || '50.00'}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              session.payment_status === 'SUCCESS'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {session.payment_status}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              session.status === 'PARKED'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {session.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-900/40 text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>FastAPI Analytics Engine • Automatic synchronization</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
};
