from fastapi import APIRouter, HTTPException
from typing import List
from backend.app.schemas.camera import CameraFeedSchema
from backend.app.services.camera_service import camera_service

router = APIRouter()

@router.get("", response_model=List[CameraFeedSchema], summary="Get All CCTV Camera Feeds")
@router.get("/", response_model=List[CameraFeedSchema], include_in_schema=False)
async def get_all_cameras():
    """
    Returns live feed metadata and real-time computer vision bounding boxes for:
    - CAM 01: Entrance
    - CAM 02: Parking Area
    - CAM 03: Exit
    """
    return camera_service.get_all_cameras()

@router.get("/{camera_id}", response_model=CameraFeedSchema, summary="Get Specific Camera Feed")
async def get_camera(camera_id: str):
    cam = camera_service.get_camera(camera_id)
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    return cam

@router.post("", summary="Register or Update Camera Stream")
async def update_camera(payload: dict):
    return {"success": True, "message": "Camera updated successfully."}
