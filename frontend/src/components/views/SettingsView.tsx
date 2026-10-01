import React, { useState, useEffect } from 'react';
import {
  Settings,
  DollarSign,
  CheckCircle2,
  Save,
  Bot,
  Shield,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { apiService } from '../../services/api';
import { PARKING_HOURLY_RATE } from '../../utils/tariff';

export const SettingsView: React.FC = () => {
  const [hourlyRate, setHourlyRate] = useState(PARKING_HOURLY_RATE);
  const totalSlots = 20;
  const [aiSpeed, setAiSpeed] = useState(15);
  const [userRole, setUserRole] = useState<'ADMIN' | 'OPERATOR' | 'USER'>('ADMIN');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    loadTariff();
  }, []);

  const loadTariff = async () => {
    try {
      const data = await apiService.getTariff();
      if (data && typeof data.hourly_rate === 'number') {
        setHourlyRate(data.hourly_rate);
      }
    } catch (e) {
      console.warn('Failed to load current tariff from backend', e);
    }
  };

  const handleSave = async () => {
    setErrorMessage('');
    setSavedSuccess(false);
    setIsSaving(true);

    try {
      const res = await apiService.updateTariff(hourlyRate, userRole);
      if (res && res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err: any) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 403) {
        setErrorMessage(detail || '403 Forbidden: Only administrators with role ADMIN can modify system configuration.');
      } else {
        setErrorMessage(detail || err.message || 'Failed to update settings.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = userRole === 'ADMIN';

  return (
    <div className="space-y-4 text-slate-800 select-none pb-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-900 tracking-wide">
                System Configuration & Tariff Controls
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 ${
                isAdmin
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                <Shield className="w-3 h-3" />
                <span>ROLE: {userRole}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Admin controls to customize parking pricing rate, AI autonomous automation speed, and capacity limits.
            </p>
          </div>
        </div>

        {/* Role Switcher & Save Button */}
        <div className="flex items-center space-x-2">
          {/* Test Role Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-mono">
            <span className="text-slate-500 px-2 text-[10px]">Test Role:</span>
            {(['ADMIN', 'OPERATOR', 'USER'] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setUserRole(r);
                  setErrorMessage('');
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  userRole === r
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Updating...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center space-x-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Parking tariff configuration successfully updated in backend database!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center space-x-2 shadow-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tariff Rules Config */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2 pb-3 border-b border-slate-100">
            <DollarSign className="w-4 h-4 text-amber-500" />
            <span>Dynamic Tariff Pricing Rate</span>
            {!isAdmin && (
              <span className="text-[10px] text-rose-600 flex items-center gap-1 ml-auto font-medium">
                <Lock className="w-3 h-3" /> Read Only
              </span>
            )}
          </h2>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-slate-700 font-semibold mb-1 block">Parking Hourly Rate (₹ / Hour):</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                  disabled={!isAdmin}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-500 disabled:opacity-60"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-sans">
                Base hourly tariff rule applied uniformly across all 20 bays with per-minute billing precision (₹{(hourlyRate / 60).toFixed(4)}/min).
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px] text-slate-600 font-sans">
              <div className="font-semibold text-slate-800">Rate Calculation Breakdown:</div>
              <div className="flex justify-between font-mono">
                <span>1 Hour:</span>
                <span className="text-emerald-700 font-bold">₹{(hourlyRate * 1).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span>2 Hours 30 Mins:</span>
                <span className="text-emerald-700 font-bold">₹{(hourlyRate * 2.5).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span>4 Hours 30 Mins:</span>
                <span className="text-emerald-700 font-bold">₹{(hourlyRate * 4.5).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span>6 Hours 25 Mins:</span>
                <span className="text-emerald-700 font-bold">₹{((385 * hourlyRate) / 60).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Autonomous & Capacity Config */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Bot className="w-4 h-4 text-blue-600" />
            <span>Facility Capacity & Automation</span>
          </h2>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-slate-700 font-semibold mb-1 block">Total Facility Parking Capacity:</label>
              <input
                type="number"
                value={totalSlots}
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 font-bold cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-500 mt-1 font-sans">
                Fixed canonical coordinate system for 20 calibrated bays (P01 to P20).
              </p>
            </div>

            <div>
              <label className="text-slate-700 font-semibold mb-1 block">Autonomous AI Loop Frequency:</label>
              <div className="flex items-center space-x-2">
                {[10, 15, 25, 45].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => isAdmin && setAiSpeed(sec)}
                    disabled={!isAdmin}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all disabled:opacity-60 ${
                      aiSpeed === sec
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-sans">
                Controls how frequently autonomous vehicles arrive and depart.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
