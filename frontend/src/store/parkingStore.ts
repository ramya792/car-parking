import { create } from 'zustand';
import type { ParkingSlot, SlotStatus, VehicleInfo, KPIStats, CameraFeed } from '../types/parking';
import { apiService } from '../services/api';
import type { VehicleEntryPayload } from '../services/api';
import { wsService } from '../services/websocket';

interface ParkingStoreState {
  slots: ParkingSlot[];
  selectedSlotId: string | null;
  kpiStats: KPIStats;
  cameras: CameraFeed[];
  isLoading: boolean;
  isBackendConnected: boolean;
  wsStatus: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';
  entryGateOpen: boolean;
  exitGateOpen: boolean;
  lastPaymentSuccess: { payment_id?: string; session_id?: string; slot_id?: string; fee?: number } | null;

  // Actions
  selectSlot: (id: string | null) => void;
  fetchBackendData: () => Promise<void>;
  initWebSocket: () => () => void;
  updateSlotStatus: (id: string, status: SlotStatus, vehicle?: VehicleInfo) => Promise<void>;
  simulateVehicleEntry: (payload?: VehicleEntryPayload) => Promise<any>;
  simulatePaymentVerification: (paymentId: string, sessionId: string) => Promise<any>;
  setEntryGateOpen: (open: boolean) => void;
  setExitGateOpen: (open: boolean) => void;
  clearPaymentSuccess: () => void;
  getSlot: (id: string) => ParkingSlot | undefined;
  resetFacility: () => Promise<void>;
}

const TOP_ROW_X = [-18, -14, -10, -6, -2, 2, 6, 10, 14, 18];
const BOTTOM_ROW_X = [-18, -14, -10, -6, -2, 2, 6, 10, 14, 18];

export const INITIAL_AVAILABLE_SLOTS: ParkingSlot[] = [
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `P${(i + 1).toString().padStart(2, '0')}`,
    row: 'TOP' as const,
    slotNumber: i + 1,
    status: 'AVAILABLE' as SlotStatus,
    position: [TOP_ROW_X[i], 0.02, -6.2] as [number, number, number],
    rotation: [0, Math.PI, 0] as [number, number, number],
    currentVehicle: undefined,
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `P${(i + 11).toString().padStart(2, '0')}`,
    row: 'BOTTOM' as const,
    slotNumber: i + 11,
    status: 'AVAILABLE' as SlotStatus,
    position: [BOTTOM_ROW_X[i], 0.02, 6.2] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    currentVehicle: undefined,
  })),
];

const DEFAULT_KPI_STATS: KPIStats = {
  totalSlots: 20,
  occupiedSlots: 0,
  availableSlots: 20,
  occupancyPercentage: 0.0,
  todaysVehicles: 0,
  todaysRevenue: 0.0,
  peakHour: 'N/A',
  avgDurationMinutes: 0,
};

export const useParkingStore = create<ParkingStoreState>((set, get) => ({
  slots: INITIAL_AVAILABLE_SLOTS,
  selectedSlotId: null,
  kpiStats: DEFAULT_KPI_STATS,
  cameras: [],
  isLoading: true,
  isBackendConnected: false,
  wsStatus: 'DISCONNECTED',
  entryGateOpen: false,
  exitGateOpen: false,
  lastPaymentSuccess: null,

  selectSlot: (id: string | null) => set({ selectedSlotId: id }),

  setEntryGateOpen: (open: boolean) => set({ entryGateOpen: open }),
  setExitGateOpen: (open: boolean) => set({ exitGateOpen: open }),
  clearPaymentSuccess: () => set({ lastPaymentSuccess: null }),

  fetchBackendData: async () => {
    set({ isLoading: true });
    try {
      const [slotsData, statsData, camerasData] = await Promise.all([
        apiService.getSlots(),
        apiService.getDashboardStats(),
        apiService.getCameras(),
      ]);

      set({
        slots: slotsData,
        kpiStats: statsData,
        cameras: camerasData,
        isBackendConnected: true,
        isLoading: false,
      });
    } catch (error) {
      console.warn('Backend not responding or network error. Using default state.', error);
      set({ isBackendConnected: false, isLoading: false });
    }
  },

  initWebSocket: () => {
    wsService.connect();

    // Listen to WS connection state
    const unsubscribeStatus = wsService.subscribeStatus((status) => {
      set({ wsStatus: status, isBackendConnected: status === 'CONNECTED' });
    });

    // Listen to real-time events broadcasted by FastAPI backend
    const unsubscribeEvents = wsService.subscribe((event) => {
      if (!event || !event.event) return;

      switch (event.event) {
        case 'VEHICLE_ENTRY': {
          const { slot_id, vehicle } = event;
          if (slot_id) {
            set((prev) => ({
              entryGateOpen: true,
              slots: prev.slots.map((s) =>
                s.id === slot_id
                  ? {
                      ...s,
                      status: 'OCCUPIED',
                      currentVehicle: vehicle
                        ? {
                            plateNumber: vehicle.plate_number || vehicle.plateNumber,
                            vehicleType: vehicle.vehicle_type || vehicle.vehicleType || 'SEDAN',
                            color: vehicle.color || '#2563eb',
                            entryTime: vehicle.entry_time || vehicle.entryTime || 'Just Now',
                            duration: '0h 01m',
                            sessionId: vehicle.session_id || vehicle.sessionId || `SES-${Date.now()}`,
                            confidence: vehicle.confidence || 0.96,
                          }
                        : undefined,
                    }
                  : s
              ),
              kpiStats: {
                ...prev.kpiStats,
                occupiedSlots: prev.kpiStats.occupiedSlots + 1,
                availableSlots: Math.max(0, prev.kpiStats.availableSlots - 1),
                todaysVehicles: prev.kpiStats.todaysVehicles + 1,
                occupancyPercentage: Math.round(((prev.kpiStats.occupiedSlots + 1) / prev.kpiStats.totalSlots) * 100),
              },
            }));

            // Automatically close barrier arm after 4.5 seconds
            setTimeout(() => {
              set({ entryGateOpen: false });
            }, 4500);
          }
          break;
        }

        case 'PAYMENT_SUCCESS': {
          const paidFee = typeof event.fee === 'number' && event.fee > 0 ? event.fee : 0;
          set((prev) => ({
            lastPaymentSuccess: event,
            ...(paidFee > 0 ? {
              kpiStats: {
                ...prev.kpiStats,
                todaysRevenue: Math.round((prev.kpiStats.todaysRevenue + paidFee) * 100) / 100,
              },
            } : {}),
          }));
          break;
        }

        case 'FACILITY_RESET': {
          set({
            slots: INITIAL_AVAILABLE_SLOTS,
            kpiStats: DEFAULT_KPI_STATS,
            entryGateOpen: false,
            exitGateOpen: false,
          });
          break;
        }

        default:
          break;
      }
    });

    return () => {
      unsubscribeStatus();
      unsubscribeEvents();
    };
  },

  resetFacility: async () => {
    try {
      await apiService.resetFacility();
    } catch (e) {
      console.warn('Backend reset API error', e);
    }
    set({
      slots: INITIAL_AVAILABLE_SLOTS,
      selectedSlotId: null,
      kpiStats: DEFAULT_KPI_STATS,
      entryGateOpen: false,
      exitGateOpen: false,
    });
  },

  updateSlotStatus: async (id: string, status: SlotStatus, vehicle?: VehicleInfo) => {
    // 1. Instant synchronous state update for 0-latency 3D rendering
    set((state) => ({
      slots: state.slots.map((s) => {
        if (s.id !== id) return s;
        if (status === 'AVAILABLE') {
          return { ...s, status, currentVehicle: undefined };
        }
        return {
          ...s,
          status,
          currentVehicle: vehicle || s.currentVehicle || {
            plateNumber: `IND${Math.floor(1000 + Math.random() * 9000)}`,
            vehicleType: 'SEDAN',
            color: '#3b82f6',
            entryTime: 'Just Now',
            duration: '0h 01m',
            sessionId: `SES-${Date.now().toString().slice(-4)}`,
            confidence: 0.95,
          },
        };
      }),
    }));

    // 2. Persist to backend API asynchronously in background
    try {
      await apiService.updateSlotStatus(id, status, vehicle);
    } catch (e) {
      console.warn('Could not persist status to backend API', e);
    }
  },

  simulateVehicleEntry: async (payload) => {
    try {
      const result = await apiService.registerVehicleEntry(payload || {
        vehicle_number: `KA0${Math.floor(1 + Math.random() * 9)}XY${Math.floor(1000 + Math.random() * 9000)}`,
        vehicle_type: 'SEDAN',
        color: '#2563eb',
      });
      return result;
    } catch (e) {
      console.error('Entry simulation error', e);
      throw e;
    }
  },

  simulatePaymentVerification: async (paymentId: string, sessionId: string) => {
    try {
      const result = await apiService.verifyPayment({ payment_id: paymentId, session_id: sessionId });
      return result;
    } catch (e) {
      console.error('Payment verification error', e);
      throw e;
    }
  },

  getSlot: (id: string) => get().slots.find((s) => s.id === id),
}));
