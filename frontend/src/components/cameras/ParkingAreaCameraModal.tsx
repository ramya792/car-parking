import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Layers,
  Crosshair,
  Video,
  Car,
} from 'lucide-react';
import { apiService } from '../../services/api';
import type { OccupancyScanResult, SlotRoiDetection } from '../../types/parking';
import { CCTV3DCanvas } from './CCTV3DCanvas';

interface ParkingAreaCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSlot?: (slotId: string) => void;
}

export const ParkingAreaCameraModal: React.FC<ParkingAreaCameraModalProps> = ({
  isOpen,
  onClose,
  onSelectSlot,
}) => {
  const [scanData, setScanData] = useState<OccupancyScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState<SlotRoiDetection | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotRoiDetection | null>(null);

  // Layer Visibility Toggles
  const [showPolygons, setShowPolygons] = useState(true);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  // Fetch initial scan when modal opens
  useEffect(() => {
    if (isOpen) {
      handleTriggerScan();
    }
  }, [isOpen]);

  const handleTriggerScan = async () => {
    setLoading(true);
    setIsScanning(true);
    try {
      const data = await apiService.scanOccupancy();
      setScanData(data);
      if (selectedSlot) {
        const updated = data.slot_detections.find((s: SlotRoiDetection) => s.slot_id === selectedSlot.slot_id);
        if (updated) setSelectedSlot(updated);
      }
    } catch (err) {
      console.error('Failed to run occupancy scan:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setIsScanning(false), 900);
    }
  };

  if (!isOpen) return null;

  const totalSlots = scanData?.total_slots || 20;
  const occupiedSlots = scanData?.occupied_slots || 14;
  const availableSlots = scanData?.available_slots || 6;
  const occupancyRate = scanData?.occupancy_percentage || 70.0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-950 border border-slate-700/80 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header Bar */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  CAM 02 — Parking Area Surveillance
                </h2>
                <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>ONLINE • 1080P 60FPS</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  YOLOv8x + Polygon IoU
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Overhead computer vision feed with 20 calibrated slot ROI boundaries and point-in-polygon vehicle detection.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleTriggerScan}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Analyzing Scene...' : 'Trigger AI Scan'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport & Controls Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Camera Viewfinder with SVG Overlays */}
          <div className="flex-1 bg-slate-950 p-4 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Viewfinder Aspect Box (16:9) */}
            <div className="w-full relative aspect-[16/9] max-h-[58vh] bg-[#0c121e] rounded-xl border border-slate-800 shadow-inner overflow-hidden flex items-center justify-center">
              {/* Live 3D Scene Viewport from CAM 02 Angle */}
              <div className="absolute inset-0 z-0">
                <CCTV3DCanvas cameraId="CAM_02" showOverlay={false} onSlotSelect={onSelectSlot} />
              </div>

              {/* Surveillance HUD Overlay Elements */}
              <div className="absolute top-3 left-4 z-20 flex items-center space-x-2 pointer-events-none text-xs font-mono">
                <span className="text-red-500 font-bold flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded border border-red-500/30">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  REC [CAM-02-LOT]
                </span>
                <span className="text-slate-400 bg-black/60 px-2 py-1 rounded border border-slate-800">
                  FOV: 84° • ELEV: 11.0m
                </span>
              </div>

              <div className="absolute top-3 right-4 z-20 flex items-center space-x-2 pointer-events-none text-xs font-mono">
                <span className="text-slate-400 bg-black/60 px-2 py-1 rounded border border-slate-800">
                  {new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC
                </span>
              </div>

              {/* Scanning Laser Line Animation */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-scan-move" />
                </div>
              )}

              {/* SVG 2D Polygonal ROIs & HUD Overlay */}
              <svg
                viewBox="0 0 1280 720"
                className="w-full h-full select-none absolute inset-0 z-10 pointer-events-none"
                style={{ filter: 'drop-shadow(0px 0px 4px rgba(0,0,0,0.8))' }}
              >
                {/* Boundary & Kerb overlay accent */}
                <rect x="40" y="110" width="1200" height="520" rx="8" fill="none" stroke="#334155" strokeWidth="1.5" opacity="0.4" />
                
                {/* Central Driveway Aisle */}
                <rect x="60" y="325" width="1160" height="80" fill="#0b0f19" />
                {/* Center Road Markings (Dashed Yellow/White) */}
                <line x1="80" y1="365" x2="1200" y2="365" stroke="#eab308" strokeWidth="2" strokeDasharray="14,10" opacity="0.75" />
                
                {/* Direction Arrows on Aisle */}
                <g fill="#94a3b8" opacity="0.6">
                  {/* Left to Right arrow */}
                  <path d="M 350 365 L 330 355 L 330 362 L 300 362 L 300 368 L 330 368 L 330 375 Z" />
                  <path d="M 850 365 L 830 355 L 830 362 L 800 362 L 800 368 L 830 368 L 830 375 Z" />
                </g>

                {/* Top Row Header Label */}
                <text x="640" y="145" fill="#64748b" fontSize="13" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  NORTH WING — SLOTS P01 TO P10
                </text>
                {/* Bottom Row Header Label */}
                <text x="640" y="618" fill="#64748b" fontSize="13" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  SOUTH WING — SLOTS P11 TO P20
                </text>

                {/* Render Slot Polygons */}
                {scanData?.slot_detections.map((slot) => {
                  const isHovered = hoveredSlot?.slot_id === slot.slot_id;
                  const isSelected = selectedSlot?.slot_id === slot.slot_id;
                  const isOccupied = slot.status === 'OCCUPIED';

                  // Convert [[x, y], [x, y], ...] to SVG polygon points string
                  const pointsStr = slot.polygon.map(([x, y]) => `${x},${y}`).join(' ');

                  // Centroid for text label
                  const avgX = slot.polygon.reduce((acc, p) => acc + p[0], 0) / slot.polygon.length;
                  const avgY = slot.polygon.reduce((acc, p) => acc + p[1], 0) / slot.polygon.length;

                  return (
                    <g
                      key={slot.slot_id}
                      className="cursor-pointer transition-all duration-150"
                      onMouseEnter={() => setHoveredSlot(slot)}
                      onMouseLeave={() => setHoveredSlot(null)}
                      onClick={() => {
                        setSelectedSlot(slot);
                        onSelectSlot?.(slot.slot_id);
                      }}
                    >
                      {/* Polygon ROI */}
                      {showPolygons && (
                        <polygon
                          points={pointsStr}
                          fill={
                            isSelected
                              ? 'rgba(59, 130, 246, 0.45)'
                              : isHovered
                              ? isOccupied
                                ? 'rgba(239, 68, 68, 0.4)'
                                : 'rgba(16, 185, 129, 0.4)'
                              : isOccupied
                              ? 'rgba(239, 68, 68, 0.22)'
                              : 'rgba(16, 185, 129, 0.18)'
                          }
                          stroke={
                            isSelected
                              ? '#60a5fa'
                              : isHovered
                              ? '#ffffff'
                              : isOccupied
                              ? '#ef4444'
                              : '#10b981'
                          }
                          strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
                          strokeDasharray={slot.status === 'RESERVED' ? '4,4' : undefined}
                        />
                      )}

                      {/* Vehicle Bounding Box if detected */}
                      {showBoundingBoxes && slot.vehicle_bbox && (
                        <g>
                          <rect
                            x={slot.vehicle_bbox[0]}
                            y={slot.vehicle_bbox[1]}
                            width={slot.vehicle_bbox[2]}
                            height={slot.vehicle_bbox[3]}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="1.5"
                            strokeDasharray="3,3"
                          />
                          {/* Corner Markers */}
                          <circle cx={slot.vehicle_bbox[0]} cy={slot.vehicle_bbox[1]} r="2.5" fill="#38bdf8" />
                          <circle cx={slot.vehicle_bbox[0] + slot.vehicle_bbox[2]} cy={slot.vehicle_bbox[1]} r="2.5" fill="#38bdf8" />
                          <circle cx={slot.vehicle_bbox[0]} cy={slot.vehicle_bbox[1] + slot.vehicle_bbox[3]} r="2.5" fill="#38bdf8" />
                          <circle cx={slot.vehicle_bbox[0] + slot.vehicle_bbox[2]} cy={slot.vehicle_bbox[1] + slot.vehicle_bbox[3]} r="2.5" fill="#38bdf8" />

                          {/* Confidence Badge */}
                          <rect
                            x={slot.vehicle_bbox[0]}
                            y={slot.vehicle_bbox[1] - 14}
                            width={54}
                            height={13}
                            rx="2"
                            fill="#0284c7"
                          />
                          <text
                            x={slot.vehicle_bbox[0] + 4}
                            y={slot.vehicle_bbox[1] - 4}
                            fill="#ffffff"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            CAR {(slot.confidence * 100).toFixed(0)}%
                          </text>
                        </g>
                      )}

                      {/* Centered Slot Identifier & Status */}
                      {showLabels && (
                        <g pointerEvents="none">
                          {/* Slot Tag */}
                          <rect
                            x={avgX - 22}
                            y={avgY - 11}
                            width={44}
                            height={22}
                            rx="4"
                            fill={isOccupied ? '#1e1b4b' : '#064e3b'}
                            stroke={isOccupied ? '#ef4444' : '#10b981'}
                            strokeWidth="1"
                            opacity="0.9"
                          />
                          <text
                            x={avgX}
                            y={avgY + 4}
                            fill="#ffffff"
                            fontSize="11"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {slot.slot_id}
                          </text>

                          {/* Plate tag if occupied */}
                          {isOccupied && slot.plate_number && (
                            <text
                              x={avgX}
                              y={avgY + 28}
                              fill="#fcd34d"
                              fontSize="9.5"
                              fontFamily="monospace"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {slot.plate_number}
                            </text>
                          )}
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Hover Slot Tooltip HUD */}
              {hoveredSlot && (
                <div
                  className="absolute bottom-4 left-4 z-30 bg-slate-950/95 border border-slate-700 rounded-lg p-2.5 shadow-2xl pointer-events-none text-xs font-mono space-y-1 backdrop-blur-md"
                >
                  <div className="flex items-center space-x-2 text-white font-bold">
                    <span className="text-blue-400">{hoveredSlot.slot_id}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        hoveredSlot.status === 'OCCUPIED'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {hoveredSlot.status}
                    </span>
                  </div>
                  {hoveredSlot.plate_number && (
                    <div className="text-slate-300">
                      Vehicle: <span className="text-yellow-400 font-bold">{hoveredSlot.plate_number}</span>
                    </div>
                  )}
                  <div className="text-slate-400 text-[10px]">
                    IoU Confidence: <span className="text-emerald-400">{(hoveredSlot.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Layer Toggles Bar */}
            <div className="w-full flex items-center justify-between mt-3 px-2 text-xs">
              <div className="flex items-center space-x-4">
                <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  Visual Overlays:
                </span>
                <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={showPolygons}
                    onChange={(e) => setShowPolygons(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span>Slot Polygons</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={showBoundingBoxes}
                    onChange={(e) => setShowBoundingBoxes(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span>Vehicle BBoxes</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span>Bay Labels</span>
                </label>
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                Click any slot ROI to inspect / isolate in 3D
              </div>
            </div>
          </div>

          {/* Right AI Stats & Inspector Sidebar */}
          <div className="w-80 border-l border-slate-800 bg-slate-900/50 p-4 flex flex-col justify-between overflow-y-auto space-y-4">
            <div className="space-y-4">
              {/* Facility Metrics Summary */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                  <span>Occupancy Analytics</span>
                  <span className="text-[10px] text-blue-400 font-mono">LIVE CAM 02</span>
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
                    <span className="text-[10px] text-slate-400 block">Total Capacity</span>
                    <span className="text-base font-bold text-white font-mono">{totalSlots} Bays</span>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
                    <span className="text-[10px] text-slate-400 block">Occupancy Rate</span>
                    <span className="text-base font-bold text-blue-400 font-mono">{occupancyRate}%</span>
                  </div>
                  <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-2.5">
                    <span className="text-[10px] text-red-400 block">Occupied</span>
                    <span className="text-base font-bold text-red-300 font-mono">{occupiedSlots} Vehicles</span>
                  </div>
                  <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-2.5">
                    <span className="text-[10px] text-emerald-400 block">Available</span>
                    <span className="text-base font-bold text-emerald-300 font-mono">{availableSlots} Bays</span>
                  </div>
                </div>
              </div>

              {/* Model & Latency Telemetry */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
                <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 pb-1 border-b border-slate-800">
                  <Crosshair className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pipeline Telemetry</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Object Detector:</span>
                  <span className="text-slate-200 font-mono font-medium">YOLOv8x (COCO)</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Classification:</span>
                  <span className="text-slate-200 font-mono font-medium">Polygon IoU (cv2)</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Inference Latency:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {scanData?.processing_time_ms || 24} ms
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Resolution:</span>
                  <span className="text-slate-300 font-mono">1280 × 720 px</span>
                </div>
              </div>

              {/* Slot Inspector Details */}
              {selectedSlot ? (
                <div className="bg-slate-950 border border-blue-500/50 rounded-lg p-3 space-y-2 shadow-lg">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                    <div className="flex items-center space-x-1.5">
                      <Car className="w-4 h-4 text-blue-400" />
                      <span className="font-bold text-white font-mono text-sm">{selectedSlot.slot_id}</span>
                      <span className="text-[10px] text-slate-400">({selectedSlot.row} Row)</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        selectedSlot.status === 'OCCUPIED'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {selectedSlot.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {selectedSlot.plate_number && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">License Plate:</span>
                        <span className="text-yellow-400 font-mono font-bold">{selectedSlot.plate_number}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vehicle Presence:</span>
                      <span className="text-slate-200">{selectedSlot.vehicle_detected ? 'Yes (Detected)' : 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Confidence:</span>
                      <span className="text-emerald-400 font-mono font-semibold">
                        {(selectedSlot.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1">
                      Vertices: {selectedSlot.polygon.map(([x, y]) => `[${x},${y}]`).join(' ')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/40 border border-dashed border-slate-800 rounded-lg p-3 text-center text-xs text-slate-500">
                  Click any slot polygon on the camera feed to inspect its coordinates and IoU score.
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={onClose}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Close Viewfinder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
