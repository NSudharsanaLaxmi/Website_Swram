/**
 * ArUco Marker System Specification for Warehouse Workcell
 * Dictionary: DICT_4X4_50
 *
 * Boundary Markers (ID 9..12) act as the physical workspace boundary
 * conditions and the global coordinate-frame calibration reference.
 */

export interface ArucoMarkerDef {
  id: number;
  name: string;
  role: 'BOUNDARY' | 'ROBOT' | 'RACK' | 'START_ZONE' | 'DELIVERY';
  label: string;
  subsystem: string;
  description: string;
  defaultPositionCm: [number, number]; // [x, y] in cm
  color: string;
  // 4x4 binary bit grid (0 = black, 1 = white) from DICT_4X4_50
  grid: number[][];
}

// 4x4 bit patterns from DICT_4X4_50 for markers 0 through 12
export const ARUCO_DICT_4X4_50_MARKERS: ArucoMarkerDef[] = [
  {
    id: 0,
    name: 'ROBOT_1',
    role: 'ROBOT',
    label: 'Robot 1 (Active Mobile Manipulator)',
    subsystem: 'Chassis Moving Fiducial',
    description: 'Mounted horizontally on top of Robot 1 for continuous 6-DoF/planar localization and heading calculation.',
    defaultPositionCm: [25.0, 35.0],
    color: '#38bdf8',
    grid: [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ]
  },
  {
    id: 1,
    name: 'ROBOT_2',
    role: 'ROBOT',
    label: 'Robot 2 (Active Mobile Manipulator)',
    subsystem: 'Chassis Moving Fiducial',
    description: 'Mounted horizontally on top of Robot 2 for continuous tracking and decentralized yielding arbitration.',
    defaultPositionCm: [85.0, 75.0],
    color: '#c084fc',
    grid: [
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 1]
    ]
  },
  {
    id: 2,
    name: 'RACK_1',
    role: 'RACK',
    label: 'Storage Rack 1 (Electronics & Sensors)',
    subsystem: 'Fixed Station Fiducial',
    description: 'Fixed landmark mounted at Rack 1 for automated approach, docking, and RFID validation.',
    defaultPositionCm: [25.0, 25.0],
    color: '#0284c7',
    grid: [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [0, 0, 0, 1],
      [1, 1, 0, 1]
    ]
  },
  {
    id: 3,
    name: 'RACK_2',
    role: 'RACK',
    label: 'Storage Rack 2 (Actuator Modules)',
    subsystem: 'Fixed Station Fiducial',
    description: 'Fixed landmark mounted at Rack 2 for payload retrieval.',
    defaultPositionCm: [25.0, 55.0],
    color: '#2563eb',
    grid: [
      [0, 1, 0, 1],
      [0, 1, 0, 1],
      [0, 0, 1, 0],
      [0, 0, 1, 0]
    ]
  },
  {
    id: 4,
    name: 'RACK_3',
    role: 'RACK',
    label: 'Storage Rack 3 (Battery Packs)',
    subsystem: 'Fixed Station Fiducial',
    description: 'Fixed landmark mounted at Rack 3 for hazardous energy storage transport.',
    defaultPositionCm: [25.0, 85.0],
    color: '#4f46e5',
    grid: [
      [0, 1, 0, 1],
      [0, 1, 1, 1],
      [0, 0, 1, 0],
      [1, 1, 1, 0]
    ]
  },
  {
    id: 5,
    name: 'RACK_4',
    role: 'RACK',
    label: 'Storage Rack 4 (Fasteners & Chassis)',
    subsystem: 'Fixed Station Fiducial',
    description: 'Fixed landmark mounted at Rack 4 for structural warehouse stock.',
    defaultPositionCm: [60.0, 25.0],
    color: '#7c3aed',
    grid: [
      [0, 1, 1, 0],
      [0, 0, 1, 1],
      [1, 1, 0, 0],
      [1, 1, 0, 0]
    ]
  },
  {
    id: 6,
    name: 'ROBOT_1_START',
    role: 'START_ZONE',
    label: 'Robot 1 Home & Staging Bay',
    subsystem: 'Start Bay Marker',
    description: 'Fixed ground landmark indicating Robot 1 home parking, inductive recharge, and initial pose.',
    defaultPositionCm: [25.0, 105.0],
    color: '#059669',
    grid: [
      [1, 0, 0, 1],
      [1, 1, 1, 0],
      [0, 1, 0, 0],
      [1, 1, 1, 1]
    ]
  },
  {
    id: 7,
    name: 'ROBOT_2_START',
    role: 'START_ZONE',
    label: 'Robot 2 Home & Staging Bay',
    subsystem: 'Start Bay Marker',
    description: 'Fixed ground landmark indicating Robot 2 home parking, inductive recharge, and initial pose.',
    defaultPositionCm: [60.0, 105.0],
    color: '#10b981',
    grid: [
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 1, 1, 1],
      [0, 0, 1, 0]
    ]
  },
  {
    id: 8,
    name: 'DELIVERY_ZONE',
    role: 'DELIVERY',
    label: 'Outbound Delivery & Sorting Bay',
    subsystem: 'Outbound Depository',
    description: 'Target destination for finished parcel drop-off, packing, and automated sorting conveyor.',
    defaultPositionCm: [95.0, 60.0],
    color: '#e11d48',
    grid: [
      [1, 1, 1, 1],
      [1, 1, 0, 1],
      [1, 0, 1, 0],
      [0, 1, 0, 0]
    ]
  },
  {
    id: 9,
    name: 'BOUNDARY_TL',
    role: 'BOUNDARY',
    label: 'Workspace Calibration: Top-Left (0, 0)',
    subsystem: 'Geometric Boundary Anchor',
    description: 'Corner 1: Establishes global coordinate system origin (X=0, Y=0), scale, and homography anchor.',
    defaultPositionCm: [5.0, 5.0],
    color: '#f59e0b',
    grid: [
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 1],
      [0, 0, 0, 0]
    ]
  },
  {
    id: 10,
    name: 'BOUNDARY_TR',
    role: 'BOUNDARY',
    label: 'Workspace Calibration: Top-Right (120, 0)',
    subsystem: 'Geometric Boundary Anchor',
    description: 'Corner 2: Establishes horizontal workspace axis, width baseline, and upper perimeter constraint.',
    defaultPositionCm: [115.0, 5.0],
    color: '#f59e0b',
    grid: [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0]
    ]
  },
  {
    id: 11,
    name: 'BOUNDARY_BR',
    role: 'BOUNDARY',
    label: 'Workspace Calibration: Bottom-Right (120, 120)',
    subsystem: 'Geometric Boundary Anchor',
    description: 'Corner 3: Establishes diagonal workspace bounding extent and bottom-right safety boundary.',
    defaultPositionCm: [115.0, 115.0],
    color: '#f59e0b',
    grid: [
      [0, 0, 0, 1],
      [0, 0, 0, 1],
      [1, 0, 1, 1],
      [0, 1, 1, 0]
    ]
  },
  {
    id: 12,
    name: 'BOUNDARY_BL',
    role: 'BOUNDARY',
    label: 'Workspace Calibration: Bottom-Left (0, 120)',
    subsystem: 'Geometric Boundary Anchor',
    description: 'Corner 4: Completes the 4-point quadrilateral calibration frame, vertical axis, and left boundary.',
    defaultPositionCm: [5.0, 115.0],
    color: '#f59e0b',
    grid: [
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 1],
      [0, 0, 1, 1]
    ]
  }
];

// Calibration and Geometry Calculation Helpers

/**
 * Computes the minimum Euclidean distance from a 2D point (x, y) to the polygon boundary edges.
 */
export function getDistanceToBoundary(
  point: [number, number],
  polygon: [number, number][]
): { distance: number; closestEdgeIndex: number; isInside: boolean } {
  let minDistance = Infinity;
  let closestEdge = 0;

  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];

    const dist = distanceToSegment(point, p1, p2);
    if (dist < minDistance) {
      minDistance = dist;
      closestEdge = i;
    }
  }

  // Check if inside polygon using ray casting
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > point[1]) !== (yj > point[1])) &&
      (point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return {
    distance: minDistance,
    closestEdgeIndex: closestEdge,
    isInside: inside
  };
}

function distanceToSegment(p: [number, number], a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);

  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2;
  t = Math.max(0, Math.min(1, t));

  const projX = a[0] + t * dx;
  const projY = a[1] + t * dy;
  return Math.hypot(p[0] - projX, p[1] - projY);
}

/**
 * Calculates a repulsive velocity vector directed away from the boundary
 * if the robot is inside the safety buffer threshold.
 */
export function calculateBoundaryRepulsion(
  point: [number, number],
  polygon: [number, number][],
  safetyMarginCm: number = 10.0
): { repulseX: number; repulseY: number; shouldBrake: boolean; alertLevel: 'SAFE' | 'WARNING' | 'BRAKING_CRITICAL' } {
  const { distance, closestEdgeIndex, isInside } = getDistanceToBoundary(point, polygon);

  if (!isInside) {
    // Outside boundary! Critical stopping condition
    return { repulseX: 0, repulseY: 0, shouldBrake: true, alertLevel: 'BRAKING_CRITICAL' };
  }

  if (distance < safetyMarginCm / 2) {
    // Less than 5cm: Emergency stop / hard brake
    return { repulseX: 0, repulseY: 0, shouldBrake: true, alertLevel: 'BRAKING_CRITICAL' };
  }

  if (distance < safetyMarginCm) {
    // Inside safety margin: Apply proportional repulsion vector toward centroid
    const centroidX = polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length;
    const centroidY = polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length;

    const toCenterX = centroidX - point[0];
    const toCenterY = centroidY - point[1];
    const centerDist = Math.hypot(toCenterX, toCenterY) || 1;

    const strength = (safetyMarginCm - distance) / safetyMarginCm; // 0..1
    return {
      repulseX: (toCenterX / centerDist) * strength * 0.4,
      repulseY: (toCenterY / centerDist) * strength * 0.4,
      shouldBrake: false,
      alertLevel: 'WARNING'
    };
  }

  return { repulseX: 0, repulseY: 0, shouldBrake: false, alertLevel: 'SAFE' };
}
