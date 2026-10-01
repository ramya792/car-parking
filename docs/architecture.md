# System Architecture Documentation
## Vision-Based Intelligent Parking Occupancy & Management System

### 1. High-Level Architecture Overview

The system bridges real-world computer vision edge feeds with an interactive WebGL 3D digital twin and a real-time management dashboard.

```
 [ CCTV CAMERAS (CAM 01, CAM 02, CAM 03) ]
                    │
                    ▼
 [ AI COMPUTER VISION ENGINE (YOLOv8 + OCR) ]
                    │
      (Detections & Plate Events)
                    ▼
       [ FASTAPI BACKEND (Python) ] ── (SQLAlchemy) ── [ POSTGRESQL DATABASE ]
                    │
        (WebSockets & REST APIs)
                    ▼
   [ REACT THREE FIBER 3D DIGITAL TWIN + DASHBOARD ]
                    │
    ├── 3D Canvas (20 Slots P01-P20, Animated Cars, Gates, Lighting)
    ├── Live CV Overlays (CAM 01 Entrance, CAM 02 Overhead, CAM 03 Exit)
    ├── KPI & Analytics Panels (Occupancy, Revenue, History)
    └── Dynamic QR Payment Simulator
```

---

### 2. Core Workflows

#### Vehicle Entry Workflow
1. Vehicle approaches Entry Barrier (CAM 01).
2. CCTV captures frame -> YOLO locates vehicle and plate -> ANPR extracts license string (e.g., `AP39AB1234`).
3. Backend checks slot availability among 20 slots (`P01` to `P20`).
4. System assigns optimal available slot (e.g. `P07`).
5. Entry barrier raises, vehicle navigates in 3D scene to `P07`.
6. Slot `P07` transitions to **OCCUPIED** with illuminated red border.

#### Parking Monitoring Workflow
1. CAM 02 periodically scans parking grounds.
2. Centroid IoU checks confirm vehicles within calibrated slot polygons.
3. Status broadcasted over WebSockets to sync 3D Digital Twin and dashboard KPI counts.

#### Vehicle Exit & Payment Workflow
1. Vehicle drives towards Exit Barrier (CAM 03).
2. Exit camera identifies license plate (`TS09CD5678`).
3. System fetches active session, calculates exact duration and parking fee.
4. Generates dynamic UPI/QR payment card.
5. On payment verification, barrier raises, vehicle departs, slot reverts to **AVAILABLE** (green illuminated border).

---

### 3. Directory Layout

```
car parking/
├── .env.example              # Environment variables template
├── .gitignore                # Git exclusions
├── docker-compose.yml        # Orchestration (DB, Backend, Frontend)
├── README.md                 # Project documentation & run guides
│
├── frontend/                 # React 18 + TypeScript + Vite + Tailwind + Three.js
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/       # Sidebar, Header, Shell
│   │   │   ├── kpi/          # Metric cards (Slots, Occupancy, Revenue)
│   │   │   ├── three/        # 3D Scene (Canvas, Slots P01-P20, Cars, Gates, Lights)
│   │   │   ├── cameras/      # Live camera feeds with CV bounding boxes
│   │   │   ├── activity/     # Recent entries, Payment card, Recharts
│   │   │   └── modals/       # Slot details & Payment modals
│   │   ├── types/            # TypeScript interfaces
│   │   ├── services/         # API & WebSocket client
│   │   └── store/            # State management
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/                  # FastAPI Python backend
│   ├── app/
│   │   ├── api/v1/           # Modular endpoints (vehicles, slots, payments, ai)
│   │   ├── core/             # Configuration, DB connection, Security
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── services/         # Business logic (ANPR, billing, simulator)
│   │   └── main.py           # FastAPI entrypoint
│   └── requirements.txt
│
├── ai_engine/                # Computer Vision & Detection
│   ├── models/               # Model weights & definitions
│   ├── pipelines/            # ANPR & Occupancy calculation
│   └── slot_roi.json         # Calibrated 20-slot ROI polygons
│
└── docs/                     # Specifications and architectural diagrams
    └── architecture.md
```
