import { BoundaryCorner, LandmarkState } from '../types';

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
    description: 'Fixed warehouse storage rack location 1 for payload pickup and RFID verification.',
    gridCoordinates: '(25.0, 30.0) cm',
    hardwarePlacement: 'Storage Rack 1 Structure Pillar',
  },
  {
    id: 3,
    name: 'RACK_2',
    category: 'RACK',
    description: 'Fixed warehouse storage rack location 2 for payload pickup and RFID verification.',
    gridCoordinates: '(25.0, 90.0) cm',
    hardwarePlacement: 'Storage Rack 2 Structure Pillar',
  },
  {
    id: 4,
    name: 'RACK_3',
    category: 'RACK',
    description: 'Fixed warehouse storage rack location 3 for payload pickup and RFID verification.',
    gridCoordinates: '(55.0, 30.0) cm',
    hardwarePlacement: 'Storage Rack 3 Structure Pillar',
  },
  {
    id: 5,
    name: 'RACK_4',
    category: 'RACK',
    description: 'Fixed warehouse storage rack location 4 for payload pickup and RFID verification.',
    gridCoordinates: '(55.0, 90.0) cm',
    hardwarePlacement: 'Storage Rack 4 Structure Pillar',
  },
  {
    id: 6,
    name: 'ROBOT_1_START',
    category: 'START_ZONE',
    description: 'Fixed staging and initialization baseline marker for Robot 1.',
    gridCoordinates: '(15.0, 60.0) cm',
    hardwarePlacement: 'Workcell Floor - Staging Bay 1',
  },
  {
    id: 7,
    name: 'ROBOT_2_START',
    category: 'START_ZONE',
    description: 'Fixed staging and initialization baseline marker for Robot 2.',
    gridCoordinates: '(105.0, 60.0) cm',
    hardwarePlacement: 'Workcell Floor - Staging Bay 2',
  },
  {
    id: 8,
    name: 'DELIVERY_ZONE',
    category: 'DELIVERY',
    description: 'Fixed product delivery, sorting, and drop-off destination point.',
    gridCoordinates: '(95.0, 60.0) cm',
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

export const INITIAL_LANDMARKS_50: LandmarkState[] = [
  { id: 2, name: 'RACK_1', type: 'RACK', xCm: 25.0, yCm: 30.0, detected: true, rfidTag: 'TAG_RACK_01' },
  { id: 3, name: 'RACK_2', type: 'RACK', xCm: 25.0, yCm: 90.0, detected: true, rfidTag: 'TAG_RACK_02' },
  { id: 4, name: 'RACK_3', type: 'RACK', xCm: 55.0, yCm: 30.0, detected: true, rfidTag: 'TAG_RACK_03' },
  { id: 5, name: 'RACK_4', type: 'RACK', xCm: 55.0, yCm: 90.0, detected: true, rfidTag: 'TAG_RACK_04' },
  { id: 6, name: 'ROBOT_1_START', type: 'START_ZONE', xCm: 15.0, yCm: 60.0, detected: true },
  { id: 7, name: 'ROBOT_2_START', type: 'START_ZONE', xCm: 105.0, yCm: 60.0, detected: true },
  { id: 8, name: 'DELIVERY_ZONE', type: 'DELIVERY', xCm: 95.0, yCm: 60.0, detected: true },
];

export const INITIAL_BOUNDARY_CORNERS: BoundaryCorner[] = [
  { id: 9, name: 'BOUNDARY_TL', px: [40, 40], cm: [0.0, 0.0], detected: true },
  { id: 10, name: 'BOUNDARY_TR', px: [760, 40], cm: [120.0, 0.0], detected: true },
  { id: 11, name: 'BOUNDARY_BR', px: [760, 760], cm: [120.0, 120.0], detected: true },
  { id: 12, name: 'BOUNDARY_BL', px: [40, 760], cm: [0.0, 120.0], detected: true },
];
