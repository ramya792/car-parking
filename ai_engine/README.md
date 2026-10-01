# AI Computer Vision Engine
## Vision-Based Intelligent Parking Occupancy & ANPR Engine

This module houses the computer vision pipelines for:
1. **Vehicle Detection**: Real-time YOLOv8 object detection detecting car, truck, bus classes.
2. **License Plate Localization & ANPR**: Automatic Number Plate Recognition trained on Indian High Security Registration Plates (HSRP) format (e.g. `AP39AB1234`, `TS09CD5678`, `KA01EF4321`).
3. **Slot Occupancy Mapping**: 20 predefined polygonal Regions of Interest (ROIs) for slots `P01` to `P20` mapping vehicle bounding box centroid overlaps to slot state changes.

### Folder Structure
- `models/`: Weights & model architectures (YOLO weights, OCR checkpoints).
- `pipelines/`:
  - `anpr_pipeline.py`: License plate detector + OCR string extractor + regex cleaner.
  - `occupancy_pipeline.py`: Slot polygon intersection & IoU calculator.
- `data/`: Sample camera streams and test images for CAM 01, CAM 02, CAM 03.
- `slot_roi.json`: 20-slot calibrated ROI coordinates for CAM 02.
