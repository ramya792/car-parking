"""
Vision-Based Intelligent Parking Occupancy & Management System
FastAPI Backend Application
"""

import sys
import os

# Ensure project root and backend root are in sys.path
_current_dir = os.path.dirname(os.path.abspath(__file__))
_parent_dir = os.path.dirname(_current_dir)
_grandparent_dir = os.path.dirname(_parent_dir)

for _p in [_grandparent_dir, _parent_dir, _current_dir]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.v1.api import api_router
from backend.app.services.ws_manager import ws_manager

app = FastAPI(
    title="Smart Parking Management System API",
    description=(
        "Comprehensive backend APIs for real-time 3D parking monitoring, "
        "Indian ANPR license plate recognition, 20-slot occupancy tracking, "
        "dynamic QR payment settlement, and live CCTV feeds."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Cross-Origin Request configuration for Frontend UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers (both /api and /api/v1 for total compatibility)
app.include_router(api_router, prefix="/api")
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "system": "Vision-Based Intelligent Parking Occupancy & Management System",
        "status": "online",
        "version": "1.0.0",
        "total_slots": 20,
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time live events (vehicle entry, exit, payment, slot updates).
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and accept incoming ping/client messages
            data = await websocket.receive_text()
            # Echo or acknowledge if needed
            await websocket.send_text(f'{{"type": "ACK", "received": {data}}}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)
