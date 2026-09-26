import { ITelemetryClient, SwarmStateListener, LogListener, ConnectionListener } from './TelemetryAdapter';
import { SwarmState, CommandAck, LogPacket } from '../../types';
import { INITIAL_BOUNDARY_CORNERS, INITIAL_LANDMARKS_50, INITIAL_RACKS_STATE, INITIAL_DELIVERY_ZONE } from '../../data/arucoMarkers';

const CLAW_PHASES = [
  'IDLE',
  'APPROACHING',
  'ALIGNED',
  'CLAW_OPEN',
  'ARM_EXTENDING',
  'OBJECT_DETECTED',
  'CLAW_CLOSING',
  'GRIP_CONFIRMED',
  'ARM_RETRACTING',
  'OBJECT_SECURED',
  'TRANSPORT',
  'DELIVERY_ALIGNMENT',
  'ARM_EXTENDING',
  'CLAW_OPENING',
  'OBJECT_RELEASED',
  'TASK_COMPLETE'
];

export class MockTelemetryClient implements ITelemetryClient {
  private connected: boolean = false;
  private timer: any = null;
  private stateListeners: Set<SwarmStateListener> = new Set();
  private logListeners: Set<LogListener> = new Set();
  private connListeners: Set<ConnectionListener> = new Set();
  private lastPacketTimestamp: number = Date.now();
  private step: number = 0;

  // Deterministic 3-Rack Waypoint Tracks through Central Maneuvering Zone
  // Robot 1: Start 1 -> Central Maneuvering Zone -> Rack 1 Approach -> Rack 1 Pickup -> Rack 1 Exit -> Central -> Delivery
  private bot0Path = [
    { x: 20.0, y: 102.0, ang: -90.0, state: 'IDLE' },
    { x: 25.0, y: 80.0, ang: -80.0, state: 'NAV_TO_PICK' },
    { x: 35.0, y: 55.0, ang: -75.0, state: 'NAV_TO_PICK' }, // Central Maneuvering Zone
    { x: 35.0, y: 45.0, ang: 90.0, state: 'NAV_TO_PICK' },  // Rack 1 Approach Pose
    { x: 35.0, y: 32.0, ang: 90.0, state: 'RACK_VERIFY' },  // Rack 1 Pickup Pose
    { x: 35.0, y: 32.0, ang: 90.0, state: 'PRECISION_DOCK' },
    { x: 35.0, y: 55.0, ang: 90.0, state: 'NAV_TO_DROP' },  // Rack 1 Exit Pose
    { x: 50.0, y: 60.0, ang: 60.0, state: 'NAV_TO_DROP' },  // Central Maneuvering Zone
    { x: 60.0, y: 88.0, ang: -90.0, state: 'NAV_TO_DROP' }, // Delivery Approach Pose
    { x: 60.0, y: 98.0, ang: -90.0, state: 'RELEASE_PAYLOAD' }, // Delivery Drop Pose
    { x: 60.0, y: 85.0, ang: -90.0, state: 'NAV_TO_PICK' }, // Delivery Exit Pose
    { x: 40.0, y: 65.0, ang: -120.0, state: 'IDLE' },
  ];

  // Robot 2: Start 2 -> Central Maneuvering Zone -> Rack 2 Approach -> Rack 2 Pickup -> Rack 2 Exit -> Central -> Delivery
  private bot1Path = [
    { x: 100.0, y: 102.0, ang: -90.0, state: 'IDLE' },
    { x: 95.0, y: 80.0, ang: -100.0, state: 'NAV_TO_PICK' },
    { x: 85.0, y: 55.0, ang: -105.0, state: 'NAV_TO_PICK' }, // Central Maneuvering Zone
    { x: 85.0, y: 45.0, ang: 90.0, state: 'NAV_TO_PICK' },  // Rack 2 Approach Pose
    { x: 85.0, y: 32.0, ang: 90.0, state: 'RACK_VERIFY' },  // Rack 2 Pickup Pose
    { x: 85.0, y: 32.0, ang: 90.0, state: 'PRECISION_DOCK' },
    { x: 85.0, y: 55.0, ang: 90.0, state: 'NAV_TO_DROP' },  // Rack 2 Exit Pose
    { x: 70.0, y: 60.0, ang: 120.0, state: 'NAV_TO_DROP' }, // Central Maneuvering Zone
    { x: 60.0, y: 88.0, ang: -90.0, state: 'NAV_TO_DROP' }, // Delivery Approach Pose
    { x: 60.0, y: 98.0, ang: -90.0, state: 'RELEASE_PAYLOAD' }, // Delivery Drop Pose
    { x: 60.0, y: 85.0, ang: -90.0, state: 'NAV_TO_PICK' }, // Delivery Exit Pose
    { x: 80.0, y: 65.0, ang: -60.0, state: 'IDLE' },
  ];

  connect(): void {
    if (this.connected) return;
    this.connected = true;
    this.lastPacketTimestamp = Date.now();
    this.notifyConnection(true, 0);

    // 1 Hz realistic full swarm state update
    this.timer = setInterval(() => {
      this.lastPacketTimestamp = Date.now();
      this.step = (this.step + 1) % 48;

      const p0 = this.bot0Path[this.step % this.bot0Path.length];
      const p1 = this.bot1Path[(this.step + 3) % this.bot1Path.length];

      // Distance check for auto-yield simulation
      const dist = Math.sqrt(Math.pow(p0.x - p1.x, 2) + Math.pow(p0.y - p1.y, 2));
      const isYielding = dist < 28.0;

      const phaseIdx = this.step % CLAW_PHASES.length;
      const currentPhase = CLAW_PHASES[phaseIdx];

      const fullState: SwarmState = {
        timestamp: Date.now(),
        mode: 'SIMULATION',
        system: {
          connected: true,
          calibrationStatus: 'CALIBRATED',
          communicationStatus: 'SIMULATED_DETERMINISTIC',
          backendBridgeConnected: true,
          bridgeUrl: 'internal://simulated-uno-q-gateway',
          lastPacketAgeMs: 0,
          emergencyHalt: false,
          uptimeSeconds: Math.floor(this.step * 1.5),
          cpu: 18,
          memory: 42
        },
        workspace: {
          isCalibrated: true,
          status: 'CALIBRATED',
          dictionary: 'DICT_4X4_50',
          widthCm: 120.0,
          heightCm: 120.0,
          safetyBufferMarginCm: 8.0,
          detectedCornerCount: 4,
          boundaryCorners: INITIAL_BOUNDARY_CORNERS,
          homographyMatrix: [
            [1.0, 0.0, 0.0],
            [0.0, 1.0, 0.0],
            [0.0, 0.0, 1.0]
          ],
          lastCalibratedTimestamp: Date.now()
        },
        robots: [
          {
            id: 'robot_0',
            botNum: 0,
            name: 'Robot 1 (Marker ID 0)',
            ip: '172.20.10.3',
            udpPort: 8888,
            battery: Math.max(70, 98.0 - (this.step * 0.1)),
            voltage: 12.35,
            health: 100,
            pose: { x: p0.x, y: p0.y, ang: p0.ang },
            targetPos: [35.0, 32.0],
            missionState: p0.state as any,
            assignedTaskId: 'MISSION_101',
            tofDistanceMm: p0.state === 'PRECISION_DOCK' ? 62 : 320,
            ultrasonicCm: 45,
            lastRfidTag: 'TAG_RACK_01',
            isYielding: isYielding,
            safetyInterlock: false,
            offlineMode: false,
            offlineQueueCount: 0,
            lastTelemetryTime: Date.now(),
            packetAgeMs: 0,
            distToBoundaryCm: Math.min(p0.x, 120.0 - p0.x, p0.y, 120.0 - p0.y),
            outOfBounds: false,
            boundaryAlert: 'SAFE',
            batteryHistory: [
              { time: 'T-5m', timestamp: Date.now() - 300000, battery: 99.0, voltage: 12.55, dischargeRate: 0.15, currentDraw: 0.9, status: 'IDLE' },
              { time: 'Now', timestamp: Date.now(), battery: 97.5, voltage: 12.35, dischargeRate: 0.22, currentDraw: 1.1, status: 'IN_TRANSIT' }
            ],
            driveVelocities: { linearX: 0.18, angularZ: 0.0 },
            motorPins: { pwmaLeft: 4, pwmbRight: 5, dirs: [25, 26, 27, 14, 12, 13, 32, 33], stbyStatus: 'HARDWIRED_HIGH' },
            armServos: {
              base: 90,
              shoulder: phaseIdx >= 4 && phaseIdx <= 13 ? 45 : 90,
              elbow: phaseIdx >= 4 && phaseIdx <= 13 ? 135 : 90,
              joint4: 90,
              joint5: phaseIdx >= 6 && phaseIdx <= 13 ? 45 : 180
            },
            mecanum: { driveMode: 'DRIVE_MODE_TESTED_2CHANNEL_SKID_STEER', vx: 0.18, vy: 0.0, omega: 0.0 },
            unoQStatus: { mpuOnline: true, zephyrMcuOnline: true, uartLinkBaud: 115200, uartConnected: true, cpuLoad: 16, ramUsageMb: 512 },
            esp32Status: { rtosOnline: true, wifiSignalDbm: -56, freeHeapBytes: 298450, watchdogStatus: 'OK' }
          },
          {
            id: 'robot_1',
            botNum: 1,
            name: 'Robot 2 (Marker ID 1)',
            ip: '172.20.10.4',
            udpPort: 8888,
            battery: Math.max(65, 92.0 - (this.step * 0.1)),
            voltage: 12.18,
            health: 98,
            pose: { x: p1.x, y: p1.y, ang: p1.ang },
            targetPos: [85.0, 32.0],
            missionState: p1.state as any,
            assignedTaskId: 'MISSION_102',
            tofDistanceMm: 450,
            ultrasonicCm: 80,
            lastRfidTag: 'TAG_RACK_02',
            isYielding: false,
            safetyInterlock: false,
            offlineMode: false,
            offlineQueueCount: 0,
            lastTelemetryTime: Date.now(),
            packetAgeMs: 0,
            distToBoundaryCm: Math.min(p1.x, 120.0 - p1.x, p1.y, 120.0 - p1.y),
            outOfBounds: false,
            boundaryAlert: 'SAFE',
            batteryHistory: [
              { time: 'T-5m', timestamp: Date.now() - 300000, battery: 94.0, voltage: 12.40, dischargeRate: 0.20, currentDraw: 1.1, status: 'IDLE' },
              { time: 'Now', timestamp: Date.now(), battery: 91.5, voltage: 12.18, dischargeRate: 0.25, currentDraw: 1.25, status: 'NAV_TO_PICK' }
            ],
            driveVelocities: { linearX: 0.15, angularZ: 0.05 },
            motorPins: { pwmaLeft: 4, pwmbRight: 5, dirs: [25, 26, 27, 14, 12, 13, 32, 33], stbyStatus: 'HARDWIRED_HIGH' },
            armServos: { base: 90, shoulder: 90, elbow: 90, joint4: 90, joint5: 180 },
            mecanum: { driveMode: 'DRIVE_MODE_TESTED_2CHANNEL_SKID_STEER', vx: 0.15, vy: 0.0, omega: 0.05 },
            unoQStatus: { mpuOnline: true, zephyrMcuOnline: true, uartLinkBaud: 115200, uartConnected: true, cpuLoad: 18, ramUsageMb: 528 },
            esp32Status: { rtosOnline: true, wifiSignalDbm: -60, freeHeapBytes: 295100, watchdogStatus: 'OK' }
          }
        ],
        racks: INITIAL_RACKS_STATE,
        deliveryZone: INITIAL_DELIVERY_ZONE,
        landmarks: INITIAL_LANDMARKS_50,
        perception: {
          webcamConnected: true,
          dictionary: 'DICT_4X4_50',
          homographyCalibrated: true,
          detectedCorners: 4,
          robot1Tracked: true,
          robot2Tracked: true,
          rfidReading: {
            activeTag: 'TAG_RACK_01',
            matchedRack: 'RACK_1 (Marker ID 2)',
            status: 'VERIFIED'
          },
          lidarTof: {
            frontDistanceMm: p0.state === 'PRECISION_DOCK' ? 62 : 320,
            leftClearanceCm: 32.5,
            rightClearanceCm: 38.0,
            dockingClearance: p0.state === 'PRECISION_DOCK' ? 'APPROACH_READY' : 'CLEAR'
          },
          sensorFusion: {
            cameraArucoLocked: true,
            rfidIdentityMatched: true,
            lidarClearanceValid: true,
            approachAuthorized: true,
            status: 'FUSED_AND_AUTHORIZED'
          }
        },
        taskAllocator: {
          activeTargetRack: 'RACK_1',
          taskDescription: 'Fetch Payload from RACK_1 to DELIVERY_ZONE',
          evaluatedCandidates: [
            {
              robotId: 'robot_0',
              name: 'Robot 1 (Marker ID 0)',
              distanceCm: Math.round(Math.sqrt(Math.pow(p0.x - 35, 2) + Math.pow(p0.y - 32, 2))),
              pathCost: 42.5,
              availability: 'READY',
              battery: 98.0,
              collisionRisk: isYielding ? 'MODERATE' : 'LOW',
              feasibility: 'VALID'
            },
            {
              robotId: 'robot_1',
              name: 'Robot 2 (Marker ID 1)',
              distanceCm: Math.round(Math.sqrt(Math.pow(p1.x - 35, 2) + Math.pow(p1.y - 32, 2))),
              pathCost: 78.2,
              availability: 'BUSY',
              battery: 92.0,
              collisionRisk: 'LOW',
              feasibility: 'VALID'
            }
          ],
          selectedRobotId: 'robot_0',
          selectionReason: 'Lowest total path cost (42.5 vs 78.2) + target rack proximity + high battery (98%)',
          allocatedAt: Date.now() - 5000
        },
        clawStateMachine: {
          phases: CLAW_PHASES,
          currentPhase: currentPhase,
          currentPhaseIndex: phaseIdx,
          targetRackId: 'RACK_1',
          armJoints: {
            base: 90,
            shoulder: phaseIdx >= 4 && phaseIdx <= 13 ? 45 : 90,
            elbow: phaseIdx >= 4 && phaseIdx <= 13 ? 135 : 90,
            joint4: 90,
            joint5: phaseIdx >= 6 && phaseIdx <= 13 ? 45 : 180
          },
          gripperState: phaseIdx >= 6 && phaseIdx <= 13 ? 'CLOSED' : 'OPEN',
          gripperDeg: phaseIdx >= 6 && phaseIdx <= 13 ? 45 : 180,
          objectDetected: phaseIdx >= 5,
          gripConfirmed: phaseIdx >= 7 && phaseIdx <= 14
        },
        safety: {
          boundaryStatus: 'SAFE',
          boundaryBufferMarginCm: 8.0,
          interRobotDistanceCm: Math.round(dist),
          collisionBubbleCm: 28.0,
          collisionStatus: isYielding ? 'WARNING_YIELD' : 'CLEAR',
          lidarSafetyBrake: 'CLEAR',
          rfidMatchStatus: 'VERIFIED',
          communicationWatchdog: 'OK',
          systemHalt: false
        },
        networkNodes: [
          { id: 'n1', name: 'Arduino UNO Q Gateway (Linux MPU)', layer: 'UNO_Q_EDGE', ip: '172.20.10.2', port: 8080, protocol: 'WEBSOCKET', status: 'ONLINE', latencyMs: 2, lastHeartbeatMs: Date.now(), dataRateKbps: 850 },
          { id: 'n2', name: 'Overhead ArUco Tracker (USB Cam)', layer: 'VISION', ip: '172.20.10.2', port: 5005, protocol: 'UDP', status: 'ONLINE', latencyMs: 5, lastHeartbeatMs: Date.now(), dataRateKbps: 450 },
          { id: 'n3', name: 'Robot 1 ESP32 Controller', layer: 'ESP32_RTOS', ip: '172.20.10.3', port: 8888, protocol: 'UDP', status: 'ONLINE', latencyMs: 14, lastHeartbeatMs: Date.now(), dataRateKbps: 64 },
          { id: 'n4', name: 'Robot 2 ESP32 Controller', layer: 'ESP32_RTOS', ip: '172.20.10.4', port: 8888, protocol: 'UDP', status: 'ONLINE', latencyMs: 16, lastHeartbeatMs: Date.now(), dataRateKbps: 64 }
        ],
        tasks: [
          {
            id: 'MISSION_101',
            name: 'RACK_1 (ID 2) -> DELIVERY_ZONE (ID 8)',
            pickTarget: [35.0, 32.0],
            dropTarget: [60.0, 98.0],
            rackMarkerId: 2,
            dropMarkerId: 8,
            status: 'ASSIGNED',
            assignedTo: 'robot_0',
            itemType: 'Electronic Sensor Kit',
            rfidPayloadId: 'TAG_ES_901',
            createdAt: Date.now() - 30000
          },
          {
            id: 'MISSION_102',
            name: 'RACK_2 (ID 3) -> DELIVERY_ZONE (ID 8)',
            pickTarget: [85.0, 32.0],
            dropTarget: [60.0, 98.0],
            rackMarkerId: 3,
            dropMarkerId: 8,
            status: 'ASSIGNED',
            assignedTo: 'robot_1',
            itemType: 'Actuator Servo Pack',
            rfidPayloadId: 'TAG_ACT_440',
            createdAt: Date.now() - 15000
          }
        ],
        activeCommands: [],
        logs: []
      };

      this.stateListeners.forEach((l) => l(fullState));
      this.notifyConnection(true, 0);
    }, 1200);
  }

  disconnect(): void {
    if (!this.connected) return;
    this.connected = false;
    if (this.timer) clearInterval(this.timer);
    this.notifyConnection(false, 9999);
  }

  isConnected(): boolean {
    return this.connected;
  }

  getPacketAgeMs(): number {
    return Date.now() - this.lastPacketTimestamp;
  }

  onStateUpdate(callback: SwarmStateListener): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }

  onLogReceived(callback: LogListener): () => void {
    this.logListeners.add(callback);
    return () => this.logListeners.delete(callback);
  }

  onConnectionChange(callback: ConnectionListener): () => void {
    this.connListeners.add(callback);
    return () => this.connListeners.delete(callback);
  }

  async sendCommand(commandName: string, targetRobotId: string, payload?: any): Promise<CommandAck> {
    const ack: CommandAck = {
      commandId: `cmd-${Date.now()}`,
      commandName,
      targetRobotId,
      state: 'ACKNOWLEDGED',
      timestamp: Date.now(),
      ackTimestamp: Date.now() + 50,
      message: `[SIMULATION MODE] Command '${commandName}' dispatched through Arduino UNO Q Gateway to ${targetRobotId}`,
    };

    const log: LogPacket = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      source: 'UNO_Q_BRIDGE',
      direction: 'WEBSOCKET',
      content: `[SIMULATION DISPATCH] Browser -> UNO Q -> ${targetRobotId}: ${commandName} (Corridor Validated)`,
      level: 'INFO',
    };
    this.logListeners.forEach((l) => l(log));

    setTimeout(() => {
      ack.state = 'COMPLETED';
      ack.completedTimestamp = Date.now();
    }, 500);

    return ack;
  }

  async emergencyHalt(): Promise<CommandAck> {
    return this.sendCommand('EMERGENCY_STOP', 'ALL_ROBOTS');
  }

  private notifyConnection(connected: boolean, ageMs: number) {
    this.connListeners.forEach((l) => l(connected, ageMs));
  }
}
