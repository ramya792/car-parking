import React, { useState, useEffect } from 'react';
import type { ParkingSlot } from '../../types/parking';
import {
  Cpu,
  ShieldCheck,
  Scan,
  Car,
  Layers,
  X,
  Radio,
} from 'lucide-react';

interface RealisticParkingAreaProps {
  slots: ParkingSlot[];
  selectedSlotId: string | null;
  onSelectSlot?: (slotId: string) => void;
  entryAnimationData?: any;
  exitingAnimationData?: any;
  timeOfDay?: 'DAY' | 'NIGHT';
  cameraPreset?: string;
  isEntryGateOpen?: boolean;
  isExitGateOpen?: boolean;
}

// 20-bay calibrated grid coordinates matching the photorealistic master plate
interface BayCoordinate {
  id: string;
  left: number; // percentage from left (0 to 100)
  top: number;  // percentage from top (0 to 100)
  width: number;
  height: number;
}

const BAY_LAYOUT: Record<string, BayCoordinate> = {
  // Top Row (P01 - P10) - 5 bays left of center walkway, 5 bays right
  P01: { id: 'P01', left: 25.3, top: 32.5, width: 4.9, height: 12.0 },
  P02: { id: 'P02', left: 30.3, top: 32.5, width: 4.9, height: 12.0 },
  P03: { id: 'P03', left: 35.3, top: 32.5, width: 4.9, height: 12.0 },
  P04: { id: 'P04', left: 40.3, top: 32.5, width: 4.9, height: 12.0 },
  P05: { id: 'P05', left: 45.4, top: 32.5, width: 4.9, height: 12.0 },

  P06: { id: 'P06', left: 54.4, top: 32.5, width: 4.9, height: 12.0 },
  P07: { id: 'P07', left: 59.4, top: 32.5, width: 4.9, height: 12.0 },
  P08: { id: 'P08', left: 64.5, top: 32.5, width: 4.9, height: 12.0 },
  P09: { id: 'P09', left: 69.5, top: 32.5, width: 4.9, height: 12.0 },
  P10: { id: 'P10', left: 74.5, top: 32.5, width: 4.9, height: 12.0 },

  // Bottom Row (P11 - P20) - 5 bays left of center walkway, 5 bays right
  P11: { id: 'P11', left: 10.3, top: 68.0, width: 7.3, height: 25.5 },
  P12: { id: 'P12', left: 17.7, top: 68.0, width: 7.3, height: 25.5 },
  P13: { id: 'P13', left: 25.1, top: 68.0, width: 7.3, height: 25.5 },
  P14: { id: 'P14', left: 32.6, top: 68.0, width: 7.3, height: 25.5 },
  P15: { id: 'P15', left: 40.2, top: 68.0, width: 7.3, height: 25.5 },

  P16: { id: 'P16', left: 56.1, top: 68.0, width: 7.3, height: 25.5 },
  P17: { id: 'P17', left: 63.6, top: 68.0, width: 7.3, height: 25.5 },
  P18: { id: 'P18', left: 71.0, top: 68.0, width: 7.3, height: 25.5 },
  P19: { id: 'P19', left: 78.5, top: 68.0, width: 7.3, height: 25.5 },
  P20: { id: 'P20', left: 86.0, top: 68.0, width: 7.3, height: 25.5 },
};

export interface VehicleTelemetryProfile {
  id: string;
  plateNumber: string;
  characters: { char: string; conf: number }[];
  makeModel: string;
  vehicleType: string;
  colorName: string;
  colorHex: string;
  dimensions: string;
  weight: string;
  rfidTag: string;
  fastagBalance: string;
  assignedSlot: string;
  slotWing: string;
  entryTime: string;
  tariffRate: string;
  securityClearance: string;
  plcStatus: string;
  confidence: number;
}

const VEHICLE_PROFILES: Record<string, VehicleTelemetryProfile> = {
  CAMRY_WHITE: {
    id: 'CAMRY_WHITE',
    plateNumber: 'XYZ 9676',
    characters: [
      { char: 'X', conf: 99.8 },
      { char: 'Y', conf: 99.7 },
      { char: 'Z', conf: 99.9 },
      { char: '9', conf: 99.4 },
      { char: '6', conf: 99.1 },
      { char: '7', conf: 99.8 },
      { char: '6', conf: 99.3 },
    ],
    makeModel: 'Toyota Camry 2024 SE',
    vehicleType: '4-Door Passenger Sedan',
    colorName: 'Pearl White (HEX #F5F7FA)',
    colorHex: '#F5F7FA',
    dimensions: '4.88m (L) × 1.84m (W) × 1.44m (H)',
    weight: '1,520 kg (Valid Passenger Class)',
    rfidTag: 'FT-8890-4122-9014 (Active FASTag)',
    fastagBalance: '$45.00 • Auto-Debit Enabled',
    assignedSlot: 'Bay P-07',
    slotWing: 'North Wing (18.2m from gate)',
    entryTime: '30-09-2026 15:46:30.412 UTC',
    tariffRate: '$5.00 / Hour • 15m Grace Period',
    securityClearance: 'AUTHORIZED • STOLEN DB: CLEAR • 0 VIOLATIONS',
    plcStatus: '0x01: TRIGGER_RAISE (Lift Barrier 90°)',
    confidence: 99.52,
  },
  TESLA_BLUE: {
    id: 'TESLA_BLUE',
    plateNumber: 'EV-5542',
    characters: [
      { char: 'E', conf: 99.9 },
      { char: 'V', conf: 99.8 },
      { char: '-', conf: 99.2 },
      { char: '5', conf: 99.6 },
      { char: '5', conf: 99.7 },
      { char: '4', conf: 99.5 },
      { char: '2', conf: 99.8 },
    ],
    makeModel: 'Tesla Model 3 Long Range',
    vehicleType: 'Battery Electric Vehicle (EV)',
    colorName: 'Deep Metallic Blue (#1E3A8A)',
    colorHex: '#1E3A8A',
    dimensions: '4.69m (L) × 1.85m (W) × 1.44m (H)',
    weight: '1,830 kg (EV Class)',
    rfidTag: 'EV-PASS-0041-9988',
    fastagBalance: '$62.50 • EV Priority Pass',
    assignedSlot: 'Bay P-01',
    slotWing: 'North Wing (EV Supercharger Bay)',
    entryTime: '30-09-2026 15:48:12.108 UTC',
    tariffRate: '$6.50 / Hour (Includes EV Fast Charging)',
    securityClearance: 'AUTHORIZED • EV CHARGER RESERVED',
    plcStatus: '0x01: TRIGGER_RAISE (Lift Barrier 90°)',
    confidence: 99.71,
  },
  HONDA_SILVER: {
    id: 'HONDA_SILVER',
    plateNumber: 'AP 39 AB 1234',
    characters: [
      { char: 'A', conf: 99.4 },
      { char: 'P', conf: 99.2 },
      { char: '3', conf: 99.1 },
      { char: '9', conf: 98.9 },
      { char: 'A', conf: 99.5 },
      { char: 'B', conf: 99.3 },
      { char: '1', conf: 99.7 },
      { char: '2', conf: 99.4 },
      { char: '3', conf: 99.2 },
      { char: '4', conf: 99.6 },
    ],
    makeModel: 'Honda CR-V 2023 AWD',
    vehicleType: 'Compact SUV',
    colorName: 'Lunar Silver Metallic (#94A3B8)',
    colorHex: '#94A3B8',
    dimensions: '4.70m (L) × 1.86m (W) × 1.68m (H)',
    weight: '1,680 kg (SUV Class)',
    rfidTag: 'FT-1022-7744-8831',
    fastagBalance: '$32.00 • Auto-Debit Enabled',
    assignedSlot: 'Bay P-05',
    slotWing: 'North Wing (Wide SUV Bay)',
    entryTime: '30-09-2026 15:50:04.992 UTC',
    tariffRate: '$5.00 / Hour • 15m Grace Period',
    securityClearance: 'AUTHORIZED • RESIDENT MONTHLY PASS',
    plcStatus: '0x01: TRIGGER_RAISE (Lift Barrier 90°)',
    confidence: 99.38,
  },
  BMW_BLACK: {
    id: 'BMW_BLACK',
    plateNumber: 'DL 1C AA 9999',
    characters: [
      { char: 'D', conf: 99.6 },
      { char: 'L', conf: 99.5 },
      { char: '1', conf: 99.8 },
      { char: 'C', conf: 99.4 },
      { char: 'A', conf: 99.7 },
      { char: 'A', conf: 99.6 },
      { char: '9', conf: 99.9 },
      { char: '9', conf: 99.8 },
      { char: '9', conf: 99.7 },
      { char: '9', conf: 99.9 },
    ],
    makeModel: 'BMW 330i M-Sport',
    vehicleType: 'Executive Sports Sedan',
    colorName: 'Mineral Black (#0F172A)',
    colorHex: '#0F172A',
    dimensions: '4.71m (L) × 1.83m (W) × 1.44m (H)',
    weight: '1,590 kg (Sedan Class)',
    rfidTag: 'FT-9900-5511-2244',
    fastagBalance: '$110.00 • VIP Corporate',
    assignedSlot: 'Bay P-09',
    slotWing: 'North Wing (Corporate Reserved)',
    entryTime: '30-09-2026 15:52:45.310 UTC',
    tariffRate: '$5.00 / Hour • Direct Billing',
    securityClearance: 'AUTHORIZED • VIP CORP PRE-APPROVED',
    plcStatus: '0x01: TRIGGER_RAISE (Lift Barrier 90°)',
    confidence: 99.69,
  },
};

export const RealisticParkingArea: React.FC<RealisticParkingAreaProps> = ({
  slots,
  selectedSlotId,
  onSelectSlot,
  entryAnimationData,
  exitingAnimationData,
  timeOfDay = 'NIGHT',
  cameraPreset = 'DEFAULT',
  isEntryGateOpen = false,
  isExitGateOpen = false,
}) => {
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
  const [cctvTime, setCctvTime] = useState<string>('');
  const [selectedVehicleKey, setSelectedVehicleKey] = useState<string>('CAMRY_WHITE');
  const [isTelemetryCollapsed, setIsTelemetryCollapsed] = useState<boolean>(false);

  // Sync if external entry animation specifies a plate
  useEffect(() => {
    if (entryAnimationData?.plateNumber) {
      const match = Object.values(VEHICLE_PROFILES).find(
        (v) => v.plateNumber === entryAnimationData.plateNumber
      );
      if (match) {
        setSelectedVehicleKey(match.id);
      }
    }
  }, [entryAnimationData]);

  const activeVehicle = VEHICLE_PROFILES[selectedVehicleKey] || VEHICLE_PROFILES.CAMRY_WHITE;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const d = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
      const t = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      setCctvTime(`${d} ${t}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine active background image based on selected Camera Zone & Day/Night
  const getCameraFeedImage = () => {
    if (cameraPreset === 'EAST') {
      return '/cameras/cam_east_zone.jpg';
    }
    if (cameraPreset === 'WEST') {
      return '/cameras/cam01_entrance.jpg';
    }
    // Overhead Master Plate for TOP, NORTH, SOUTH, DEFAULT
    return timeOfDay === 'DAY' ? '/cameras/real_parking_day.jpg' : '/cameras/real_parking_night.jpg';
  };

  const currentBgImage = getCameraFeedImage();

  // Zone metadata for the active camera view
  const getZoneLabel = () => {
    switch (cameraPreset) {
      case 'EAST':
        return {
          title: 'CAM 03 — EAST ZONE SURVEILLANCE',
          coverage: 'COVERAGE: EAST EXIT GATE • EXIT DRIVEWAY • EAST WING BAYS',
          badge: 'EAST WING FEED',
        };
      case 'WEST':
        return {
          title: 'CAM 01 — WEST ZONE SURVEILLANCE',
          coverage: 'COVERAGE: WEST ENTRANCE GATE • ANPR KIOSK • WEST WING BAYS',
          badge: 'WEST ENTRANCE FEED',
        };
      case 'NORTH':
        return {
          title: 'CAM 04 — NORTH WING DIGITAL TWIN',
          coverage: 'FOCUS: NORTH WING BAYS (P01 TO P10)',
          badge: 'NORTH WING',
        };
      case 'SOUTH':
        return {
          title: 'CAM 05 — SOUTH WING DIGITAL TWIN',
          coverage: 'FOCUS: SOUTH WING BAYS (P11 TO P20)',
          badge: 'SOUTH WING',
        };
      case 'TOP':
      default:
        return {
          title: 'CAM 02 — OVERHEAD DIGITAL TWIN (20 BAYS)',
          coverage: 'FULL LOT PERCEPTION • 20 CALIBRATED BAYS • UNMANNED AUTONOMOUS',
          badge: 'ALL BAYS OVERVIEW',
        };
    }
  };

  const zoneInfo = getZoneLabel();

  const getSlotOpacity = (slotId: string) => {
    const num = parseInt(slotId.replace('P', ''), 10);
    if (cameraPreset === 'NORTH') {
      return num <= 10 ? 1 : 0.25;
    }
    if (cameraPreset === 'SOUTH') {
      return num >= 11 ? 1 : 0.25;
    }
    return 1;
  };

  const isDedicatedZoneView = cameraPreset === 'EAST' || cameraPreset === 'WEST';

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-black flex items-center justify-center font-sans">
      {/* Real-World Unmanned Camera Plate */}
      <img
        src={currentBgImage}
        alt={zoneInfo.title}
        className="w-full h-full object-cover transition-opacity duration-500 pointer-events-none"
      />

      {/* Subtle surveillance vignette and scanline effect */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.45)_100%)]" />

      {/* Render 20-Bay Overlays when on Overhead Master (TOP / NORTH / SOUTH / DEFAULT) */}
      {!isDedicatedZoneView && (
        <div className="absolute inset-0 pointer-events-none">
          {slots.map((slot) => {
            const coord = BAY_LAYOUT[slot.id];
            if (!coord) return null;

            const isOccupied = slot.status === 'OCCUPIED';
            const isSelected = selectedSlotId === slot.id;
            const isHovered = hoveredSlotId === slot.id;
            const opacity = getSlotOpacity(slot.id);

            const borderColor = isOccupied ? '#ef4444' : '#10b981';
            const glowShadow = isOccupied
              ? '0 0 10px rgba(239,68,68,0.7), inset 0 0 8px rgba(239,68,68,0.2)'
              : '0 0 14px rgba(16,185,129,0.9), inset 0 0 10px rgba(16,185,129,0.3)';

            return (
              <div
                key={slot.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSlot?.(slot.id);
                }}
                onMouseEnter={() => setHoveredSlotId(slot.id)}
                onMouseLeave={() => setHoveredSlotId(null)}
                style={{
                  left: `${coord.left}%`,
                  top: `${coord.top}%`,
                  width: `${coord.width}%`,
                  height: `${coord.height}%`,
                  borderColor: borderColor,
                  opacity: opacity,
                  boxShadow:
                    isSelected || isHovered
                      ? isOccupied
                        ? '0 0 18px #ef4444'
                        : '0 0 20px #10b981'
                      : glowShadow,
                }}
                className={`absolute pointer-events-auto cursor-pointer border-2 rounded-sm transition-all duration-200 flex flex-col justify-between p-0.5 group ${
                  !isOccupied ? 'bg-emerald-500/15' : 'bg-red-500/5'
                }`}
              >
                {/* Top Slot Badge */}
                <div className="flex justify-between items-center text-[8px] font-mono font-bold leading-none">
                  <span
                    style={{
                      backgroundColor: isOccupied ? 'rgba(239,68,68,0.9)' : 'rgba(16,185,129,0.95)',
                    }}
                    className="px-1 py-0.5 rounded text-white shadow font-mono"
                  >
                    {slot.id}
                  </span>

                  {isOccupied && slot.currentVehicle?.plateNumber && (
                    <span className="bg-slate-950/90 text-yellow-300 px-1 py-0.2 rounded text-[7px] font-mono hidden group-hover:inline shadow">
                      {slot.currentVehicle.plateNumber}
                    </span>
                  )}
                </div>

                {/* Available Slot Center Tag */}
                {!isOccupied && (
                  <div className="self-center font-mono font-bold text-[9px] text-emerald-300 tracking-wider bg-slate-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40 shadow">
                    OPEN
                  </div>
                )}

                {/* Tooltip on Hover */}
                {isHovered && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-30 bg-slate-950/95 border border-slate-700 text-white text-[10px] font-mono px-2.5 py-1 rounded shadow-xl whitespace-nowrap pointer-events-none flex items-center space-x-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: borderColor }}
                    />
                    <span className="font-bold">{slot.id}</span>
                    <span className="text-slate-400">
                      {isOccupied
                        ? `OCCUPIED (${slot.currentVehicle?.plateNumber || 'CAR'})`
                        : 'VACANT & READY'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* East Zone Specialized Overlays (when East Camera is selected) */}
      {cameraPreset === 'EAST' && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8">
          <div className="absolute right-[22%] bottom-[20%] pointer-events-none flex flex-col items-center">
            <div
              style={{
                transform: isExitGateOpen ? 'rotate(-65deg)' : 'rotate(0deg)',
                transformOrigin: 'left center',
              }}
              className="w-20 h-2 bg-gradient-to-r from-red-600 via-white to-red-600 border border-white transition-transform duration-700 shadow-[0_0_12px_#ef4444]"
            />
            <span className="mt-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/85 text-rose-400 border border-rose-500/50 shadow">
              FASTAG EXIT: {isExitGateOpen ? 'BARRIER LIFTED' : 'BARRIER LOCKED'}
            </span>
          </div>

          <div className="absolute left-6 top-16 bg-slate-950/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-200 shadow-xl">
            <span className="text-emerald-400 font-bold">● EAST EXIT GATE ACTIVE</span> • AUTOMATED TOLL CLEARANCE • 0 QUEUE
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WEST ZONE SPECIALIZED AI COMPUTER VISION OVERLAYS (When West Cam Selected) */}
      {/* ========================================================================= */}
      {cameraPreset === 'WEST' && (
        <div className="absolute inset-0 pointer-events-none">
          {/* 1. Vehicle Bounding Box (YOLOv8 Object Detection) */}
          <div
            style={{
              left: '31%',
              top: '35%',
              width: '30%',
              height: '53%',
            }}
            className="absolute border-2 border-emerald-400/90 rounded-sm transition-all duration-300 pointer-events-none flex flex-col justify-between p-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            {/* Top Corner brackets */}
            <div className="flex justify-between items-start">
              <span className="w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-400 -mt-2.5 -ml-2.5" />
              <div className="bg-emerald-950/90 border border-emerald-400/80 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-emerald-300 flex items-center space-x-1 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>YOLOv8: PASSENGER SEDAN (99.2%)</span>
              </div>
              <span className="w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-400 -mt-2.5 -mr-2.5" />
            </div>

            {/* Bottom Corner brackets & Vehicle Info Sub-badge */}
            <div className="flex justify-between items-end">
              <span className="w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-400 -mb-2.5 -ml-2.5" />
              <div className="bg-slate-950/90 border border-slate-700 px-2 py-0.5 rounded text-[8px] font-mono text-slate-300 shadow">
                {activeVehicle.makeModel} • {activeVehicle.colorName.split(' ')[0]}
              </div>
              <span className="w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-400 -mb-2.5 -mr-2.5" />
            </div>
          </div>

          {/* 2. License Plate Micro-ROI & Deep OCR Scanner Reticle */}
          <div
            style={{
              left: '50.3%',
              top: '73.2%',
              width: '4.4%',
              height: '5.2%',
            }}
            className="absolute border-2 border-yellow-400 rounded-xs transition-all pointer-events-none shadow-[0_0_12px_rgba(250,204,21,0.6)] animate-pulse"
          >
            {/* Sweeping Laser Scan Line */}
            <div className="w-full h-0.5 bg-yellow-300 shadow-[0_0_8px_#fde047] animate-pulse relative top-1/2 -translate-y-1/2" />

            {/* Floating OCR Tag above plate */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-yellow-400 text-slate-950 px-1.5 py-0.2 rounded font-mono font-black text-[8px] shadow-lg flex items-center space-x-1">
              <Scan className="w-2.5 h-2.5" />
              <span>PLATE: {activeVehicle.plateNumber}</span>
            </div>

            {/* OCR Neural Confidence breakdown */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/90 border border-yellow-400/60 px-1 py-0.2 rounded font-mono text-[7px] text-yellow-300 shadow">
              CONF: {activeVehicle.confidence}%
            </div>
          </div>

          {/* 3. Ticket Kiosk / RFID Antenna Reader Ping */}
          <div
            style={{
              left: '71.5%',
              top: '46%',
              width: '6.5%',
              height: '35%',
            }}
            className="absolute border border-dashed border-cyan-400/50 rounded-sm pointer-events-none flex flex-col justify-start items-center p-1"
          >
            <div className="bg-cyan-950/90 border border-cyan-400 px-1.5 py-0.5 rounded text-[8px] font-mono text-cyan-300 flex items-center space-x-1 shadow whitespace-nowrap">
              <Radio className="w-2.5 h-2.5 animate-pulse text-cyan-400" />
              <span>RFID / FASTag</span>
            </div>
          </div>

          {/* 4. Entrance Boom Barrier Real-Time Actuation Indicator */}
          <div className="absolute right-[14%] bottom-[16%] pointer-events-none flex flex-col items-center">
            <div
              style={{
                transform: isEntryGateOpen ? 'rotate(-65deg)' : 'rotate(0deg)',
                transformOrigin: 'left center',
              }}
              className="w-28 h-2 bg-gradient-to-r from-red-600 via-white to-red-600 border border-white transition-transform duration-700 shadow-[0_0_12px_#ef4444]"
            />
            <span
              className={`mt-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded border shadow ${
                isEntryGateOpen
                  ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/60'
                  : 'bg-black/90 text-rose-400 border-rose-500/60'
              }`}
            >
              BARRIER ARM: {isEntryGateOpen ? '🟢 OPEN (90°)' : '🔴 LOCKED (STOP)'}
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REAL-TIME VEHICLE TELEMETRY CARD (Visible on West Cam / Expandable)       */}
      {/* ========================================================================= */}
      {cameraPreset === 'WEST' && (
        <div
          className={`absolute left-4 top-20 z-30 transition-all duration-300 ${
            isTelemetryCollapsed ? 'w-12 h-12' : 'w-88 max-w-[calc(100vw-32px)]'
          }`}
        >
          {isTelemetryCollapsed ? (
            <button
              onClick={() => setIsTelemetryCollapsed(false)}
              className="w-12 h-12 rounded-xl bg-slate-900/95 border border-emerald-500/80 shadow-2xl flex items-center justify-center text-emerald-400 hover:bg-slate-800 transition-all cursor-pointer pointer-events-auto"
              title="Expand Car Ingestion Telemetry"
            >
              <Cpu className="w-6 h-6 animate-pulse" />
            </button>
          ) : (
            <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto text-white flex flex-col">
              {/* Header Bar */}
              <div className="px-3.5 py-2.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold tracking-wider font-mono text-emerald-300">
                    ANPR & INGESTION TELEMETRY
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-bold">
                    60 FPS EDGE
                  </span>
                  <button
                    onClick={() => setIsTelemetryCollapsed(true)}
                    className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                    title="Minimize"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Vehicle Preset Switcher (For Pitch Demonstration) */}
              <div className="p-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center space-x-1.5 overflow-x-auto text-[10px] font-mono">
                <span className="text-slate-400 text-[9px] uppercase font-bold mr-1">Demo:</span>
                {Object.values(VEHICLE_PROFILES).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicleKey(v.id)}
                    className={`px-2 py-1 rounded transition-colors whitespace-nowrap font-semibold ${
                      selectedVehicleKey === v.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {v.plateNumber}
                  </button>
                ))}
              </div>

              {/* Data Ingestion Body */}
              <div className="p-3.5 space-y-3 max-h-[65vh] overflow-y-auto font-mono text-xs">
                {/* 1. License Plate & Optical Recognition */}
                <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center space-x-1">
                      <Scan className="w-3 h-3 text-yellow-400" />
                      <span>Deep Optical ANPR</span>
                    </span>
                    <span className="text-[10px] bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 px-1.5 py-0.2 rounded font-bold">
                      {activeVehicle.confidence}% CONFIDENCE
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-black/70 p-2 rounded-lg border border-yellow-400/40">
                    <div className="flex items-center space-x-2">
                      <div className="bg-yellow-400 text-slate-950 font-black px-2 py-1 rounded text-sm tracking-wider shadow">
                        {activeVehicle.plateNumber}
                      </div>
                      <div className="text-[10px] text-slate-300">
                        High-Speed Global Shutter Ingestion
                      </div>
                    </div>
                  </div>

                  {/* Character Token Segmentations */}
                  <div className="flex items-center space-x-1 pt-1 overflow-x-auto">
                    {activeVehicle.characters.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center bg-slate-950 border border-slate-700 px-1.5 py-0.5 rounded text-[8px]"
                      >
                        <span className="text-white font-bold">{item.char}</span>
                        <span className="text-emerald-400 text-[7px]">{item.conf}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Vehicle Classification & Specs */}
                <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center space-x-1">
                    <Car className="w-3 h-3 text-cyan-400" />
                    <span>Classification & AI Silhouette</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[8px]">MAKE & MODEL</span>
                      <span className="font-bold text-slate-200">{activeVehicle.makeModel}</span>
                    </div>
                    <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[8px]">BODY COLOR</span>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/50"
                          style={{ backgroundColor: activeVehicle.colorHex }}
                        />
                        <span className="font-bold text-slate-200 truncate">
                          {activeVehicle.colorName.split(' ')[0]}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[8px]">CATEGORY</span>
                      <span className="font-bold text-cyan-300">{activeVehicle.vehicleType}</span>
                    </div>
                    <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[8px]">DIMENSIONS</span>
                      <span className="font-bold text-slate-200">{activeVehicle.dimensions.split('•')[0]}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Autonomous Bay Allocation & Route */}
                <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center space-x-1">
                      <Layers className="w-3 h-3 text-emerald-400" />
                      <span>Spatial Allocation Engine</span>
                    </span>
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1 rounded">
                      Dijkstra 12ms
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/40 p-2 rounded-lg">
                    <div>
                      <span className="text-[9px] text-slate-400 block">OPTIMAL VACANT BAY</span>
                      <span className="text-sm font-black text-emerald-300">{activeVehicle.assignedSlot}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block">ZONE & DISTANCE</span>
                      <span className="text-[10px] font-bold text-slate-200">{activeVehicle.slotWing}</span>
                    </div>
                  </div>
                </div>

                {/* 4. RFID / FASTag & Clearance */}
                <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-blue-400" />
                    <span>Security & Auto-Toll FASTag</span>
                  </span>

                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">RFID Transponder:</span>
                      <span className="font-mono">{activeVehicle.rfidTag}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">FASTag Balance:</span>
                      <span className="font-mono text-emerald-400">{activeVehicle.fastagBalance}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Security Check:</span>
                      <span className="font-mono text-blue-300">AUTHORIZED (0 FLAGS)</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Entrance & Exit Barrier Arms on Master Plate (Top-Down Twin) */}
      {!isDedicatedZoneView && (
        <>
          <div className="absolute left-[11.5%] top-[51.5%] pointer-events-none flex flex-col items-center">
            <div
              style={{
                transform: isEntryGateOpen ? 'rotate(-65deg)' : 'rotate(0deg)',
                transformOrigin: 'left center',
              }}
              className="w-14 h-1.5 bg-gradient-to-r from-red-600 via-white to-red-600 border border-white transition-transform duration-700 shadow-[0_0_10px_#ef4444]"
            />
            <span className="mt-1 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/85 text-blue-400 border border-blue-500/40">
              AUTO-ENTRY: {isEntryGateOpen ? 'OPEN' : 'SECURE'}
            </span>
          </div>

          <div className="absolute right-[11.5%] top-[51.5%] pointer-events-none flex flex-col items-center">
            <div
              style={{
                transform: isExitGateOpen ? 'rotate(65deg)' : 'rotate(0deg)',
                transformOrigin: 'right center',
              }}
              className="w-14 h-1.5 bg-gradient-to-r from-red-600 via-white to-red-600 border border-white transition-transform duration-700 shadow-[0_0_10px_#ef4444]"
            />
            <span className="mt-1 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/85 text-rose-400 border border-rose-500/40">
              AUTO-EXIT: {isExitGateOpen ? 'OPEN' : 'SECURE'}
            </span>
          </div>
        </>
      )}

      {/* Dynamic Entering Vehicle Live Motion */}
      {entryAnimationData && !isDedicatedZoneView && (
        <div className="absolute left-[18%] top-[55%] z-20 pointer-events-none animate-bounce flex items-center space-x-1.5 bg-blue-950/90 border border-blue-400 px-2.5 py-1 rounded-md shadow-2xl text-[10px] font-mono text-blue-200">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <span>
            🚗 Vehicle <strong>{entryAnimationData.plateNumber}</strong> ➔ Bay{' '}
            <strong>{entryAnimationData.targetSlotId}</strong>
          </span>
        </div>
      )}

      {/* Dynamic Exiting Vehicle Live Motion */}
      {exitingAnimationData && !isDedicatedZoneView && (
        <div className="absolute right-[18%] top-[55%] z-20 pointer-events-none animate-bounce flex items-center space-x-1.5 bg-rose-950/90 border border-rose-400 px-2.5 py-1 rounded-md shadow-2xl text-[10px] font-mono text-rose-200">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          <span>
            🚗 Vehicle <strong>{exitingAnimationData.plateNumber}</strong> exiting via Barrier
          </span>
        </div>
      )}

      {/* CCTV HUD Telemetry Overlay (Top left and right) */}
      <div className="absolute top-12 left-4 z-20 flex items-center space-x-2 text-[10px] font-mono pointer-events-none">
        <span className="bg-red-600/85 text-white px-2 py-0.5 rounded flex items-center space-x-1 font-bold animate-pulse shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span>LIVE CCTV</span>
        </span>
        <span className="bg-black/85 text-slate-200 px-2 py-0.5 rounded border border-slate-700 shadow">
          {zoneInfo.badge}
        </span>
        <span className="bg-blue-950/85 text-blue-300 px-2 py-0.5 rounded border border-blue-500/40 shadow hidden sm:inline">
          100% UNMANNED AUTONOMOUS
        </span>

      </div>

      <div className="absolute top-12 right-4 z-20 text-[10px] font-mono text-slate-300 bg-black/85 px-2.5 py-0.5 rounded border border-slate-700 pointer-events-none shadow flex items-center space-x-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>{cctvTime || 'LIVE'} • 60 FPS</span>
      </div>

      {/* Bottom Live Watermark Banner */}
      <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between text-[10px] font-mono text-slate-300 pointer-events-none">
        <div className="flex items-center space-x-2 bg-black/85 px-2.5 py-1 rounded border border-slate-800 shadow">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{zoneInfo.coverage}</span>
        </div>
        <div className="bg-black/85 px-2.5 py-1 rounded border border-slate-800 text-slate-400 hidden sm:block shadow">
          {isDedicatedZoneView ? 'ANPR & REAL-TIME OCR ACTIVE' : 'TAP BAY TO INSPECT'}
        </div>
      </div>

    </div>
  );
};
