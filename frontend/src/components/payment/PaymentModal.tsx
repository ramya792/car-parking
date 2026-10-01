import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  CreditCard,
  CheckCircle2,
  Clock,
  ShieldCheck,
  IndianRupee,
} from 'lucide-react';
import { apiService } from '../../services/api';
import type { PaymentReceipt, FeeCalculationResult } from '../../types/parking';
import { calculateParkingFee, PARKING_HOURLY_RATE } from '../../utils/tariff';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: {
    sessionId: string;
    vehicleNumber: string;
    slotId: string;
    vehicleType?: string;
    entryTime?: string;
    duration?: string;
    amount?: number;
    feeBreakdown?: FeeCalculationResult | null;
  } | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  sessionData,
}) => {
  const [paymentOrder, setPaymentOrder] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrError, setQrError] = useState('');
  const [serverPaymentStatus, setServerPaymentStatus] = useState('PENDING');
  const [callbackConfigured, setCallbackConfigured] = useState(true);
  const [demoConfirming, setDemoConfirming] = useState(false);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [countdown, setCountdown] = useState(300); // 5 minutes timer

  const amount =
    typeof sessionData?.amount === 'number' && sessionData.amount > 0
      ? sessionData.amount
      : sessionData?.feeBreakdown?.total_fee ||
        (sessionData?.entryTime ? calculateParkingFee(sessionData.entryTime) : 0);

  // Initialize payment order when modal opens
  useEffect(() => {
    if (isOpen && sessionData) {
      setReceipt(null);
      setPaymentOrder(null);
      setQrDataUrl('');
      setQrError('');
      setServerPaymentStatus('PENDING');
      setCallbackConfigured(true);
      setDemoConfirming(false);
      setCountdown(300);
      initOrder();
    }
  }, [isOpen, sessionData]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || receipt || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, receipt, countdown]);

  useEffect(() => {
    const payload = paymentOrder?.upi_payload;
    if (!payload) return;

    let cancelled = false;
    setQrError('');
    QRCode.toDataURL(payload, {
      width: 220,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrError('QR generation failed. Use the UPI details below.');
      });

    return () => {
      cancelled = true;
    };
  }, [paymentOrder]);

  useEffect(() => {
    if (!isOpen || !paymentOrder?.payment_id || receipt) return;

    let cancelled = false;
    const checkStatus = async () => {
      try {
        const status = await apiService.getPaymentStatus(paymentOrder.payment_id);
        if (!cancelled) {
          if (status?.status) setServerPaymentStatus(status.status);
          if (typeof status?.callback_configured === 'boolean') {
            setCallbackConfigured(status.callback_configured);
          }
        }
      } catch {
        // The WebSocket callback remains the live approval path if polling is unavailable.
      }
    };

    checkStatus();
    const timer = setInterval(checkStatus, 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isOpen, paymentOrder, receipt]);

  const initOrder = async () => {
    if (!sessionData) return;
    try {
      const order = await apiService.createPayment({
        session_id: sessionData.sessionId,
        vehicle_number: sessionData.vehicleNumber,
        amount: amount,
      });
      setPaymentOrder(order);
    } catch (e) {
      console.error('Failed to create payment order:', e);
      // Fallback order with exact dynamic amount
      const mockPayId = `PAY-${Date.now()}`;
      const upi = `upi://pay?pa=9391041599@ybl&pn=SmartParking&am=${amount.toFixed(2)}&cu=INR&tr=${sessionData.sessionId}`;
      setPaymentOrder({
        payment_id: mockPayId,
        session_id: sessionData.sessionId,
        vehicle_number: sessionData.vehicleNumber,
        amount: amount,
        currency: 'INR',
        upi_payload: upi,
        qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upi)}`,
        phone_number: '9391041599',
        upi_id: '9391041599@ybl',
        status: 'PENDING',
        message: 'PhonePe QR code ready for 9391041599.',
      });
    }
  };

  const confirmDemoPayment = async () => {
    if (!paymentOrder?.payment_id || !sessionData || demoConfirming) return;
    setDemoConfirming(true);
    try {
      await apiService.confirmDemoPayment({
        payment_id: paymentOrder.payment_id,
        session_id: paymentOrder.session_id || sessionData.sessionId,
      });
    } catch (error) {
      console.error('Demo payment confirmation failed:', error);
    } finally {
      setDemoConfirming(false);
    }
  };

  if (!isOpen || !sessionData) return null;

  const timerMins = Math.floor(countdown / 60);
  const timerSecs = countdown % 60;
  const timerDisplay = `${timerMins.toString().padStart(2, '0')}:${timerSecs.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-950 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header Bar */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Smart Parking Dynamic Payment Gateway
                </h2>
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>256-BIT SSL ENCRYPTED</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Scan the PhonePe QR code to complete payment before the exit gate is released.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Column: Payment Method & Dynamic QR Interface */}
          <div className="flex-1 p-5 flex flex-col justify-between border-r border-slate-800 bg-slate-950/80 overflow-y-auto">
            {receipt ? (
              /* Success Receipt View */
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Payment Verified & Approved</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Payment successfully completed. The exit gate will open after you proceed.
                  </p>
                </div>

                <div className="w-full max-w-sm bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs space-y-2 text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transaction ID:</span>
                    <span className="font-mono font-bold text-white">{receipt.payment_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vehicle:</span>
                    <span className="font-mono font-bold text-amber-400">{receipt.vehicle_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount Paid:</span>
                    <span className="font-mono font-bold text-emerald-400">₹{receipt.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Exit Barrier:</span>
                    <span className="font-mono font-bold text-blue-400">{receipt.barrier_arm}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Timestamp:</span>
                    <span className="font-mono text-slate-300">{receipt.payment_time}</span>
                  </div>
                </div>

                <p className="text-xs font-semibold text-emerald-300">
                  Exit gate opening automatically...
                </p>
              </div>
            ) : (
              /* Active Payment Options View */
              <div className="space-y-4">
                {/* PhonePe QR Payment */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="flex items-center justify-between w-full text-xs text-slate-400 px-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Session Expiry:
                      </span>
                      <span className="font-mono font-bold text-amber-400">{timerDisplay}</span>
                    </div>

                    {/* QR Code Container */}
                    <div className="p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-slate-800">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="Dynamic UPI QR"
                          className="w-44 h-44 object-contain"
                        />
                      ) : (
                        <div className="w-44 h-44 flex flex-col gap-2 items-center justify-center text-slate-900 font-mono text-xs text-center">
                          <span>{qrError || `Generating QR (₹${amount.toFixed(2)})...`}</span>
                          {qrError && paymentOrder?.upi_id && (
                            <span className="font-bold break-all">{paymentOrder.upi_id}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-300 font-semibold">
                      PhonePe QR Scanner
                    </div>
                    {paymentOrder?.upi_id && (
                      <div className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-left text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Pay to:</span>
                          <span className="font-bold text-white">Smart Parking</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">UPI ID:</span>
                          <span className="font-mono font-bold text-blue-300">{paymentOrder.upi_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Amount:</span>
                          <span className="font-mono font-bold text-emerald-400">₹{amount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary & Checkout Action */}
          <div className="w-80 p-5 flex flex-col justify-between bg-slate-900/40 overflow-y-auto space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Settlement Details
                </h3>

                {/* Vehicle Plate Badge */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px]">License Plate</span>
                    <span className="bg-slate-900 border border-slate-700 px-2.5 py-0.5 rounded font-mono font-extrabold text-sm text-white tracking-wider">
                      {sessionData.vehicleNumber}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Bay / Slot:</span>
                    <span className="font-mono font-bold text-blue-400">{sessionData.slotId}</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Duration Parked:</span>
                    <span className="font-mono text-amber-400 font-semibold">
                      {sessionData.duration || '2h 15m'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="text-[11px] font-semibold text-slate-300 pb-1.5 border-b border-slate-800">
                  Dynamic Tariff Breakdown
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Hourly Rate:</span>
                  <span className="font-mono text-slate-200">
                    ₹{PARKING_HOURLY_RATE}.00 / hr
                  </span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Stay Duration:</span>
                  <span className="font-mono text-slate-200">
                    {sessionData.duration || '2h 15m'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="font-bold text-white uppercase text-xs">Total Parking Fee:</span>
                  <span className="font-mono font-extrabold text-lg text-emerald-400 flex items-center">
                    <IndianRupee className="w-4 h-4" />
                    {amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Pay Trigger Button */}
            {!receipt && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-center text-xs font-semibold text-amber-300 bg-amber-950/40 border border-amber-800 rounded-lg px-3 py-2">
                  {!callbackConfigured
                    ? 'Payment callback is not configured. The system cannot verify this UPI payment or open the gate automatically.'
                    : serverPaymentStatus === 'SUCCESS'
                    ? 'Payment verified by the server. Waiting for the live gate approval event.'
                    : 'Waiting for PhonePe payment confirmation. The exit gate stays closed until the signed provider callback is received.'}
                </div>

                {!callbackConfigured && (
                  <button
                    onClick={confirmDemoPayment}
                    disabled={demoConfirming || !paymentOrder}
                    className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold transition-colors"
                  >
                    {demoConfirming ? 'Exiting...' : 'Payment Done - Exit'}
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="w-full py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
