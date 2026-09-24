/**
 * Types for AI-Driven Cooperative Autonomous Mobile Manipulator Swarm Architecture
 * Aligned with https://github.com/NSudharsanaLaxmi/Swarm_Major.git
 */

export interface SwarmPose {
  x: number; // Arena X in cm (0 to 120 cm)
  y: number; // Arena Y in cm (0 to 120 cm)
  ang: number; // Angle in degrees (-180 to +180)
}

export interface BatteryDataPoint {
  time: string; // e.g., "15:42:10"
  timestamp: number;
  battery: number; // percentage 0-100%
  voltage: number; // Volts e.g., 12.4
  dischargeRate: number; // % per minute or rate of drop
  currentDraw: number; // Amperes estimate (e.g. 1.2A to 4.5A)
  status: string; // "IDLE", "NAV_TO_PICK", "PICK_PAYLOAD", etc.
}

export interface RobotTwin {
  id: string; // 'robot_0' or 'robot_1'
  botNum: number; // 0, 1
  name: string; // e.g. "Robot 1 (Marker ID 0)", "Robot 2 (Marker ID 1)"
  ip: string; // e.g. "192.168.1.50"
  udpPort: number; // 8888
  battery: number; // 0 - 100%
  voltage: number; // e.g. 12.4V (3S LiPo)
  health: number; // 0 - 100%
  pose: SwarmPose; // Physical coordinates from overhead ArUco vision tracker (cm)
  targetPos?: [number, number]; // [x, y] in cm
  missionState: 
    | 'IDLE' 
    | 'NAV_TO_PICK' 
    | 'RACK_VERIFY' 
    | 'PRECISION_DOCK' 
    | 'PICK_PAYLOAD' 
    | 'NAV_TO_DROP' 
    | 'RELEASE_PAYLOAD' 
    | 'YIELDING';
  assignedTaskId?: string | null;
  tofDistanceMm: number; // VL53L0X Laser distance in mm (I2C 0x29)
  ultrasonicCm: number; // HC-SR04 distance in cm
  lastRfidTag?: string | null;
  isYielding: boolean; // Swarm collision avoidance right-of-way yield
  safetyInterlock: boolean; // Active braking (<120mm ToF obstacle)
  offlineMode: boolean;
  offlineQueueCount: number;
  lastTelemetryTime: number;
  batteryHistory?: BatteryDataPoint[];
  driveVelocities: {
    linearX: number; // m/s or -1.0 to 1.0
    angularZ: number; // rad/s or -1.0 to 1.0
  };
  motorPins: {
    pwmaLeft: number; // GPIO 4 (PWM Left)
    pwmbRight: number; // GPIO 5 (PWM Right)
    dirs: number[]; // [25, 26, 27, 14, 12, 13, 32, 33]
  };
  armServos: {
    base: number; // PCA9685 CH0 (150-600)
    shoulder: number; // PCA9685 CH1
    elbow: number; // PCA9685 CH2
    wrist: number; // PCA9685 CH3
    gripper: number; // PCA9685 CH4 (85 closed - 180 open)
  };
  currentDetection?: VisionDetection | null;
  // Dynamic ArUco Boundary Condition & Safety Status
  distToBoundaryCm?: number;
  boundaryAlert?: 'SAFE' | 'WARNING' | 'BRAKING_CRITICAL';
  boundaryRepulse?: { x: number; y: number };
}

export interface WorkspaceCalibration {
  isCalibrated: boolean;
  dictionary: string; // 'DICT_4X4_50'
  boundaryCorners: {
    tl: [number, number]; // ID 9 (x, y in cm)
    tr: [number, number]; // ID 10
    br: [number, number]; // ID 11
    bl: [number, number]; // ID 12
  };
  rawCornersPx: {
    tl: [number, number]; // in camera pixel coordinates [u, v]
    tr: [number, number];
    br: [number, number];
    bl: [number, number];
  };
  widthCm: number;
  heightCm: number;
  scalePxPerCm: number;
  skewAngleDeg: number;
  perspectiveDistortion: number; // simulated tilt factor 0..1
  boundarySafetyMarginCm: number; // hard safety buffer (e.g. 10cm)
  lastCalibratedTimestamp: number;
  homographyMatrix: number[][]; // 3x3 perspective warp
}

export interface ArucoLiveDetection {
  id: number;
  name: string;
  role: 'BOUNDARY' | 'ROBOT' | 'RACK' | 'START_ZONE' | 'DELIVERY';
  rawPx: [number, number];
  calibratedCm: [number, number];
  angleDeg: number;
  confidence: number;
  valid: boolean;
  statusText: string;
}

export interface TaskOrder {
  id: string;
  name: string;
  pickTarget: [number, number]; // [x, y] in cm
  dropTarget: [number, number]; // [x, y] in cm
  rackMarkerId?: number; // 2, 3, 4, 5
  dropMarkerId?: number; // 8
  status: 'OPEN' | 'ASSIGNED' | 'PICKING' | 'IN_TRANSIT' | 'COMPLETED';
  assignedTo?: string; // e.g. 'robot_0'
  itemType: string;
  rfidPayloadId: string;
  createdAt: number;
}

export interface CostBreakdown {
  robotId: string;
  dist: number;
  energyCost: number;
  healthCost: number;
  totalCost: number;
  isAvailable: boolean;
}

export interface VisionDetection {
  label: 'ARUCO_MARKER_0' | 'ARUCO_MARKER_1' | 'RACK_STATION' | 'OBSTACLE';
  confidence: number;
  xCm: number;
  yCm: number;
  angleDeg: number;
  markerId?: number;
  timestamp: string;
}

export interface LogPacket {
  id: string;
  timestamp: string;
  source: 'ESP32_AGENT' | 'OVERHEAD_VISION' | 'SWARM_COORDINATOR' | 'UNO_Q_BRIDGE' | 'TELEOP_UDP' | 'WAREHOUSE_SERVER';
  direction: 'TX' | 'RX' | 'UDP_5005' | 'UDP_8888' | 'UART_115200' | 'BROADCAST' | 'INTERNAL';
  content: string;
  level: 'INFO' | 'WARN' | 'ALERT' | 'SUCCESS';
}

export interface PinDefinition {
  pin: number | string;
  function: string;
  layer: string;
  targetDevice: string;
  notes: string;
}
