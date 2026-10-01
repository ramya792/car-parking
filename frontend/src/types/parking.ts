export type SlotStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

export interface ParkingSlot {
  id: string; // e.g., 'P01' - 'P20'
  row: 'TOP' | 'BOTTOM'; // TOP: P01-P10, BOTTOM: P11-P20
  slotNumber: number; // 1 to 20
  status: SlotStatus;
  position: [number, number, number]; // 3D coordinates [x, y, z]
  rotation: [number, number, number];
  currentVehicle?: VehicleInfo;
  assignedTime?: string;
}

export interface VehicleInfo {
  plateNumber: string;
  vehicleType: 'CAR' | 'SUV' | 'SEDAN' | 'HATCHBACK';
  color: string;
  entryTime: string;
  duration?: string;
  sessionId: string;
  confidence: number;
  imageUrl?: string;
}

export interface ParkingSession {
  id: string;
  session_id?: string;
  vehicleNumber: string;
  vehicle_number?: string;
  slotId: string;
  slot_id?: string;
  parking_slot?: string;
  entryTime: string;
  entry_time?: string;
  exitTime?: string;
  exit_time?: string;
  durationMinutes: number;
  duration_minutes?: number;
  durationDisplay: string;
  duration_display?: string;
  duration?: string;
  hourly_rate?: number;
  fee: number;
  parking_fee?: number;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED';
  payment_status?: 'PENDING' | 'SUCCESS' | 'FAILED';
  payment_method?: string;
  status: 'PARKED' | 'EXITED' | 'RESERVED';
}

export interface CameraFeed {
  id: string;
  name: string; // e.g. "CAM West - Entrance Gate"
  direction?: 'TOP' | 'EAST' | 'WEST' | 'SOUTH' | 'NORTH';
  type: 'ENTRY' | 'PARKING' | 'EXIT' | 'NORTH' | 'SOUTH' | 'TOP' | 'EAST' | 'WEST' | string;
  status: 'LIVE' | 'OFFLINE';
  streamUrl?: string;
  detectedVehicle?: {
    plateNumber: string;
    confidence: number;
    bbox: [number, number, number, number];
    statusText: string;
    timestamp: string;
  };
  metrics?: {
    vehiclesDetected: number;
    occupiedSlots: number;
    availableSlots: number;
  };
}

export interface KPIStats {
  totalSlots: number;
  occupiedSlots: number;
  availableSlots: number;
  occupancyPercentage: number;
  todaysVehicles: number;
  todaysRevenue: number;
  peakHour: string;
  avgDurationMinutes: number;
}

export interface HourlyRevenueTrend {
  time: string;
  amount: number;
}

export interface HourlyOccupancyTrend {
  time: string;
  occupancy_percent: number;
  vehicles: number;
}

export interface VehicleClassDistribution {
  name: string;
  count: number;
  percent: number;
  color: string;
}

export interface AnalyticsDashboardData {
  total_slots: number;
  occupied_slots: number;
  available_slots: number;
  reserved_slots: number;
  occupancy_percentage: number;
  todays_vehicles: number;
  todays_revenue: number;
  revenue_growth_percent: number;
  average_duration: string;
  peak_hours: string;
  turnover_rate: number;
  efficiency_score: number;
  hourly_revenue_trend: HourlyRevenueTrend[];
  hourly_occupancy_trend: HourlyOccupancyTrend[];
  vehicle_distribution: VehicleClassDistribution[];
}

export interface SlotRoiDetection {
  slot_id: string;
  row: 'TOP' | 'BOTTOM';
  status: SlotStatus;
  polygon: number[][];
  vehicle_detected: boolean;
  vehicle_bbox?: number[] | null;
  confidence: number;
  plate_number?: string | null;
}

export interface OccupancyScanResult {
  camera_id: string;
  camera_name: string;
  resolution: number[];
  total_slots: number;
  occupied_slots: number;
  available_slots: number;
  vehicles_detected_count: number;
  occupancy_percentage: number;
  slot_detections: SlotRoiDetection[];
  ai_model: string;
  processing_time_ms: number;
}

export interface TariffTier {
  vehicle_type: string;
  name: string;
  base_rate: number;
  base_hours: number;
  hourly_rate: number;
  daily_max: number;
}

export interface PeakWindow {
  name: string;
  start: string;
  end: string;
  multiplier: number;
}

export interface TariffSchedule {
  currency: string;
  currency_symbol: string;
  hourly_rate?: number;
  grace_period_minutes: number;
  gst_rate_percent: number;
  is_currently_peak: boolean;
  current_peak_window?: string | null;
  current_peak_multiplier: number;
  tiers: TariffTier[];
  peak_windows: PeakWindow[];
}

export interface FeeCalculationPayload {
  entry_time?: string;
  duration_minutes?: number;
  vehicle_type?: string;
  exit_time?: string;
}

export interface FeeCalculationResult {
  vehicle_type: string;
  vehicle_tier_name: string;
  entry_time: string;
  exit_time: string;
  duration_minutes: number;
  duration_display: string;
  duration?: string;
  billable_hours: number;
  hourly_rate?: number;
  per_minute_rate?: number;
  base_fee: number;
  hourly_fee: number;
  additional_hours: number;
  is_peak_hours: boolean;
  peak_window_name?: string | null;
  peak_surcharge: number;
  subtotal: number;
  cgst: number;
  sgst: number;
  tax_gst: number;
  total_fee: number;
  parking_fee?: number;
  grace_period_applied: boolean;
  daily_cap_reached: boolean;
  rate_summary: string;
}

export interface PaymentOrder {
  payment_id: string;
  session_id: string;
  vehicle_number: string;
  amount: number;
  currency: string;
  upi_payload: string;
  qr_code_url: string;
  phone_number?: string;
  upi_id?: string;
  status: string;
  message: string;
}

export interface PaymentReceipt {
  success: boolean;
  payment_id: string;
  session_id: string;
  vehicle_number: string;
  amount: number;
  payment_time: string;
  status: string;
  barrier_arm: string;
  message: string;
}
