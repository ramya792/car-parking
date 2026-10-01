import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  Receipt,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useParkingStore } from '../../store/parkingStore';
import { apiService } from '../../services/api';
import { calculateExitFee } from '../../utils/tariff';

interface PaymentTxn {
  id: string;
  plate: string;
  amount: number;
  method: string;
  time: string;
  status: string;
}

export const PaymentsView: React.FC = () => {
  const { kpiStats } = useParkingStore();
  const [testPlate, setTestPlate] = useState('');
  const [testDurationMinutes, setTestDurationMinutes] = useState(120);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [transactions, setTransactions] = useState<PaymentTxn[]>([]);
  const [loading, setLoading] = useState(true);
  const calculatedAmount = calculateExitFee(testDurationMinutes);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const history = await apiService.getVehicleHistory();
      if (Array.isArray(history)) {
        const completed = history.filter(
          (s: any) => s.status === 'EXITED' || s.payment_status === 'SUCCESS'
        );
        setTransactions(
          completed.map((c: any) => ({
            id: `TXN-${(c.id || c.session_id || '').replace('SES-', '')}`,
            plate: c.vehicle_number,
            amount: typeof c.fee === 'number' ? c.fee : parseFloat(c.fee) || 0,
            method: c.payment_method || 'UPI QR',
            time: c.exit_time || c.entry_time || 'Just now',
            status: 'SUCCESS',
          }))
        );
      } else {
        setTransactions([]);
      }
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return (
    <div className="space-y-4 text-slate-800 select-none pb-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-900 tracking-wide">
                Payments &amp; Automated Toll Collection Hub
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                DYNAMIC BILLING ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Payment terminal: dynamic tariff fee settlement, UPI QR verification, and real-time transaction ledger.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <button
            onClick={loadTransactions}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <span className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600">
            TODAY'S REVENUE:{' '}
            <strong className="text-amber-700 font-bold text-sm">
              ₹{kpiStats.todaysRevenue.toFixed(2)}
            </strong>
          </span>
        </div>
      </div>

      {/* Grid: Payment Tester & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Interactive Payment Verification Tester */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2 pb-3 border-b border-slate-100">
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>Interactive Dynamic UPI QR Simulator</span>
          </h2>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="text-slate-700 font-semibold mb-1 block">Vehicle Plate Number:</label>
              <input
                type="text"
                value={testPlate}
                onChange={(e) => {
                  setTestPlate(e.target.value.toUpperCase());
                  setPaidSuccess(false);
                }}
                placeholder="e.g. KA05QR8765"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-semibold">Parking Duration:</label>
                <span className="font-bold text-slate-900">{Math.floor(testDurationMinutes / 60)}h {testDurationMinutes % 60}m</span>
              </div>
              <input
                type="range"
                min="15"
                max="1440"
                step="15"
                value={testDurationMinutes}
                onChange={(e) => {
                  setTestDurationMinutes(Number(e.target.value));
                  setPaidSuccess(false);
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>System-calculated fee</span>
                <strong className="text-emerald-700 text-sm">₹{calculatedAmount.toFixed(2)}</strong>
              </div>
            </div>

            {/* Generated Dynamic QR Code Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center space-y-2 text-center">
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`upi://pay?pa=9391041599@ybl&pn=SmartParking&am=${calculatedAmount.toFixed(2)}`)}`}
                  alt="PhonePe UPI QR"
                  className="w-36 h-36 object-contain rounded-lg"
                />
              </div>

              {/* PhonePe Number Tag */}
              <div className="w-full bg-purple-50 border border-purple-200 rounded-lg p-2 text-center">
                <div className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">PhonePe Payment Number</div>
                <div className="text-sm font-mono font-extrabold text-purple-950">9391041599</div>
                <div className="text-[10px] text-purple-600 font-mono">UPI ID: 9391041599@ybl</div>
              </div>

              <div className="text-[11px] font-mono text-slate-500 break-all">
                upi://pay?pa=9391041599@ybl&amp;pn=SmartParking&amp;am={calculatedAmount.toFixed(2)}
              </div>
              <span className="text-[10px] font-bold text-purple-700">
                Scan with PhonePe • Google Pay • Paytm • BHIM UPI
              </span>
            </div>

            {/* Verification Button */}
            <div>
              {paidSuccess ? (
                <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl flex items-center space-x-2 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>Payment ₹{calculatedAmount.toFixed(2)} Received! Exit Barrier Arm Lifted.</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setPaidSuccess(true);
                    loadTransactions();
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Simulate Instant Webhook Payment Approval</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Live Payment Ledger */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Real-Time Payment Transaction Ledger</span>
            </h2>
            <button
              onClick={() => {
                if (transactions.length === 0) return;
                const csv = 'TXN_ID,VEHICLE,AMOUNT,METHOD,TIME,STATUS\n' +
                  transactions.map(t => `${t.id},${t.plate},${t.amount},${t.method},${t.time},${t.status}`).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `transactions_${Date.now()}.csv`;
                a.click();
              }}
              className="flex items-center space-x-1 text-[11px] font-mono text-slate-600 hover:text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-slate-500 border-b border-slate-200 pb-2">
                <tr>
                  <th className="pb-2">TXN ID</th>
                  <th className="pb-2">VEHICLE</th>
                  <th className="pb-2">DYNAMIC AMOUNT</th>
                  <th className="pb-2">METHOD</th>
                  <th className="pb-2">TIME</th>
                  <th className="pb-2 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Loading payment records...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                      <p className="font-semibold text-slate-500">No payment transactions recorded yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Original records will appear here as vehicles pay and exit the parking place.
                      </p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 text-slate-500">{tx.id}</td>
                      <td className="py-2.5 font-bold text-slate-900">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {tx.plate}
                        </span>
                      </td>
                      <td className="py-2.5 font-bold text-emerald-700">₹{tx.amount.toFixed(2)}</td>
                      <td className="py-2.5 text-slate-600 text-[11px] font-sans">{tx.method}</td>
                      <td className="py-2.5 text-slate-500 text-[11px]">{tx.time}</td>
                      <td className="py-2.5 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                          {tx.status}
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
    </div>
  );
};
