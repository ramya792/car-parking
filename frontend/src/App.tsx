import { useEffect, useState, useCallback } from 'react';
import { ParkingCanvas } from './components/three/ParkingCanvas';
import type { ExitPaymentRequest } from './components/three/ParkingCanvas';
import { useParkingStore } from './store/parkingStore';
import { EntryManagementModal } from './components/entry/EntryManagementModal';
import { AddCarModal } from './components/entry/AddCarModal';
import { ParkingAreaCameraModal } from './components/cameras/ParkingAreaCameraModal';
import { ExitManagementModal } from './components/exit/ExitManagementModal';
import { TariffCalculatorModal } from './components/billing/TariffCalculatorModal';
import { PaymentModal } from './components/payment/PaymentModal';
import { AnalyticsDashboardModal } from './components/dashboard/AnalyticsDashboardModal';
import { SidebarNav } from './components/layout/SidebarNav';
import { TopStatsRow } from './components/dashboard/TopStatsRow';
import { BottomWidgetsRow } from './components/dashboard/BottomWidgetsRow';

// Dedicated Admin Concept Testing Views
import { LiveMonitoringView } from './components/views/LiveMonitoringView';
import { Parking3DView } from './components/views/Parking3DView';
import { VehiclesView } from './components/views/VehiclesView';
import { EntryManagementView } from './components/views/EntryManagementView';
import { ExitManagementView } from './components/views/ExitManagementView';
import { PaymentsView } from './components/views/PaymentsView';
import { ParkingHistoryView } from './components/views/ParkingHistoryView';
import { ReportsView } from './components/views/ReportsView';
import { CamerasView } from './components/views/CamerasView';
import { SettingsView } from './components/views/SettingsView';

import type { CameraPreset } from './components/three/CameraRig';
import { apiService } from './services/api';
import { calculateExitFee, PARKING_HOURLY_RATE } from './utils/tariff';

import {
  Search,
  Bell,
  Calendar,
  RotateCcw,
  CarFront,
  LogOut,
  DoorOpen,
  X,
  AlertCircle,
  ShieldCheck,
  Plus,
} from 'lucide-react';

export function App() {
  const {
    slots,
    kpiStats,
    entryGateOpen,
    exitGateOpen,
    selectSlot,
    updateSlotStatus,
    setEntryGateOpen,
    setExitGateOpen,
    fetchBackendData,
    initWebSocket,
    lastPaymentSuccess,
    clearPaymentSuccess,
    resetFacility,
  } = useParkingStore();

  const [, setSelectedCamera] = useState<string | null>(null);
  const [activeCameraPreset, setActiveCameraPreset] = useState<CameraPreset>('DEFAULT');
  const [timeOfDay, setTimeOfDay] = useState<'DAY' | 'NIGHT'>('DAY');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isAddCarModalOpen, setIsAddCarModalOpen] = useState(false);
  const [selectedSlotForAdd, setSelectedSlotForAdd] = useState<string | null>(null);
  const [isCam02ModalOpen, setIsCam02ModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [paymentSession, setPaymentSession] = useState<any>(null);
  const [pendingPaymentApproval, setPendingPaymentApproval] = useState<(() => void) | null>(null);
  const [entryAnimation, setEntryAnimation] = useState<any>(null);
  const [exitAnimation, setExitAnimation] = useState<any>(null);

  // User Ingress CCTV HUD and Parked Car Exit Confirmation state
  const [entryFeedback, setEntryFeedback] = useState<{
    type: 'SUCCESS' | 'ERROR';
    title: string;
    plate?: string;
    slotId?: string;
    entryTime?: string;
    vacanciesLeft?: number;
    message: string;
  } | null>(null);

  const [selectedExitSlot, setSelectedExitSlot] = useState<any | null>(null);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [slotNumberInput, setSlotNumberInput] = useState('');

  const [clockString, setClockString] = useState<string>('Sun, 28 Sep 2026  08:42 PM');
  const [hourlyRate, setHourlyRate] = useState(PARKING_HOURLY_RATE);

  // Live clock synchronization
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timePart = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      setClockString(`${datePart}  ${timePart}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleFocusCamera3D = useCallback((target: string) => {
    const upper = target.toUpperCase();
    let preset: CameraPreset = 'DEFAULT';
    let name = target;

    if (upper === 'TOP' || upper === 'CAM_02' || upper.includes('TOP')) {
      preset = 'TOP';
      name = 'CAM Top — Overhead Lot';
    } else if (upper === 'NORTH' || upper === 'CAM_04' || upper.includes('NORTH')) {
      preset = 'NORTH';
      name = 'CAM North — North Wing (P01-P10)';
    } else if (upper === 'SOUTH' || upper === 'CAM_05' || upper.includes('SOUTH')) {
      preset = 'SOUTH';
      name = 'CAM South — South Wing (P11-P20)';
    } else if (upper === 'EAST' || upper === 'CAM_03' || upper.includes('EAST')) {
      preset = 'EAST';
      name = 'CAM East — Exit Gate';
    } else if (upper === 'WEST' || upper === 'CAM_01' || upper.includes('WEST')) {
      preset = 'WEST';
      name = 'CAM West — Entrance Gate';
    } else {
      preset = 'DEFAULT';
      name = '3D Perspective View';
    }

    setActiveCameraPreset(preset);
    setSelectedCamera(name);
  }, []);

  // Initialize data from FastAPI Backend & WebSocket on mount
  useEffect(() => {
    fetchBackendData();
    const cleanupWs = initWebSocket();
    apiService.getTariff().then((data) => {
      if (typeof data?.hourly_rate === 'number') setHourlyRate(data.hourly_rate);
    }).catch(() => undefined);
    return () => {
      cleanupWs();
    };
  }, [fetchBackendData, initWebSocket]);

  useEffect(() => {
    if (!lastPaymentSuccess || !pendingPaymentApproval) return;
    if (paymentSession?.sessionId && lastPaymentSuccess.session_id !== paymentSession.sessionId) return;

    const approvePayment = pendingPaymentApproval;
    setPendingPaymentApproval(null);
    setIsPaymentModalOpen(false);
    clearPaymentSuccess();
    approvePayment();
  }, [clearPaymentSuccess, lastPaymentSuccess, paymentSession, pendingPaymentApproval]);

  const totalCount = kpiStats.totalSlots || 20;
  const occupiedCount = slots.length > 0 ? slots.filter((s) => s.status === 'OCCUPIED').length : kpiStats.occupiedSlots;
  const availableCount = slots.length > 0 ? slots.filter((s) => s.status === 'AVAILABLE').length : kpiStats.availableSlots;
  const occupancyPercent = totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 70;

  // Handle live vehicle arrival via Entry Modal and animate 3D car movement
  const handleEntryRegistered = useCallback((assignedSlotId: string, vehicleData: any) => {
    const slot = slots.find((s) => s.id === assignedSlotId);
    if (!slot) return;

    setEntryGateOpen(true);

    setEntryAnimation({
      plateNumber: vehicleData.plateNumber,
      vehicleType: vehicleData.vehicleType,
      color: vehicleData.color,
      targetSlotId: assignedSlotId,
      targetPosition: slot.position,
      targetRotation: slot.rotation,
      onComplete: () => {
        setEntryAnimation(null);
        setEntryGateOpen(false);
        updateSlotStatus(assignedSlotId, 'OCCUPIED', {
          plateNumber: vehicleData.plateNumber,
          vehicleType: vehicleData.vehicleType,
          color: vehicleData.color,
          entryTime: 'Just Now',
          duration: '0h 01m',
          sessionId: vehicleData.sessionId || `SES-${Date.now()}`,
          confidence: 0.98,
        });
      },
    });
  }, [slots, setEntryGateOpen, updateSlotStatus]);

  // Handle live vehicle departure via Exit Modal and animate 3D car movement out of lot
  const handleExitApproved = useCallback((slotId: string, vehicleData: any) => {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return;

    void updateSlotStatus(slotId, 'AVAILABLE').then(() => fetchBackendData());

    setExitAnimation({
      plateNumber: vehicleData.plateNumber,
      vehicleType: vehicleData.vehicleType,
      color: vehicleData.color,
      sourceSlotId: slotId,
      sourcePosition: slot.position,
      sourceRotation: slot.rotation,
      onBarrierOpen: () => setExitGateOpen(true),
      onBarrierClose: () => setExitGateOpen(false),
      onComplete: () => {
        setExitAnimation(null);
        setExitGateOpen(false);
      },
    });
  }, [fetchBackendData, hourlyRate, slots, updateSlotStatus, setExitGateOpen]);

  // Legacy ingress helper retained for backend-driven entry events.
  const handleUserIncomingCar = useCallback(async () => {
    // Check vacancies from 20 calibrated bays
    const availableSlots = slots.filter((s) => s.status === 'AVAILABLE');
    if (availableSlots.length === 0) {
      setEntryFeedback({
        type: 'ERROR',
        title: '🚫 PARKING LOT FULL (20/20 BAYS OCCUPIED)',
        message: 'All 20 calibrated bays are occupied. Please click on any parked car to exit it first.',
      });
      setTimeout(() => setEntryFeedback(null), 5000);
      return;
    }

    // Allocate first vacant bay
    const assignedSlot = availableSlots[0];

    // Read / recognize incoming vehicle plate
    const platePool = [
      'KA05QR8765', 'AP39AB1234', 'TS09CD5678', 'MH12IJ5432',
      'DL03GH9876', 'TN09OP4321', 'KL07MN8765', 'HR26DK9012',
      'GJ01AB9988', 'UP32CD1122', 'WB02EF3344', 'RJ14GH5566'
    ];
    const currentlyParkedPlates = slots
      .filter((s) => s.status === 'OCCUPIED' && s.currentVehicle)
      .map((s) => s.currentVehicle!.plateNumber.toUpperCase());
    const availablePlates = platePool.filter((p) => !currentlyParkedPlates.includes(p));
    const vehiclePlate = availablePlates.length > 0
      ? availablePlates[0]
      : `IND${Math.floor(1000 + Math.random() * 9000)}`;

    const colors = ['#2563eb', '#dc2626', '#10b981', '#f59e0b', '#7c3aed', '#0f172a', '#475569'];
    const carColor = colors[Math.floor(Math.random() * colors.length)];
    const vehicleTypes = ['SEDAN', 'SUV', 'HATCHBACK'] as const;
    const carType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];

    const now = new Date();
    const entryTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const fullDateStr = now.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
    const entryTimestamp = `${fullDateStr} ${entryTimeStr}`;

    // Display CCTV Ingress HUD on screen
    setEntryFeedback({
      type: 'SUCCESS',
      title: '📷 CCTV INGRESS: VEHICLE CAPTURED & SCANNED',
      plate: vehiclePlate,
      slotId: assignedSlot.id,
      entryTime: entryTimestamp,
      vacanciesLeft: availableSlots.length - 1,
      message: `ANPR Read: ${vehiclePlate} • Allocated: Bay ${assignedSlot.id} • Vacancies: ${availableSlots.length - 1} Remaining`,
    });
    setTimeout(() => setEntryFeedback(null), 5000);

    // Register in backend database
    let sessionId: string | undefined;
    try {
      const response = await apiService.registerEntry(vehiclePlate, carType, carColor, assignedSlot.id);
      sessionId = response?.session_id || response?.sessionId;
    } catch (e) {
      console.warn('Backend entry sync notice:', e);
    }

    // Trigger smooth 3D entry animation: barrier arm lifts, car drives into assigned bay
    handleEntryRegistered(assignedSlot.id, {
      plateNumber: vehiclePlate,
      vehicleType: carType,
      color: carColor,
      entryTime: entryTimestamp,
      sessionId,
    });
  }, [slots, handleEntryRegistered]);

  // 2. User Controlled Ingress / Egress: Triggered when user clicks on any bay or parked car
  const handleSlotClick = useCallback((slotId: string) => {
    selectSlot(slotId);
    setSlotNumberInput(slotId);
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return;

    if (slot.status === 'OCCUPIED' && slot.currentVehicle) {
      // User clicked on a parked car -> open exit clearance modal!
      setSelectedExitSlot(slot);
      setIsExitConfirmOpen(true);
    } else if (slot.status === 'AVAILABLE') {
      // User clicked on a vacant slot -> open custom Add Car modal for this bay!
      setSelectedSlotForAdd(slotId);
      setIsAddCarModalOpen(true);
    }
  }, [slots, selectSlot]);

  // Confirm vehicle departure: lifts exit boom barrier, car drives out, slot becomes available
  const confirmVehicleExit = async () => {
    if (!selectedExitSlot || !selectedExitSlot.currentVehicle) return;
    const slotId = selectedExitSlot.id;
    const vehicle = selectedExitSlot.currentVehicle;
    setIsExitConfirmOpen(false);

    handleOpenPayment({
      sessionId: vehicle.sessionId || `SES-${slotId}`,
      vehicleNumber: vehicle.plateNumber,
      slotId,
      vehicleType: vehicle.vehicleType || 'SEDAN',
      entryTime: vehicle.entryTime,
      amount: calculateExitFee(vehicle.entryTime, undefined, hourlyRate),
      duration: vehicle.duration,
    }, () => {
      handleExitApproved(slotId, {
        plateNumber: vehicle.plateNumber,
        vehicleType: vehicle.vehicleType || 'SEDAN',
        color: vehicle.color || '#dc2626',
      });
      setSelectedExitSlot(null);
    });
  };

  const requestSouthExit = useCallback((requestedSlot?: string) => {
    const normalizedSlot = requestedSlot?.trim().toUpperCase();
    const slotId = normalizedSlot
      ? /^\d{1,2}$/.test(normalizedSlot)
        ? `P${normalizedSlot.padStart(2, '0')}`
        : normalizedSlot
      : undefined;
    const requestedVehicle = slotId
      ? slots.find((slot) => slot.id === slotId && slot.status === 'OCCUPIED' && slot.currentVehicle)
      : undefined;
    const southVehicle = slots.find((slot) => slot.row === 'BOTTOM' && slot.status === 'OCCUPIED' && slot.currentVehicle);
    const occupiedVehicle = requestedVehicle || (slotId ? undefined : southVehicle) || (!slotId ? slots.find((slot) => slot.status === 'OCCUPIED' && slot.currentVehicle) : undefined);

    if (!occupiedVehicle) {
      setEntryFeedback({
        type: 'ERROR',
        title: 'VEHICLE NOT FOUND',
        message: slotId ? `No occupied vehicle was found in slot ${slotId}.` : 'There are no occupied slots to remove.',
      });
      setTimeout(() => setEntryFeedback(null), 4000);
      return;
    }

    selectSlot(occupiedVehicle.id);
    setSelectedExitSlot(occupiedVehicle);
    setIsExitConfirmOpen(true);
  }, [selectSlot, slots]);

  const handleOpenPayment = (session: any, onPaymentSuccess?: () => void) => {
    if (!session) return;
    const amount = session.amount ?? calculateExitFee(session.entryTime || 0, undefined, hourlyRate);
    setPaymentSession({
      sessionId: session.sessionId,
      vehicleNumber: session.vehicleNumber,
      amount,
      slotId: session.slotId,
      vehicleType: session.vehicleType,
      entryTime: session.entryTime,
      duration: session.duration,
    });
    setPendingPaymentApproval(() => onPaymentSuccess || (() => {
      handleExitApproved(session.slotId, {
        plateNumber: session.vehicleNumber,
        vehicleType: session.vehicleType || 'SEDAN',
        color: session.color || '#3b82f6',
      });
    }));
    setIsPaymentModalOpen(true);
  };

  const handleRequestExitPayment = useCallback(
    (request: ExitPaymentRequest, approvePayment: () => void) => {
      setPaymentSession({
        sessionId: request.sessionId,
        vehicleNumber: request.plateNumber,
        slotId: request.slotId,
        entryTime: request.entryTime,
        duration: request.duration,
        amount: request.fee,
      });
      setPendingPaymentApproval(() => approvePayment);
      setIsPaymentModalOpen(true);
    },
    []
  );

  const isDay = true;

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-[#f8fafc] text-slate-800">
      {/* Exact Left Navigation Sidebar */}
      <SidebarNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        timeOfDay="DAY"
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto px-6 py-4 space-y-4">
        
        {/* Top Header Bar */}
        <header className="flex items-center justify-between pb-1">
          {/* Search Bar */}
          <div className="relative w-80 lg:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search vehicle number, slot, etc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500 shadow-sm border transition-all bg-white border-slate-200 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center space-x-2.5 select-none">
            {/* Add Car */}
            <button
              onClick={handleUserIncomingCar}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Add one vehicle through automatic entry workflow"
            >
              <CarFront className="w-4 h-4" />
              <span>Add Car</span>
            </button>

            {/* Select Slot Number Dropdown & Action Controls */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
              <select
                value={slotNumberInput}
                onChange={(e) => {
                  const chosen = e.target.value;
                  setSlotNumberInput(chosen);
                  if (chosen) {
                    selectSlot(chosen);
                    const slot = slots.find((s) => s.id === chosen);
                    if (slot?.status === 'AVAILABLE') {
                      setSelectedSlotForAdd(chosen);
                      setIsAddCarModalOpen(true);
                    } else if (slot?.status === 'OCCUPIED' && slot.currentVehicle) {
                      setSelectedExitSlot(slot);
                      setIsExitConfirmOpen(true);
                    }
                  }
                }}
                className="w-36 bg-transparent px-2 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer border-0"
                aria-label="Select Slot Number"
              >
                <option value="">Select Slot...</option>
                {slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.status === 'AVAILABLE' ? 'Vacant' : 'Occupied'}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  const slotId = slotNumberInput || (slots.find((s) => s.status === 'AVAILABLE')?.id ?? 'P01');
                  setSelectedSlotForAdd(slotId);
                  setIsAddCarModalOpen(true);
                }}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                title={slotNumberInput ? `Add vehicle to slot ${slotNumberInput}` : 'Add vehicle to selected slot'}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>

              <button
                onClick={() => {
                  requestSouthExit(slotNumberInput);
                  setSlotNumberInput('');
                }}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                title="Remove one parked vehicle"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>

            {/* Clean Lot to 0 Button */}
            <button
              onClick={() => resetFacility()}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Reset all 20 bays to 0 (Vacant)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Lot (0)</span>
            </button>

            {/* Notification Bell */}
            <div className="relative p-2 rounded-xl border cursor-pointer transition-colors bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-blue-500 absolute top-1.5 right-1.5" />
            </div>

            {/* Date & Time Widget */}
            <div className="flex items-center space-x-2 border px-3 py-2 rounded-xl font-mono text-xs shadow-sm bg-white border-slate-200 text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{clockString}</span>
            </div>
          </div>
        </header>

        {/* ===================== VIEW ROUTING ===================== */}

        {/* 1. Dashboard View (Default main view) */}
        {activeTab === 'dashboard' && (
          <>
            {/* Row of 5 Stat Cards */}
            <TopStatsRow
              totalSlots={totalCount}
              occupiedSlots={occupiedCount}
              availableSlots={availableCount}
              occupancyPercentage={occupancyPercent}
              todaysVehicles={kpiStats.todaysVehicles ?? 0}
              todaysRevenue={kpiStats.todaysRevenue ?? 0}
              timeOfDay={timeOfDay}
            />

            {/* Middle Section: Viewport on Left (75%), Cameras on Right (25%) */}
            <div className="grid grid-cols-12 gap-3.5 flex-1 min-h-[430px]">
              <div className={`col-span-12 h-full min-h-[430px] rounded-xl overflow-hidden shadow-lg border ${
                isDay ? 'border-slate-300 bg-white' : 'border-slate-800 bg-black'
              }`}>
                <ParkingCanvas
                  isEntryGateOpen={entryGateOpen}
                  isExitGateOpen={exitGateOpen}
                  timeOfDay={timeOfDay}
                  onToggleTimeOfDay={() => setTimeOfDay(timeOfDay === 'DAY' ? 'NIGHT' : 'DAY')}
                  entryAnimationData={entryAnimation}
                  exitingAnimationData={exitAnimation}
                  activeCameraPreset={activeCameraPreset}
                  onPresetChange={(preset) => {
                    setActiveCameraPreset(preset);
                    if (preset === 'DEFAULT') setSelectedCamera(null);
                    else if (preset === 'TOP') setSelectedCamera('CAM Top — Overhead Lot');
                    else if (preset === 'NORTH') setSelectedCamera('CAM North — North Wing (P01-P10)');
                    else if (preset === 'SOUTH') setSelectedCamera('CAM South — South Wing (P11-P20)');
                    else if (preset === 'EAST') setSelectedCamera('CAM East — Exit Gate');
                    else if (preset === 'WEST') setSelectedCamera('CAM West — Entrance Gate');
                  }}
                  onSelectCamera={(id: string, name?: string, direction?: string) => {
                    const camName = name || id;
                    setSelectedCamera(camName);
                    if (direction) {
                      handleFocusCamera3D(direction);
                    } else {
                      handleFocusCamera3D(id);
                    }
                  }}
                  onRequestExitPayment={handleRequestExitPayment}
                  onSlotSelect={(slotId) => handleSlotClick(slotId)}
                />
              </div>

            </div>

            {/* Bottom Row: 4 Panels */}
            <BottomWidgetsRow
              occupiedCount={occupiedCount}
              availableCount={availableCount}
              reservedCount={0}
              occupancyPercent={occupancyPercent}
              todaysRevenue={kpiStats.todaysRevenue ?? 0}
              onViewAllEntries={() => setActiveTab('vehicles')}
              onSlotClick={(slotId) => handleSlotClick(slotId)}
              timeOfDay={timeOfDay}
            />
          </>
        )}

        {/* 2. Live Monitoring View */}
        {activeTab === 'live-monitoring' && (
          <LiveMonitoringView
            onOpenCamModal={() => setIsCam02ModalOpen(true)}
            onFocusGate={(dir) => handleFocusCamera3D(dir)}
            entryAnimationData={entryAnimation}
          />
        )}

        {/* 3. Dedicated 3D Digital Twin View */}
        {activeTab === 'parking-3d' && (
          <Parking3DView
            isEntryGateOpen={entryGateOpen}
            isExitGateOpen={exitGateOpen}
            timeOfDay={timeOfDay}
            onToggleTimeOfDay={() => setTimeOfDay(timeOfDay === 'DAY' ? 'NIGHT' : 'DAY')}
            entryAnimationData={entryAnimation}
            exitingAnimationData={exitAnimation}
            activeCameraPreset={activeCameraPreset}
            onPresetChange={(preset) => setActiveCameraPreset(preset)}
            onSouthExitRequest={requestSouthExit}
            onSlotSelect={(slotId) => handleSlotClick(slotId)}
            onRequestExitPayment={handleRequestExitPayment}
          />
        )}

        {/* 4. Active Vehicles Registry */}
        {activeTab === 'vehicles' && (
          <VehiclesView
            onOpenEntryModal={() => setActiveTab('entry-mgmt')}
            onOpenExitModal={() => setActiveTab('exit-mgmt')}
            onSelectSlot={(slotId) => {
              selectSlot(slotId);
              setActiveTab('parking-3d');
            }}
          />
        )}

        {/* 5. Entry Management Console */}
        {activeTab === 'entry-mgmt' && (
          <EntryManagementView
            onRegisterEntry={handleEntryRegistered}
            onFocusGate={(dir) => handleFocusCamera3D(dir)}
            onNavigateTo3D={(slotId) => {
              if (slotId) selectSlot(slotId);
              handleFocusCamera3D('WEST');
              setActiveTab('parking-3d');
            }}
          />
        )}

        {/* 6. Exit Management Console */}
        {activeTab === 'exit-mgmt' && (
          <ExitManagementView
            onProcessExit={handleExitApproved}
            onOpenPaymentModal={handleOpenPayment}
            hourlyRate={hourlyRate}
            exitingAnimationData={exitAnimation}
          />
        )}

        {/* 7. Payments Testing & Ledger */}
        {activeTab === 'payments' && <PaymentsView />}

        {/* 8. Parking History */}
        {activeTab === 'history' && <ParkingHistoryView />}

        {/* 9. Analytics Reports */}
        {activeTab === 'reports' && <ReportsView />}

        {/* 10. Cameras Fleet */}
        {activeTab === 'cameras' && <CamerasView />}

        {/* 11. Settings Configuration */}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Custom Add Car To Wish & Slot Modal */}
      <AddCarModal
        isOpen={isAddCarModalOpen}
        onClose={() => {
          setIsAddCarModalOpen(false);
          setSelectedSlotForAdd(null);
        }}
        defaultSlotId={selectedSlotForAdd}
        onAddCar={handleEntryRegistered}
      />

      {/* Preserved Modals */}
      <EntryManagementModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        onEntryRegistered={handleEntryRegistered}
      />

      <ParkingAreaCameraModal
        isOpen={isCam02ModalOpen}
        onClose={() => setIsCam02ModalOpen(false)}
        onSelectSlot={(slotId) => selectSlot(slotId)}
      />

      <ExitManagementModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onExitApproved={handleExitApproved}
        onOpenPayment={handleOpenPayment}
      />

      <TariffCalculatorModal
        isOpen={isTariffModalOpen}
        onClose={() => setIsTariffModalOpen(false)}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        sessionData={paymentSession}
      />

      <AnalyticsDashboardModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
      />

      {/* User-Triggered Parked Car Exit Confirmation Modal */}
      {isExitConfirmOpen && selectedExitSlot?.currentVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs select-none">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <DoorOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Vehicle Departure Request</h3>
                  <p className="text-xs text-slate-500">Clicked Parked Car in Bay {selectedExitSlot.id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsExitConfirmOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Vehicle Details Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500">Vehicle Plate:</span>
                <span className="font-mono font-bold text-sm bg-slate-900 text-amber-300 px-3 py-1 rounded-md border border-slate-700 shadow-xs">
                  {selectedExitSlot.currentVehicle.plateNumber}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Allocated Bay:</span>
                <span className="font-bold text-slate-800 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                  {selectedExitSlot.id} ({selectedExitSlot.row || 'BAY'})
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Entry Timestamp:</span>
                <span className="font-mono text-slate-700">{selectedExitSlot.currentVehicle.entryTime || 'Today'}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Exit Timestamp:</span>
                <span className="font-mono text-slate-700">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Dynamic Parking Tariff</span>
                  <span className="text-[10px] text-slate-500">Rate: ₹10/Hour Dynamic</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-rose-600 font-mono">₹10.00</span>
                  <span className="text-[10px] text-emerald-600 font-semibold block">✓ Auto-Cleared</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center space-x-3 pt-1">
              <button
                type="button"
                onClick={() => setIsExitConfirmOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmVehicleExit}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <DoorOpen className="w-4 h-4" />
                <span>Release & Exit Car</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CCTV ANPR Ingress Floating HUD Banner */}
      {entryFeedback && (
        <div className="fixed top-20 right-8 z-50 animate-in slide-in-from-top-4 duration-300 pointer-events-none select-none">
          <div className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-md max-w-sm pointer-events-auto ${
            entryFeedback.type === 'ERROR'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-white/95 border-emerald-300 text-slate-900'
          }`}>
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-xl shrink-0 ${
                entryFeedback.type === 'ERROR' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {entryFeedback.type === 'ERROR' ? <AlertCircle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black tracking-wide">{entryFeedback.title}</h4>
                {entryFeedback.plate && (
                  <div className="flex items-center space-x-2 pt-0.5">
                    <span className="font-mono text-xs font-bold bg-slate-900 text-amber-300 px-2 py-0.5 rounded border border-slate-700">
                      {entryFeedback.plate}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Bay: {entryFeedback.slotId}
                    </span>
                  </div>
                )}
                <p className="text-[11px] text-slate-600 leading-snug">{entryFeedback.message}</p>
                {entryFeedback.entryTime && (
                  <p className="text-[10px] font-mono text-slate-400">Captured: {entryFeedback.entryTime}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
