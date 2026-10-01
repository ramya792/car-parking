import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Search,
  Download,
  RefreshCw,
  Clock,
  RefreshCcw,
} from 'lucide-react';
import { apiService } from '../../services/api';
import { calculateDurationMinutes, calculateParkingFee, formatDuration } from '../../utils/tariff';

interface HistoricalSession {
  id: string;
  plate: string;
  bay: string;
  entryTime: string;
  exitTime: string;
  duration: string;
  fee: number;
  method: string;
  status: 'COMPLETED' | 'ACTIVE';
}

export const ParkingHistoryView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'ACTIVE'>('ALL');
  const [records, setRecords] = useState<HistoricalSession[]>([]);
  const [parkingStatus, setParkingStatus] = useState<{
    total_slots: number;
    occupied_slots: number;
    available_slots: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadBackendHistory();
  }, []);

  const loadBackendHistory = async () => {
    setLoading(true);
    try {
      // Backfill sessions for occupied bays before reading the history ledger.
      await apiService.syncSessions();
      const [data, status] = await Promise.all([
        apiService.getVehicleHistory(),
        apiService.getParkingStatus(),
      ]);
      setParkingStatus(status);
      if (data && Array.isArray(data)) {
        const mapped: HistoricalSession[] = data.map((s: any) => {
          const isExited = s.status === 'EXITED';
          const feeVal =
            typeof s.fee === 'number'
              ? s.fee
              : typeof s.parking_fee === 'number'
              ? s.parking_fee
              : calculateParkingFee(s.entry_time, s.exit_time || s.entry_time);

          const dur =
            s.duration_display ||
            s.duration ||
            formatDuration(
              calculateDurationMinutes(s.entry_time, s.exit_time || s.entry_time)
            );

          return {
            id: s.id || s.session_id,
            plate: s.vehicle_number,
            bay: s.slot_id || s.parking_slot,
            entryTime: s.entry_time,
            exitTime: isExited ? s.exit_time || 'N/A' : 'Active (Currently Parked)',
            duration: dur,
            fee: feeVal,
            method: s.payment_method || (isExited ? 'UPI QR' : 'Pending at Exit'),
            status: isExited ? 'COMPLETED' : 'ACTIVE',
          };
        });
        setRecords(mapped);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.warn('Backend history fetch error:', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        r.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.bay.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.method.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

  const completedCount = useMemo(
    () => records.filter((r) => r.status === 'COMPLETED').length,
    [records]
  );
  const activeCount = useMemo(
    () => records.filter((r) => r.status === 'ACTIVE').length,
    [records]
  );
  const availableCount = parkingStatus?.available_slots ?? 0;
  const occupiedCount = parkingStatus?.occupied_slots ?? activeCount;
  const totalSlots = parkingStatus?.total_slots ?? occupiedCount + availableCount;

  const handleExportCsv = () => {
    if (filtered.length === 0) {
      alert('No records available to export.');
      return;
    }
    const headers = [
      'Session ID',
      'Vehicle Plate',
      'Bay',
      'Entry Time',
      'Exit Time',
      'Duration',
      'Fee (INR)',
      'Payment Method',
      'Status',
    ];
    const rows = filtered.map((r) => [
      r.id,
      r.plate,
      r.bay,
      `"${r.entryTime}"`,
      `"${r.exitTime}"`,
      `"${r.duration}"`,
      r.fee.toFixed(2),
      r.method,
      r.status,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `parking_history_audit_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSyncBays = async () => {
    setSyncing(true);
    try {
      await apiService.syncSessions();
      await loadBackendHistory();
    } catch (err) {
      console.warn('Sync sessions error:', err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4 text-slate-800 select-none pb-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-900 tracking-wide">
                Historical Parking Sessions & Dynamic Tariff Audit Logs
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                RATE: ₹10/HOUR
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Complete vehicle entry, parking session, and exit records with exact duration-based billing.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] font-mono font-bold">
              <span className="px-2 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700">
                PARKED: {occupiedCount}
              </span>
              <span className="px-2 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700">
                AVAILABLE: {availableCount}
              </span>
              <span className="px-2 py-1 rounded border border-slate-200 bg-slate-50 text-slate-600">
                TOTAL BAYS: {totalSlots}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSyncBays}
            disabled={syncing || loading}
            title="Sync occupied bays — creates missing history records for all parked vehicles"
            className="flex items-center space-x-1.5 p-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-800 shadow-xs transition-all disabled:opacity-50 text-xs font-semibold px-3"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>Sync Bays</span>
          </button>

          <button
            onClick={loadBackendHistory}
            disabled={loading}
            title="Refresh History"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Report</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
        <div className="flex items-center space-x-2">
          {/* Status Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({records.length})
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'COMPLETED'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'ACTIVE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Parked ({activeCount})
            </button>
          </div>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by plate, session ID, or bay..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">SESSION ID</th>
                <th className="px-4 py-3 font-semibold">VEHICLE PLATE</th>
                <th className="px-4 py-3 font-semibold">BAY</th>
                <th className="px-4 py-3 font-semibold">ENTRY TIME</th>
                <th className="px-4 py-3 font-semibold">EXIT TIME</th>
                <th className="px-4 py-3 font-semibold">DURATION</th>
                <th className="px-4 py-3 font-semibold">DYNAMIC FEE (₹10/HR)</th>
                <th className="px-4 py-3 font-semibold">METHOD</th>
                <th className="px-4 py-3 font-semibold text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-sans">
                    Loading parking history records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-sans">
                    No matching parking history records found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-slate-500 font-medium">{r.id}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {r.plate}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-emerald-700 font-bold">{r.bay}</td>
                    <td className="px-4 py-3 text-slate-600 text-[11px]">{r.entryTime}</td>
                    <td className="px-4 py-3 text-[11px]">
                      {r.status === 'ACTIVE' ? (
                        <span className="text-blue-600 font-semibold flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-blue-500 inline" />
                          <span>Active in Bay</span>
                        </span>
                      ) : (
                        <span className="text-slate-600">{r.exitTime}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{r.duration}</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">
                      ₹{r.fee.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.method}</td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'COMPLETED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          EXITED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          PARKED
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
