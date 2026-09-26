/**
 * Canonical Types for AI-Driven Cooperative Autonomous Mobile Manipulator Swarm Architecture
 * Aligned with Arduino UNO Q Gateway & Swarm_Major Physical Architecture
 */

export type TelemetryMode = 'LIVE' | 'OFFLINE' | 'SIMULATION';

export type CalibrationStatus = 'CALIBRATED' | 'CALIBRATION_DEGRADED' | 'UNCALIBRATED';

export type CommandState = 'IDLE' | 'SENT' | 'ACKNOWLEDGED' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';

export interface CommandAck {
  commandId: string;
  commandName: string;
  targetRobotId: string;
  state: CommandState;
  timestamp: number;
  ackTimestamp?: number;
  completedTimestamp?: number;
  message?: string;
}

export interface SwarmPose {
  x: number; // Arena X in cm (0 to 120 cm)
  y: number; // Arena Y in cm (0 to 120 cm)
  ang: number; // Angle in degrees (-180 to +180)
}

export interface Pose {
  x: number;
  y: number;
  ang: number;
}

export interface BatteryDataPoint {
  time: string;
  timestamp: number;
  battery: number; // percentage 0-100%
  voltage: number; // Volts e.g., 12.4V (3S LiPo)
  dischargeRate: number; // % per minute
  currentDraw: number; // Amperes (0.5A to 4.5A)
  status: string;
}

export interface RobotTwin {
  id: string; // 'robot_0' or 'robot_1'
  botNum: number; // 0, 1
  name: string; // "Robot 1 (Marker ID 0)", "Robot 2 (Marker ID 1)"
  ip: string; // e.g. "172.20.10.3"
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
  packetAgeMs: number;
  distToBoundaryCm: number;
  outOfBounds: boolean;
  boundaryAlert: 'SAFE' | 'WARNING' | 'BRAKING_CRITICAL';
  batteryHistory: BatteryDataPoint[];
  driveVelocities: {
    linearX: number; // m/s or -1.0 to 1.0
    angularZ: number; // rad/s or -1.0 to 1.0
  };
  motorPins: {
    pwmaLeft: number; // GPIO 4 (PWM Left)
    pwmbRight: number; // GPIO 5 (PWM Right)
    dirs: number[]; // [25, 26, 27, 14, 12, 13, 32, 33]
    stbyStatus: 'HARDWIRED_HIGH';
  };
  armServos: {
    base: number;      // PCA9685 CH0: Base Yaw (0-180 deg)
    shoulder: number;  // PCA9685 CH1: Shoulder Pitch (15-165 deg)
    elbow: number;     // PCA9685 CH2: Elbow Pitch (10-170 deg)
    joint4: number;    // PCA9685 CH3: Joint 4 Wrist Pitch (10-170 deg)
    joint5: number;    // PCA9685 CH4: Joint 5 Gripper (45-180 deg)
  };
  mecanum?: {
    driveMode: 'DRIVE_MODE_TESTED_2CHANNEL_SKID_STEER' | 'DRIVE_MODE_INDEPENDENT_4W_MECANUM';
    vx: number;
    vy: number;
    omega: number;
  };
  unoQStatus: {
    mpuOnline: boolean;
    zephyrMcuOnline: boolean;
    uartLinkBaud: number; // 115200
    uartConnected: boolean;
    cpuLoad: number; // %
    ramUsageMb: number;
  };
  esp32Status: {
    rtosOnline: boolean;
    wifiSignalDbm: number;
    freeHeapBytes: number;
    watchdogStatus: 'OK' | 'TRIGGERED';
  };
}

export interface BoundaryCorner {
  id: number; // 9, 10, 11, 12
  name: string; // 'BOUNDARY_TL', 'BOUNDARY_TR', 'BOUNDARY_BR', 'BOUNDARY_BL'
  px: [number, number]; // [u, v] in camera pixel coordinates
  cm: [number, number]; // [x, y] in workspace centimeters
  detected: boolean;
}

export interface WorkspaceCalibration {
  isCalibrated: boolean;
  status: CalibrationStatus;
  dictionary: string; // 'DICT_4X4_50'
  widthCm: number;
  heightCm: number;
  safetyBufferMarginCm: number; // 8.0 cm
  detectedCornerCount: number; // 0 to 4
  boundaryCorners: BoundaryCorner[];
  homographyMatrix: number[][]; // 3x3 perspective transformation matrix
  lastCalibratedTimestamp: number;
}

export interface RackState {
  id: string; // 'rack_1', 'rack_2', 'rack_3'
  markerId: number; // 2, 3, 4
  name: string; // 'RACK_1', 'RACK_2', 'RACK_3'
  position: { x: number; y: number };
  orientation: number;
  pickupFace: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
  approachPose: Pose;
  pickupPose: Pose;
  exitPose: Pose;
  safeClearanceCm: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  assignedRobot?: string | null;
  currentTaskId?: string | null;
  rfidTag?: string;
}

export interface ZoneState {
  id: string;
  markerId: number;
  name: string;
  position: { x: number; y: number };
  orientation: number;
  approachPose: Pose;
  dropPose: Pose;
  exitPose: Pose;
  safeClearanceCm: number;
}

export interface LandmarkState {
  id: number;
  name: string; // 'RACK_1', 'RACK_2', 'RACK_3', 'NAV_CENTER', 'ROBOT_1_START', 'ROBOT_2_START', 'DELIVERY_ZONE'
  type: 'RACK' | 'START_ZONE' | 'DELIVERY' | 'NAV_CENTER';
  xCm: number;
  yCm: number;
  detected: boolean;
  rfidTag?: string;
}

export interface TaskCandidateEvaluation {
  robotId: string;
  name: string;
  distanceCm: number;
  pathCost: number;
  availability: 'READY' | 'BUSY' | 'OFFLINE';
  battery: number;
  collisionRisk: 'LOW' | 'MODERATE' | 'HIGH';
  feasibility: 'VALID' | 'BLOCKED';
}

export interface TaskAllocationTelemetry {
  activeTargetRack: string;
  taskDescription: string;
  evaluatedCandidates: TaskCandidateEvaluation[];
  selectedRobotId: string;
  selectionReason: string;
  allocatedAt: number;
}

export interface PerceptionTelemetry {
  webcamConnected: boolean;
  dictionary: string;
  homographyCalibrated: boolean;
  detectedCorners: number;
  robot1Tracked: boolean;
  robot2Tracked: boolean;
  rfidReading: {
    activeTag: string;
    matchedRack: string;
    status: 'VERIFIED' | 'MISMATCH' | 'SEARCHING';
  };
  lidarTof: {
    frontDistanceMm: number;
    leftClearanceCm: number;
    rightClearanceCm: number;
    dockingClearance: 'CLEAR' | 'APPROACH_READY' | 'OBSTACLE_BRAKE';
  };
  sensorFusion: {
    cameraArucoLocked: boolean;
    rfidIdentityMatched: boolean;
    lidarClearanceValid: boolean;
    approachAuthorized: boolean;
    status: string;
  };
}

export interface ClawStateMachineTelemetry {
  phases: string[];
  currentPhase: string;
  currentPhaseIndex: number;
  targetRackId: string;
  armJoints: {
    base: number;
    shoulder: number;
    elbow: number;
    joint4: number;
    joint5: number;
  };
  gripperState: 'OPEN' | 'CLOSED' | 'MOVING';
  gripperDeg: number;
  objectDetected: boolean;
  gripConfirmed: boolean;
}

export interface SafetyTelemetry {
  boundaryStatus: 'SAFE' | 'WARNING_BUFFER' | 'CRITICAL_BREACH';
  boundaryBufferMarginCm: number;
  interRobotDistanceCm: number;
  collisionBubbleCm: number;
  collisionStatus: 'CLEAR' | 'WARNING_YIELD' | 'CRITICAL_PROXIMITY';
  lidarSafetyBrake: 'CLEAR' | 'ACTIVE_BRAKE';
  rfidMatchStatus: 'VERIFIED' | 'UNVERIFIED';
  communicationWatchdog: 'OK' | 'TIMEOUT';
  systemHalt: boolean;
}

export interface TaskOrder {
  id: string;
  name: string;
  pickTarget: [number, number]; // [x, y] in cm
  dropTarget: [number, number]; // [x, y] in cm
  rackMarkerId?: number; // 2, 3, 4
  dropMarkerId?: number; // 8
  status: 'OPEN' | 'ASSIGNED' | 'PICKING' | 'IN_TRANSIT' | 'COMPLETED';
  assignedTo?: string; // e.g. 'robot_0'
  itemType: string;
  rfidPayloadId: string;
  createdAt: number;
}

export interface NetworkNodeState {
  id: string;
  name: string;
  layer: 'VISION' | 'SWARM_COORDINATOR' | 'UNO_Q_EDGE' | 'ESP32_RTOS' | 'ACTUATOR_SENSOR';
  ip?: string;
  port?: number;
  protocol: 'UDP' | 'UART' | 'I2C' | 'SPI' | 'WEBSOCKET';
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  latencyMs: number;
  lastHeartbeatMs: number;
  dataRateKbps: number;
}

export interface LogPacket {
  id: string;
  timestamp: string;
  source: 'ESP32_AGENT' | 'OVERHEAD_VISION' | 'SWARM_COORDINATOR' | 'UNO_Q_BRIDGE' | 'TELEOP_UDP' | 'WAREHOUSE_SERVER' | 'TELEMETRY_BRIDGE';
  direction: 'TX' | 'RX' | 'UDP_5005' | 'UDP_8888' | 'UART_115200' | 'BROADCAST' | 'INTERNAL' | 'WEBSOCKET';
  content: string;
  level: 'INFO' | 'WARN' | 'ALERT' | 'SUCCESS';
}

/**
 * Canonical Swarm State Model for the entire Web Interface
 */
export interface SwarmState {
  timestamp: number;
  mode: TelemetryMode;

  system: {
    connected: boolean;
    calibrationStatus: CalibrationStatus;
    communicationStatus: string;
    backendBridgeConnected: boolean;
    bridgeUrl: string;
    lastPacketAgeMs: number;
    emergencyHalt: boolean;
    uptimeSeconds: number;
    cpu: number;
    memory: number;
  };

  workspace: WorkspaceCalibration;

  robots: RobotTwin[];

  racks: RackState[];

  deliveryZone: ZoneState;

  landmarks: LandmarkState[];

  perception: PerceptionTelemetry;

  taskAllocator: TaskAllocationTelemetry;

  clawStateMachine: ClawStateMachineTelemetry;

  safety: SafetyTelemetry;

  networkNodes: NetworkNodeState[];

  tasks: TaskOrder[];

  activeCommands: CommandAck[];

  logs: LogPacket[];
}

export interface PinDefinition {
  pin: number | string;
  function: string;
  layer: string;
  targetDevice: string;
  notes: string;
}
