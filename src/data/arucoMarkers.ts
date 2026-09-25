import { BoundaryCorner, LandmarkState, RackState, ZoneState } from '../types';

export interface ArucoMarkerMetadata {
  id: number;
  name: string;
  category: 'ROBOT' | 'RACK' | 'START_ZONE' | 'DELIVERY' | 'BOUNDARY';
  description: string;
  gridCoordinates?: string;
  hardwarePlacement: string;
}

export const ARUCO_MARKER_SET_50: ArucoMarkerMetadata[] = [
  {
    id: 0,
    name: 'ROBOT_1',
    category: 'ROBOT',
    description: 'Moving fiducial marker mounted horizontally flat on Robot 1 chassis top for overhead optical tracking.',
    hardwarePlacement: 'Robot 1 Chassis Top Center (Horizontal Mount)',
  },
  {
    id: 1,
    name: 'ROBOT_2',
    category: 'ROBOT',
    description: 'Moving fiducial marker mounted horizontally flat on Robot 2 chassis top for overhead optical tracking.',
    hardwarePlacement: 'Robot 2 Chassis Top Center (Horizontal Mount)',
  },
  {
    id: 2,
    name: 'RACK_1',
    category: 'RACK',
    description: 'Fixed Storage Rack 1 (Top-Left). Pickup face points South (+Y) toward the central open maneuvering zone.',
    gridCoordinates: '(35.0, 25.0) cm',
    hardwarePlacement: 'Storage Rack 1 Structure Pillar',
  },
  {
    id: 3,
    name: 'RACK_2',
    category: 'RACK',
    description: 'Fixed Storage Rack 2 (Top-Right). Pickup face points South (+Y) toward the central open maneuvering zone.',
    gridCoordinates: '(85.0, 25.0) cm',
    hardwarePlacement: 'Storage Rack 2 Structure Pillar',
  },
  {
    id: 4,
    name: 'RACK_3',
    category: 'RACK',
    description: 'Fixed Storage Rack 3 (Mid-South). Pickup face points North (-Y) toward the central open maneuvering zone.',
    gridCoordinates: '(60.0, 75.0) cm',
    hardwarePlacement: 'Storage Rack 3 Structure Pillar',
  },
  {
    id: 5,
    name: 'NAV_CENTER',
    category: 'START_ZONE',
    description: 'Optional central traffic reference marker for multi-robot passing and open waypoint sequencing.',
    gridCoordinates: '(60.0, 50.0) cm',
    hardwarePlacement: 'Workcell Floor - Central Intersection',
  },
  {
    id: 6,
    name: 'ROBOT_1_START',
    category: 'START_ZONE',
    description: 'Fixed staging and initialization baseline marker for Robot 1 (Bottom-Left Bay).',
    gridCoordinates: '(20.0, 102.0) cm',
    hardwarePlacement: 'Workcell Floor - Staging Bay 1',
  },
  {
    id: 7,
    name: 'ROBOT_2_START',
    category: 'START_ZONE',
    description: 'Fixed staging and initialization baseline marker for Robot 2 (Bottom-Right Bay).',
    gridCoordinates: '(100.0, 102.0) cm',
    hardwarePlacement: 'Workcell Floor - Staging Bay 2',
  },
  {
    id: 8,
    name: 'DELIVERY_ZONE',
    category: 'DELIVERY',
    description: 'Fixed product delivery, sorting, and drop-off destination point (Bottom-Center Station).',
    gridCoordinates: '(60.0, 102.0) cm',
    hardwarePlacement: 'Workcell Delivery Drop Off Station',
  },
  {
    id: 9,
    name: 'BOUNDARY_TL',
    category: 'BOUNDARY',
    description: 'Top-Left corner reference calibration marker for perspective homography transform.',
    gridCoordinates: '(0.0, 0.0) cm',
    hardwarePlacement: 'Workcell Perimeter Fence - Top Left Corner',
  },
  {
    id: 10,
    name: 'BOUNDARY_TR',
    category: 'BOUNDARY',
    description: 'Top-Right corner reference calibration marker for perspective homography transform.',
    gridCoordinates: '(120.0, 0.0) cm',
    hardwarePlacement: 'Workcell Perimeter Fence - Top Right Corner',
  },
  {
    id: 11,
    name: 'BOUNDARY_BR',
    category: 'BOUNDARY',
    description: 'Bottom-Right corner reference calibration marker for perspective homography transform.',
    gridCoordinates: '(120.0, 120.0) cm',
    hardwarePlacement: 'Workcell Perimeter Fence - Bottom Right Corner',
  },
  {
    id: 12,
    name: 'BOUNDARY_BL',
    category: 'BOUNDARY',
    description: 'Bottom-Left corner reference calibration marker for perspective homography transform.',
    gridCoordinates: '(0.0, 120.0) cm',
    hardwarePlacement: 'Workcell Perimeter Fence - Bottom Left Corner',
  },
];

export const INITIAL_RACKS_STATE: RackState[] = [
  {
    id: 'rack_1',
    markerId: 2,
    name: 'RACK_1',
    position: { x: 35.0, y: 25.0 },
    orientation: 90.0,
    pickupFace: 'SOUTH',
    approachPose: { x: 35.0, y: 45.0, ang: 90.0 },
    pickupPose: { x: 35.0, y: 32.0, ang: 90.0 },
    exitPose: { x: 35.0, y: 55.0, ang: 90.0 },
    safeClearanceCm: 15.0,
    status: 'AVAILABLE',
    rfidTag: 'TAG_RACK_01',
    assignedRobot: null,
    currentTaskId: null,
  },
  {
    id: 'rack_2',
    markerId: 3,
    name: 'RACK_2',
    position: { x: 85.0, y: 25.0 },
    orientation: 90.0,
    pickupFace: 'SOUTH',
    approachPose: { x: 85.0, y: 45.0, ang: 90.0 },
    pickupPose: { x: 85.0, y: 32.0, ang: 90.0 },
    exitPose: { x: 85.0, y: 55.0, ang: 90.0 },
    safeClearanceCm: 15.0,
    status: 'AVAILABLE',
    rfidTag: 'TAG_RACK_02',
    assignedRobot: null,
    currentTaskId: null,
  },
  {
    id: 'rack_3',
    markerId: 4,
    name: 'RACK_3',
    position: { x: 60.0, y: 75.0 },
    orientation: -90.0,
    pickupFace: 'NORTH',
    approachPose: { x: 60.0, y: 55.0, ang: -90.0 },
    pickupPose: { x: 60.0, y: 68.0, ang: -90.0 },
    exitPose: { x: 60.0, y: 45.0, ang: -90.0 },
    safeClearanceCm: 15.0,
    status: 'AVAILABLE',
    rfidTag: 'TAG_RACK_03',
    assignedRobot: null,
    currentTaskId: null,
  },
];

export const INITIAL_DELIVERY_ZONE: ZoneState = {
  id: 'delivery_zone',
  markerId: 8,
  name: 'DELIVERY_ZONE',
  position: { x: 60.0, y: 102.0 },
  orientation: -90.0,
  approachPose: { x: 60.0, y: 88.0, ang: -90.0 },
  dropPose: { x: 60.0, y: 98.0, ang: -90.0 },
  exitPose: { x: 60.0, y: 85.0, ang: -90.0 },
};

export const INITIAL_LANDMARKS_50: LandmarkState[] = [
  { id: 2, name: 'RACK_1', type: 'RACK', xCm: 35.0, yCm: 25.0, detected: true, rfidTag: 'TAG_RACK_01' },
  { id: 3, name: 'RACK_2', type: 'RACK', xCm: 85.0, yCm: 25.0, detected: true, rfidTag: 'TAG_RACK_02' },
  { id: 4, name: 'RACK_3', type: 'RACK', xCm: 60.0, yCm: 75.0, detected: true, rfidTag: 'TAG_RACK_03' },
  { id: 6, name: 'ROBOT_1_START', type: 'START_ZONE', xCm: 20.0, yCm: 102.0, detected: true },
  { id: 7, name: 'ROBOT_2_START', type: 'START_ZONE', xCm: 100.0, yCm: 102.0, detected: true },
  { id: 8, name: 'DELIVERY_ZONE', type: 'DELIVERY', xCm: 60.0, yCm: 102.0, detected: true },
];

export const INITIAL_BOUNDARY_CORNERS: BoundaryCorner[] = [
  { id: 9, name: 'BOUNDARY_TL', px: [40, 40], cm: [0.0, 0.0], detected: true },
  { id: 10, name: 'BOUNDARY_TR', px: [760, 40], cm: [120.0, 0.0], detected: true },
  { id: 11, name: 'BOUNDARY_BR', px: [760, 760], cm: [120.0, 120.0], detected: true },
  { id: 12, name: 'BOUNDARY_BL', px: [40, 760], cm: [0.0, 120.0], detected: true },
];
