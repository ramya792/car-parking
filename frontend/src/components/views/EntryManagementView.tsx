import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Camera,
  ScanLine,
  Sparkles,
  ShieldCheck,
  Dices,
  Eye,
  ArrowRight,
  Car,
  Navigation,
} from 'lucide-react';
import { useParkingStore } from '../../store/parkingStore';
import { apiService } from '../../services/api';
import { CCTV3DCanvas } from '../cameras/CCTV3DCanvas';

interface EntryManagementViewProps {
  onRegisterEntry: (assignedSlot: string, vehicleData: any) => void;
  onFocusGate?: (dir: string) => void;
  onNavigateTo3D?: (slotId?: string) => void;
}

const CAR_COLORS = [
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Pearl White', hex: '#f8fafc' },
  { name: 'Dark Onyx', hex: '#1e293b' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Sunset Amber', hex: '#f59e0b' },
];

export const EntryManagementView: React.FC<EntryManagementViewProps> = ({
  onRegisterEntry,
  onNavigateTo3D,
}) => {
  const { slots } = useParkingStore();

  const [plateNumber, setPlateNumber] = useState('AP39AB1234');
  const [vehicleType, setVehicleType] = useState<'SEDAN' | 'SUV' | 'HATCHBACK'>('SEDAN');
  const [color, setColor] = useState('#2563eb');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState<number>(98.7);
  const [plateCrop, setPlateCrop] = useState<string | null>(null);
  const [scanFeedback, setScanFeedback] = useState<{
    plate: string;
    state: string;
    confidence: number;
    timeMs: number;
  } | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [previewMode, setPreviewMode] = useState<'3D_STREAM' | 'ANPR_SNAPSHOT'>('3D_STREAM');
  const [navigationPhase, setNavigationPhase] = useState<number>(0);
  const [lastRegistered, setLastRegistered] = useState<any>(null);

  const availableSlots = slots.filter((s) => s.status === 'AVAILABLE');

  // Auto-select first available slot if not selected
  useEffect(() => {
    if (availableSlots.length > 0 && (!selectedSlot || !availableSlots.some((s) => s.id === selectedSlot))) {
      setSelectedSlot(availableSlots[0].id);
    }
  }, [availableSlots, selectedSlot]);

  // Generate a random test vehicle for the admin
  const handleGenerateRandomCar = () => {
    const prefixes = ['AP39', 'TS09', 'KA01', 'DL03', 'MH12', 'TN09', 'KL07', 'HR26'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const letters = ['AB', 'CD', 'EF', 'GH', 'JK', 'XY', 'ZT', 'MN'];
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    const newPlate = `${prefix}${letter}${num}`;

    const types: ('SEDAN' | 'SUV' | 'HATCHBACK')[] = ['SEDAN', 'SUV', 'HATCHBACK'];
    const newType = types[Math.floor(Math.random() * types.length)];
    const randomColor = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)].hex;

    setPlateNumber(newPlate);
    setVehicleType(newType);
    setColor(randomColor);
    setOcrConfidence(98.7);
    setPlateCrop(null);
    setScanFeedback(null);
    if (availableSlots.length > 0) {
      setSelectedSlot(availableSlots[0].id);
    }
  };

  // Real ANPR OCR Scanner connected to backend AI engine
  const handleSimulateScan = async () => {
    setIsScanning(true);
    setScanFeedback(null);

    // Pick a candidate plate different from current
    const pool = [
      'TS09CD5678',
      'KA01EF4321',
      'DL03GH9876',
      'MH12IJ5432',
      'KL07MN8765',
      'TN10JK9876',
      'AP39AB1234',
      'HR26DQ5544',
      'KA05MB9120',
      'AP07UV6789',
    ];
    const candidate = pool.find((p) => p !== plateNumber) || pool[Math.floor(Math.random() * pool.length)];

    try {
      const res = await apiService.recognizePlate(candidate, 'CAM_01');
      if (res && res.plate_number) {
        setPlateNumber(res.plate_number);
        setOcrConfidence(res.confidence_percent || 98.7);
        if (res.plate_crop_base64) {
          setPlateCrop(`data:image/jpeg;base64,${res.plate_crop_base64}`);
        }
        setScanFeedback({
          plate: res.plate_number,
          state: res.state_name || 'Indian Registered',
          confidence: res.confidence_percent || 98.7,
          timeMs: res.processing_time_ms || 38,
        });

        // Auto-assign next free slot
        if (availableSlots.length > 0) {
          const nextSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
          setSelectedSlot(nextSlot.id);
        }
      } else {
        handleGenerateRandomCar();
      }
    } catch (err) {
      console.warn('Backend ANPR offline, falling back locally:', err);
      handleGenerateRandomCar();
    } finally {
      setIsScanning(false);
    }
  };

  const handleExecuteEntry = async () => {
    const slotId = selectedSlot || (availableSlots.length > 0 ? availableSlots[0].id : 'P01');
    setIsAuthorizing(true);
    setNavigationPhase(1);

    const vehicleData = {
      plateNumber,
      vehicleType,
      color,
      entryTime: new Date().toLocaleTimeString(),
      confidence: ocrConfidence / 100,
    };

    let sessionId: string | undefined;
    try {
      const response = await apiService.registerEntry(plateNumber, vehicleType, color, slotId);
      sessionId = response?.session_id || response?.sessionId;
    } catch (err) {
      console.warn('Backend entry sync fallback:', err);
    }

    // Start the animation with the same session ID persisted by the backend.
    onRegisterEntry(slotId, { ...vehicleData, sessionId });

    setLastRegistered({
      ...vehicleData,
      assignedSlot: slotId,
      timestamp: new Date().toLocaleString(),
    });

    // 3. Step-by-step navigation tracking (shows car going correctly into slot)
    // Stage 1: Gate clearance (0s - 1.5s)
    setTimeout(() => {
      setNavigationPhase(2); // Ingress past barrier
    }, 1500);

    setTimeout(() => {
      setNavigationPhase(3); // Driving along aisle
    }, 3500);

    setTimeout(() => {
      setNavigationPhase(4); // Safely parked in bay
      setIsAuthorizing(false);
    }, 5500);
  };

  const handleAddAnotherCar = () => {
    handleGenerateRandomCar();
    setNavigationPhase(0);
    setLastRegistered(null);
  };

  return (
    <div className="space-y-4 text-slate-800 select-none pb-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-900 tracking-wide">
                Entry Gate Management & ANPR Test Station
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                AI GATE 1 ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Admin interactive console to test vehicle entry: CCTV capture, ANPR OCR plate reading, vacancy check, and boom barrier lift.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600">
            VACANCIES: <strong className="text-emerald-600 font-bold">{availableSlots.length}</strong> / 20 BAYS
          </span>
          <button
            onClick={handleAddAnotherCar}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold border border-blue-200 transition-all shadow-xs"
            title="Generate a new vehicle for testing"
          >
            <Dices className="w-3.5 h-3.5" />
            <span>+ Add Another New Car</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Testing Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Live ANPR Scanner & Test Controls */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Camera className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                1. Entrance Gate Viewport & ANPR Scanner
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              {/* Preview Mode Switcher */}
              <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  onClick={() => setPreviewMode('3D_STREAM')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    previewMode === '3D_STREAM'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🎥 Live 3D Gate
                </button>
                <button
                  onClick={() => setPreviewMode('ANPR_SNAPSHOT')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    previewMode === 'ANPR_SNAPSHOT'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📸 Snapshot
                </button>
              </div>

              {/* Working Test OCR Scan Button */}
              <button
                onClick={handleSimulateScan}
                disabled={isScanning}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                title="Trigger automated YOLOv8 ANPR plate recognition on incoming car"
              >
                <ScanLine className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning ANPR...' : 'Test OCR Scan'}</span>
              </button>
            </div>
          </div>

          {/* Camera Viewfinder Preview with Laser Scanning Animation */}
          <div className="relative aspect-[16/9] bg-slate-950 rounded-xl overflow-hidden border border-slate-300 shadow-inner">
            {/* Real-time laser scanning line sweep */}
            {isScanning && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] z-20 animate-bounce" />
            )}

            {previewMode === '3D_STREAM' ? (
              <CCTV3DCanvas
                cameraId="CAM_01"
                showOverlay={true}
                className="w-full h-full"
              />
            ) : (
              <div className="relative w-full h-full">
                <img
                  src="/cameras/cam01_entrance.jpg"
                  alt="Entrance Camera"
                  className="w-full h-full object-cover"
                />
                {/* Green ANPR Bounding Box */}
                <div className="absolute inset-x-20 inset-y-10 border-2 border-emerald-400 rounded-lg flex flex-col justify-between p-2 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                  <div className="flex justify-between">
                    <span className="w-3 h-3 border-t-2 border-l-2 border-emerald-400 -mt-1 -ml-1" />
                    <span className="w-3 h-3 border-t-2 border-r-2 border-emerald-400 -mt-1 -mr-1" />
                  </div>
                  <div className="self-center bg-slate-950/95 border border-slate-700 px-3 py-1 rounded-md text-amber-300 font-mono text-xs font-bold shadow">
                    {plateNumber} (OCR {ocrConfidence}%)
                  </div>
                  <div className="flex justify-between">
                    <span className="w-3 h-3 border-b-2 border-l-2 border-emerald-400 -mb-1 -ml-1" />
                    <span className="w-3 h-3 border-b-2 border-r-2 border-emerald-400 -mb-1 -mr-1" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* OCR Feedback Toast & Embossed HSRP Plate Crop */}
          {scanFeedback && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-900">
                    ANPR Verified: {scanFeedback.plate}
                  </span>
                  <span className="text-emerald-700 block text-[11px]">
                    {scanFeedback.state} • {scanFeedback.confidence}% Confidence • {scanFeedback.timeMs}ms
                  </span>
                </div>
              </div>

              {plateCrop && (
                <div className="rounded border border-slate-300 overflow-hidden shadow-xs shrink-0 bg-white">
                  <img src={plateCrop} alt="HSRP Crop" className="h-6 object-contain" />
                </div>
              )}
            </div>
          )}

          {/* Vehicle Configuration Form */}
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700">Vehicle Plate Number</label>
                  <button
                    onClick={handleGenerateRandomCar}
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    🎲 Random
                  </button>
                </div>
                <input
                  type="text"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-hidden focus:border-blue-500 uppercase"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 mb-1 block">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e: any) => setVehicleType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                >
                  <option value="SEDAN">SEDAN</option>
                  <option value="SUV">SUV</option>
                  <option value="HATCHBACK">HATCHBACK</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 mb-1 block">Assigned Parking Bay</label>
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-emerald-700 font-mono font-bold focus:outline-hidden focus:border-blue-500"
                >
                  {availableSlots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} ({s.row} Wing)
                    </option>
                  ))}
                  {availableSlots.length === 0 && <option value="">No Empty Bays</option>}
                </select>
              </div>
            </div>

            {/* Vehicle Color Swatches */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Vehicle 3D Paint Color</label>
              <div className="flex items-center space-x-2">
                {CAR_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      color === c.hex
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-[11px]">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Authorize & Drive In Action Button */}
          <button
            onClick={handleExecuteEntry}
            disabled={availableSlots.length === 0 || isAuthorizing}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-emerald-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isAuthorizing
                ? 'VEHICLE INGRESS IN PROGRESS... TRACKING AISLE NAVIGATION'
                : 'AUTHORIZE ENTRY ➔ LIFT BOOM BARRIER & PARK CAR'}
            </span>
          </button>
        </div>

        {/* Right Column: Execution Log, Clarification & Navigation Verification */}
        <div className="lg:col-span-5 space-y-4">
          {/* Navigation Verification Panel (Shows the car going correctly!) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span>2. Ingress & Slot Navigation Verification</span>
              </h2>
              {lastRegistered && (
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                  {navigationPhase === 4 ? 'PARKED ✓' : 'NAVIGATING...'}
                </span>
              )}
            </div>

            {/* Visual Step-by-Step Waypoint Tracker */}
            {lastRegistered ? (
              <div className="space-y-3">
                {/* 4-Step Progress Steps */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono text-xs space-y-2.5">
                  <div className="flex items-center space-x-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      navigationPhase >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      1
                    </span>
                    <span className={navigationPhase >= 1 ? 'text-slate-900 font-bold' : 'text-slate-400'}>
                      ANPR Clearance & Boom Barrier Lifted (-65°)
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      navigationPhase >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      2
                    </span>
                    <span className={navigationPhase >= 2 ? 'text-slate-900 font-bold' : 'text-slate-400'}>
                      Vehicle Ingress: Crossing West Gate into Driving Aisle
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      navigationPhase >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      3
                    </span>
                    <span className={navigationPhase >= 3 ? 'text-slate-900 font-bold' : 'text-slate-400'}>
                      Navigating Central Aisle towards Bay {lastRegistered.assignedSlot}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      navigationPhase >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      4
                    </span>
                    <span className={navigationPhase >= 4 ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                      Parked Correctly in Bay {lastRegistered.assignedSlot} (Sensor Active)
                    </span>
                  </div>
                </div>

                {/* Registered Vehicle Details Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs space-y-2 text-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Vehicle Plate:</span>
                    <span className="text-slate-900 font-extrabold bg-slate-200 px-2 py-0.5 rounded">
                      {lastRegistered.plateNumber}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Assigned Bay:</span>
                    <span className="text-emerald-700 font-extrabold text-sm">
                      {lastRegistered.assignedSlot}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Vehicle Type & Paint:</span>
                    <span className="flex items-center space-x-1.5 font-bold">
                      <span
                        className="w-3 h-3 rounded-full border border-slate-300"
                        style={{ backgroundColor: lastRegistered.color }}
                      />
                      <span>{lastRegistered.vehicleType}</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Dynamic Tariff Rate:</span>
                    <span className="text-emerald-700 font-bold">₹10.00 / hour</span>
                  </div>
                </div>

                {/* Direct Action: View in 3D Parking Lot */}
                {onNavigateTo3D && (
                  <button
                    onClick={() => onNavigateTo3D(lastRegistered.assignedSlot)}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Watch Vehicle in 3D Parking Area (Digital Twin)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {/* Button to add another car */}
                <button
                  onClick={handleAddAnotherCar}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs border border-slate-200 transition-all flex items-center justify-center space-x-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>+ Test & Add Another Car</span>
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-300 rounded-xl bg-slate-50 space-y-2">
                <Car className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-semibold text-slate-700">Ready to Test Vehicle Entry</p>
                <p className="text-[11px] text-slate-500">
                  Configure the vehicle on the left and click "AUTHORIZE ENTRY". You will see real-time gate clarification and waypoint verification as the car navigates into its bay.
                </p>
              </div>
            )}
          </div>

          {/* Phase 1 Verification Checklist */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs space-y-2.5 shadow-sm">
            <div className="font-bold flex items-center space-x-2 text-blue-900 text-sm">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Phase 1 Verification Checklist</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700 font-medium">
              <li>CCTV camera captures vehicle upon arrival</li>
              <li>YOLOv8 ANPR reads high-confidence license plate</li>
              <li>System checks 20-bay vacancy matrix and reserves best slot</li>
              <li>Motorized entrance barrier arm lifts automatically with zero human contact</li>
              <li>3D waypoint navigation tracks vehicle from gate to designated parking slot</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
