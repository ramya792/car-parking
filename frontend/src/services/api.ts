import axios from 'axios';
import type { ParkingSlot, VehicleInfo, KPIStats, CameraFeed } from '../types/parking';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export interface VehicleEntryPayload {
  vehicle_number?: string;
  vehicle_type?: string;
  color?: string;
  preferred_slot?: string;
}

export interface VehicleExitPayload {
  vehicle_number: string;
  slot_id?: string;
}

export interface PaymentCreatePayload {
  session_id: string;
  vehicle_number: string;
  amount: number;
}

export interface PaymentVerifyPayload {
  payment_id: string;
  session_id: string;
}

export const apiService = {
  // Parking Slots
  async getSlots(): Promise<ParkingSlot[]> {
    const { data } = await client.get('/parking/slots');
    return data.map((s: any) => ({
      id: s.id,
      row: s.row,
      slotNumber: s.slot_number,
      status: s.status,
      position: s.position,
      rotation: s.rotation,
      currentVehicle: s.current_vehicle
        ? {
            plateNumber: s.current_vehicle.plate_number,
            vehicleType: s.current_vehicle.vehicle_type,
            color: s.current_vehicle.color,
            entryTime: s.current_vehicle.entry_time,
            duration: s.current_vehicle.duration,
            sessionId: s.current_vehicle.session_id,
            confidence: s.current_vehicle.confidence,
            imageUrl: s.current_vehicle.image_url,
          }
        : undefined,
    }));
  },

  async getParkingStatus() {
    const { data } = await client.get('/parking/status');
    return data;
  },

  async updateSlotStatus(slotId: string, status: string, vehicle?: VehicleInfo) {
    const payload = {
      status,
      vehicle: vehicle
        ? {
            plate_number: vehicle.plateNumber,
            vehicle_type: vehicle.vehicleType,
            color: vehicle.color,
            entry_time: vehicle.entryTime,
            duration: vehicle.duration,
            session_id: vehicle.sessionId,
            confidence: vehicle.confidence,
          }
        : null,
    };
    const { data } = await client.put(`/parking/slot/${slotId}/status`, payload);
    return data;
  },

  // Dashboard KPI Stats
  async getDashboardStats(): Promise<KPIStats> {
    const { data } = await client.get('/dashboard/stats');
    return {
      totalSlots: data.total_slots,
      occupiedSlots: data.occupied_slots,
      availableSlots: data.available_slots,
      occupancyPercentage: data.occupancy_percentage,
      todaysVehicles: data.todays_vehicles,
      todaysRevenue: data.todays_revenue,
      peakHour: data.peak_hours,
      avgDurationMinutes: data.todays_vehicles > 0 ? (data.avg_duration_minutes || 0) : 0,
    };
  },

  // Detailed Analytics & Reports (Phase 15)
  async getAnalyticsData(): Promise<any> {
    const { data } = await client.get('/dashboard/stats');
    return data;
  },

  async getActiveVehicles(search?: string) {
    const { data } = await client.get('/vehicles/active', {
      params: { search },
    });
    return data;
  },

  async getSessionHistory(search?: string, status?: string) {
    const { data } = await client.get('/vehicles/history', {
      params: { search, status },
    });
    return data;
  },

  // CCTV Cameras
  async getCameras(): Promise<CameraFeed[]> {
    const { data } = await client.get('/cameras');
    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      status: c.status,
      streamUrl: c.stream_url,
      detectedVehicle: c.detected_vehicle
        ? {
            plateNumber: c.detected_vehicle.plate_number,
            confidence: c.detected_vehicle.confidence,
            bbox: c.detected_vehicle.bbox,
            statusText: c.detected_vehicle.status_text,
            timestamp: c.detected_vehicle.timestamp,
          }
        : undefined,
      metrics: {
        vehiclesDetected: c.vehicles_detected_count || 1,
        occupiedSlots: c.occupied_slots_count || 14,
        availableSlots: c.available_slots_count || 6,
      },
    }));
  },

  // Vehicle Entry & Exit
  async registerVehicleEntry(payload: VehicleEntryPayload) {
    const { data } = await client.post('/vehicles/entry', payload);
    return data;
  },

  async registerVehicleExit(payload: VehicleExitPayload) {
    const { data } = await client.post('/vehicles/exit', payload);
    return data;
  },

  async processVehicleExit(vehicle_number: string) {
    return this.registerVehicleExit({ vehicle_number });
  },

  // Payments
  async createPayment(payload: PaymentCreatePayload) {
    const { data } = await client.post('/payment/create', payload);
    return data;
  },

  async getPaymentStatus(paymentId: string) {
    const { data } = await client.get(`/payment/${encodeURIComponent(paymentId)}/status`);
    return data;
  },

  async verifyPayment(payload: PaymentVerifyPayload) {
    const { data } = await client.post('/payment/verify', payload);
    return data;
  },

  async confirmDemoPayment(payload: PaymentVerifyPayload) {
    const { data } = await client.post('/payment/demo-confirm', payload);
    return data;
  },

  // AI & ANPR License Plate Recognition
  async recognizePlate(demoPlate?: string, cameraId: string = 'CAM_01') {
    const { data } = await client.post('/ai/plate-recognition', {
      demo_plate: demoPlate,
      camera_id: cameraId,
    });
    return data;
  },

  // AI Parking Area Occupancy Analysis (CAM 02)
  async scanOccupancy() {
    const { data } = await client.post('/ai/occupancy-scan');
    return data;
  },

  async getOccupancyMap() {
    const { data } = await client.get('/ai/occupancy-map');
    return data;
  },

  // Parking Tariff & Dynamic Fee Engine
  async getTariff(): Promise<any> {
    const { data } = await client.get('/parking/tariff');
    return data;
  },

  async updateTariff(hourlyRate: number, role: string = 'ADMIN'): Promise<any> {
    const { data } = await client.put(
      '/parking/tariff',
      { hourly_rate: hourlyRate },
      {
        headers: { 'X-User-Role': role },
        params: { role },
      }
    );
    return data;
  },

  async calculateFee(payload: {
    duration_minutes?: number;
    entry_time?: string;
    vehicle_type?: string;
    exit_time?: string;
  }): Promise<any> {
    const { data } = await client.post('/parking/calculate-fee', payload);
    return data;
  },

  async registerEntry(
    vehicle_number: string,
    vehicle_type: string = 'SEDAN',
    color: string = '#2563eb',
    preferred_slot?: string
  ): Promise<any> {
    const { data } = await client.post('/vehicles/entry', {
      vehicle_number,
      vehicle_type,
      color,
      preferred_slot,
    });
    return data;
  },

  async getVehicleHistory(search?: string, status?: string): Promise<any> {
    return this.getSessionHistory(search, status);
  },

  async resetFacility(): Promise<any> {
    const { data } = await client.post('/parking/reset');
    return data;
  },

  async syncSessions(): Promise<any> {
    const { data } = await client.post('/parking/sync-sessions');
    return data;
  },
};



