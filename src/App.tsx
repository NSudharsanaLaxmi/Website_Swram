import React, { useState, useEffect, useRef } from 'react';
import { 
  SwarmState, 
  RobotTwin, 
  TaskOrder, 
  LogPacket, 
  WorkspaceCalibration, 
  TelemetryMode, 
  CommandAck, 
  NetworkNodeState, 
  RackState,
  PerceptionTelemetry,
  TaskAllocationTelemetry,
  ClawStateMachineTelemetry,
  SafetyTelemetry
} from './types';
import { Header } from './components/Header';
import { WarehouseDigitalTwin } from './components/WarehouseDigitalTwin';
import { PerceptionView } from './components/PerceptionView';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { EdgeAgentView } from './components/EdgeAgentView';
import { HardwareController } from './components/HardwareController';
import { NetworkTopologyView } from './components/NetworkTopologyView';
import { ProtocolTerminal } from './components/ProtocolTerminal';
import { CodeViewer } from './components/CodeViewer';
import { ArucoMarkerSheetModal } from './components/ArucoMarkerSheetModal';
import { TaskAllocationPanel } from './components/TaskAllocationPanel';
import { SensorFusionPanel } from './components/SensorFusionPanel';
import { ClawStateMachinePanel } from './components/ClawStateMachinePanel';
import { SafetyMonitor } from './components/SafetyMonitor';
import { INITIAL_LANDMARKS_50, INITIAL_BOUNDARY_CORNERS, INITIAL_RACKS_STATE, INITIAL_DELIVERY_ZONE } from './data/arucoMarkers';
import { WebSocketTelemetryClient } from './services/telemetry/WebSocketTelemetryClient';
import { MockTelemetryClient } from './services/telemetry/MockTelemetryClient';

const CLAW_PHASES = [
  'IDLE', 'APPROACHING', 'ALIGNED', 'CLAW_OPEN', 'ARM_EXTENDING',
  'OBJECT_DETECTED', 'CLAW_CLOSING', 'GRIP_CONFIRMED', 'ARM_RETRACTING',
  'OBJECT_SECURED', 'TRANSPORT', 'DELIVERY_ALIGNMENT', 'ARM_EXTENDING',
  'CLAW_OPENING', 'OBJECT_RELEASED', 'TASK_COMPLETE'
];

const INITIAL_PERCEPTION_STATE: PerceptionTelemetry = {
  webcamConnected: true,
  dictionary: 'DICT_4X4_50',
  homographyCalibrated: true,
  detectedCorners: 4,
  robot1Tracked: true,
  robot2Tracked: true,
  rfidReading: {
    activeTag: 'TAG_RACK_01',
    matchedRack: 'RACK_1 (Marker ID 2)',
    status: 'VERIFIED',
  },
  lidarTof: {
    frontDistanceMm: 320,
    leftClearanceCm: 32.5,
    rightClearanceCm: 38.0,
    dockingClearance: 'CLEAR',
  },
  sensorFusion: {
    cameraArucoLocked: true,
    rfidIdentityMatched: true,
    lidarClearanceValid: true,
    approachAuthorized: true,
    status: 'FUSED_AND_AUTHORIZED',
  },
};

const INITIAL_TASK_ALLOCATION_STATE: TaskAllocationTelemetry = {
  activeTargetRack: 'RACK_1',
  taskDescription: 'Fetch Payload from RACK_1 to DELIVERY_ZONE',
  evaluatedCandidates: [
    {
      robotId: 'robot_0',
      name: 'Robot 1 (Marker ID 0)',
      distanceCm: 45,
      pathCost: 42.5,
      availability: 'READY',
      battery: 98.0,
      collisionRisk: 'LOW',
      feasibility: 'VALID',
    },
    {
      robotId: 'robot_1',
      name: 'Robot 2 (Marker ID 1)',
      distanceCm: 82,
      pathCost: 78.2,
      availability: 'BUSY',
      battery: 92.0,
      collisionRisk: 'LOW',
      feasibility: 'VALID',
    },
  ],
  selectedRobotId: 'robot_0',
  selectionReason: 'Lowest total path cost (42.5 vs 78.2) + proximity to target rack + high battery (98%)',
  allocatedAt: Date.now() - 5000,
};

const INITIAL_CLAW_STATE: ClawStateMachineTelemetry = {
  phases: CLAW_PHASES,
  currentPhase: 'IDLE',
  currentPhaseIndex: 0,
  targetRackId: 'RACK_1',
  armAngleDeg: 0,
  gripperState: 'OPEN',
  gripperDeg: 180,
  objectDetected: false,
  gripConfirmed: false,
};

const INITIAL_SAFETY_STATE: SafetyTelemetry = {
  boundaryStatus: 'SAFE',
  boundaryBufferMarginCm: 8.0,
  interRobotDistanceCm: 80,
  collisionBubbleCm: 28.0,
  collisionStatus: 'CLEAR',
  lidarSafetyBrake: 'CLEAR',
  rfidMatchStatus: 'VERIFIED',
  communicationWatchdog: 'OK',
  systemHalt: false,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('warehouse');
  const [selectedRobotId, setSelectedRobotId] = useState<string>('robot_0');
  const [telemetryMode, setTelemetryMode] = useState<TelemetryMode>('LIVE');
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [packetAgeMs, setPacketAgeMs] = useState<number>(0);
  const [emergencyHalt, setEmergencyHalt] = useState<boolean>(false);
  const [isMarkerModalOpen, setIsMarkerModalOpen] = useState<boolean>(false);

  // Telemetry Client Refs
  const wsClientRef = useRef<WebSocketTelemetryClient | null>(null);
  const mockClientRef = useRef<MockTelemetryClient | null>(null);

  // Subsystem States
  const [perception, setPerception] = useState<PerceptionTelemetry>(INITIAL_PERCEPTION_STATE);
  const [taskAllocator, setTaskAllocator] = useState<TaskAllocationTelemetry>(INITIAL_TASK_ALLOCATION_STATE);
  const [clawStateMachine, setClawStateMachine] = useState<ClawStateMachineTelemetry>(INITIAL_CLAW_STATE);
  const [safety, setSafety] = useState<SafetyTelemetry>(INITIAL_SAFETY_STATE);

  // Initial Workspace Calibration State for DICT_4X4_50
  const [workspace, setWorkspace] = useState<WorkspaceCalibration>({
    isCalibrated: true,
    status: 'CALIBRATED',
    dictionary: 'DICT_4X4_50',
    widthCm: 120.0,
    heightCm: 120.0,
    safetyBufferMarginCm: 8.0,
    detectedCornerCount: 4,
    boundaryCorners: INITIAL_BOUNDARY_CORNERS,
    homographyMatrix: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ],
    lastCalibratedTimestamp: Date.now()
  });

  // Initial 3-Rack State
  const [racks, setRacks] = useState<RackState[]>(INITIAL_RACKS_STATE);

  // Initial Robots State (Staged at Start 1 and Start 2)
  const [robots, setRobots] = useState<RobotTwin[]>([
    {
      id: 'robot_0',
      botNum: 0,
      name: 'Robot 1 (Marker ID 0)',
      ip: '172.20.10.3',
      udpPort: 8888,
      battery: 98.0,
      voltage: 12.4,
      health: 100,
      pose: { x: 20.0, y: 102.0, ang: -90.0 }, // Staged at Start 1 Bay
      targetPos: [35.0, 32.0], // Rack 1 Pickup Pose
      missionState: 'IDLE',
      assignedTaskId: 'MISSION_101',
      tofDistanceMm: 350,
      ultrasonicCm: 80,
      lastRfidTag: 'TAG_RACK_01',
      isYielding: false,
      safetyInterlock: false,
      offlineMode: false,
      offlineQueueCount: 0,
      lastTelemetryTime: Date.now(),
      packetAgeMs: 0,
      distToBoundaryCm: 20.0,
      outOfBounds: false,
      boundaryAlert: 'SAFE',
      batteryHistory: [
        { time: 'T-10m', timestamp: Date.now() - 600000, battery: 100.0, voltage: 12.60, dischargeRate: 0.12, currentDraw: 0.85, status: 'IDLE' },
        { time: 'Now', timestamp: Date.now(), battery: 98.0, voltage: 12.40, dischargeRate: 0.22, currentDraw: 1.10, status: 'IDLE' }
      ],
      driveVelocities: { linearX: 0, angularZ: 0 },
      motorPins: {
        pwmaLeft: 4,
        pwmbRight: 5,
        dirs: [25, 26, 27, 14, 12, 13, 32, 33],
        stbyStatus: 'HARDWIRED_HIGH'
      },
      armServos: { base: 90, shoulder: 90, elbow: 90, joint4: 90, joint5: 180 },
      mecanum: { vx: 0, vy: 0, omega: 0, driveMode: 'TESTED_2CHANNEL_SKID_STEER' },
      unoQStatus: { mpuOnline: true, zephyrMcuOnline: true, uartLinkBaud: 115200, uartConnected: true, cpuLoad: 14, ramUsageMb: 512 },
      esp32Status: { rtosOnline: true, wifiSignalDbm: -58, freeHeapBytes: 298450, watchdogStatus: 'OK' }
    },
    {
      id: 'robot_1',
      botNum: 1,
      name: 'Robot 2 (Marker ID 1)',
      ip: '172.20.10.4',
      udpPort: 8888,
      battery: 92.0,
      voltage: 12.2,
      health: 98,
      pose: { x: 100.0, y: 102.0, ang: -90.0 }, // Staged at Start 2 Bay
      targetPos: [85.0, 32.0], // Rack 2 Pickup Pose
      missionState: 'IDLE',
      assignedTaskId: 'MISSION_102',
      tofDistanceMm: 480,
      ultrasonicCm: 110,
      lastRfidTag: 'TAG_RACK_02',
      isYielding: false,
      safetyInterlock: false,
      offlineMode: false,
      offlineQueueCount: 0,
      lastTelemetryTime: Date.now(),
      packetAgeMs: 0,
      distToBoundaryCm: 20.0,
      outOfBounds: false,
      boundaryAlert: 'SAFE',
      batteryHistory: [
        { time: 'T-10m', timestamp: Date.now() - 600000, battery: 96.0, voltage: 12.45, dischargeRate: 0.20, currentDraw: 1.10, status: 'IDLE' },
        { time: 'Now', timestamp: Date.now(), battery: 92.0, voltage: 12.20, dischargeRate: 0.28, currentDraw: 1.25, status: 'IDLE' }
      ],
      driveVelocities: { linearX: 0, angularZ: 0 },
      motorPins: {
        pwmaLeft: 4,
        pwmbRight: 5,
        dirs: [25, 26, 27, 14, 12, 13, 32, 33],
        stbyStatus: 'HARDWIRED_HIGH'
      },
      armServos: { base: 90, shoulder: 90, elbow: 90, joint4: 90, joint5: 180 },
      mecanum: { vx: 0, vy: 0, omega: 0, driveMode: 'TESTED_2CHANNEL_SKID_STEER' },
      unoQStatus: { mpuOnline: true, zephyrMcuOnline: true, uartLinkBaud: 115200, uartConnected: true, cpuLoad: 18, ramUsageMb: 530 },
      esp32Status: { rtosOnline: true, wifiSignalDbm: -62, freeHeapBytes: 295100, watchdogStatus: 'OK' }
    }
  ]);

  // Tasks & Network Nodes
  const [tasks, setTasks] = useState<TaskOrder[]>([
    {
      id: 'MISSION_101',
      name: 'RACK_1 (ID 2) -> DELIVERY_ZONE (ID 8)',
      pickTarget: [35.0, 32.0],
      dropTarget: [60.0, 98.0],
      rackMarkerId: 2,
      dropMarkerId: 8,
      status: 'OPEN',
      assignedTo: 'robot_0',
      itemType: 'Electronic Sensor Kit',
      rfidPayloadId: 'TAG_RACK_01',
      createdAt: Date.now() - 30000
    },
    {
      id: 'MISSION_102',
      name: 'RACK_2 (ID 3) -> DELIVERY_ZONE (ID 8)',
      pickTarget: [85.0, 32.0],
      dropTarget: [60.0, 98.0],
      rackMarkerId: 3,
      dropMarkerId: 8,
      status: 'OPEN',
      assignedTo: 'robot_1',
      itemType: 'Actuator Servo Pack',
      rfidPayloadId: 'TAG_RACK_02',
      createdAt: Date.now() - 15000
    }
  ]);

  const [networkNodes, setNetworkNodes] = useState<NetworkNodeState[]>([
    { id: 'n1', name: 'Arduino UNO Q Gateway (Linux MPU)', layer: 'UNO_Q_EDGE', ip: '172.20.10.2', port: 8080, protocol: 'WEBSOCKET', status: 'ONLINE', latencyMs: 2, lastHeartbeatMs: Date.now(), dataRateKbps: 850 },
    { id: 'n2', name: 'Overhead Vision Perception (USB Cam)', layer: 'VISION', ip: '172.20.10.2', port: 5005, protocol: 'UDP', status: 'ONLINE', latencyMs: 5, lastHeartbeatMs: Date.now(), dataRateKbps: 450 },
    { id: 'n3', name: 'Robot 1 ESP32 Controller', layer: 'ESP32_RTOS', ip: '172.20.10.3', port: 8888, protocol: 'UDP', status: 'ONLINE', latencyMs: 14, lastHeartbeatMs: Date.now(), dataRateKbps: 64 },
    { id: 'n4', name: 'Robot 2 ESP32 Controller', layer: 'ESP32_RTOS', ip: '172.20.10.4', port: 8888, protocol: 'UDP', status: 'ONLINE', latencyMs: 16, lastHeartbeatMs: Date.now(), dataRateKbps: 64 }
  ]);

  const [logs, setLogs] = useState<LogPacket[]>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString(),
      source: 'UNO_Q_BRIDGE',
      direction: 'WEBSOCKET',
      content: '[GATEWAY ONLINE] Arduino UNO Q Linux Gateway active on port 8080. Ready for client connections.',
      level: 'SUCCESS'
    },
    {
      id: 'log-2',
      timestamp: new Date().toLocaleTimeString(),
      source: 'WAREHOUSE_SERVER',
      direction: 'BROADCAST',
      content: '[STEP 5] ArUco Vision Perception online (DICT_4X4_50). Boundary Markers IDs 9-12 calibrated.',
      level: 'SUCCESS'
    },
    {
      id: 'log-3',
      timestamp: new Date().toLocaleTimeString(),
      source: 'SWARM_COORDINATOR',
      direction: 'INTERNAL',
      content: '[SWARM] Dynamic Homography H-Matrix computed. Workcell Frame: 120.0 x 120.0 cm (8 cm Buffer)',
      level: 'INFO'
    }
  ]);

  const [activeCommands, setActiveCommands] = useState<CommandAck[]>([]);

  // Initialize Telemetry Clients
  useEffect(() => {
    wsClientRef.current = new WebSocketTelemetryClient('ws://localhost:8080/ws');
    mockClientRef.current = new MockTelemetryClient();

    const currentClient = telemetryMode === 'LIVE' ? wsClientRef.current : mockClientRef.current;
    currentClient.connect();

    const unsubConn = currentClient.onConnectionChange((connected, ageMs) => {
      setBackendConnected(connected);
      setPacketAgeMs(ageMs);
    });

    const unsubLog = currentClient.onLogReceived((logPacket) => {
      setLogs((prev) => [logPacket, ...prev.slice(0, 150)]);
    });

    const unsubState = currentClient.onStateUpdate((incoming: Partial<SwarmState> & { bots?: any }) => {
      if (incoming.perception) setPerception(incoming.perception);
      if (incoming.taskAllocator) setTaskAllocator(incoming.taskAllocator);
      if (incoming.clawStateMachine) setClawStateMachine(incoming.clawStateMachine);
      if (incoming.safety) setSafety(incoming.safety);
      if (incoming.workspace) setWorkspace(incoming.workspace);
      if (incoming.racks) setRacks(incoming.racks);
      if (incoming.robots) setRobots(incoming.robots);
      if (incoming.networkNodes) setNetworkNodes(incoming.networkNodes);
      if (incoming.tasks) setTasks(incoming.tasks);

      // Handle raw bots map fallback
      if (incoming.bots) {
        setRobots((prev) =>
          prev.map((bot) => {
            const key = bot.id === 'robot_0' ? 'id0' : 'id1';
            if (incoming.bots[key]) {
              const bData = incoming.bots[key];
              return {
                ...bot,
                pose: { x: bData.x, y: bData.y, ang: bData.ang },
                outOfBounds: bData.out_of_bounds || false,
                boundaryAlert: bData.out_of_bounds ? 'BRAKING_CRITICAL' : 'SAFE',
                lastTelemetryTime: Date.now()
              };
            }
            return bot;
          })
        );
      }
    });

    return () => {
      unsubConn();
      unsubLog();
      unsubState();
      currentClient.disconnect();
    };
  }, [telemetryMode]);

  // Command Handler (Browser -> UNO Q Gateway -> ESP32)
  const handleSendCommand = async (commandName: string, targetRobotId: string, payload?: any): Promise<CommandAck> => {
    const activeClient = telemetryMode === 'LIVE' ? wsClientRef.current : mockClientRef.current;
    if (!activeClient) {
      return {
        commandId: `cmd-err`,
        commandName,
        targetRobotId,
        state: 'FAILED',
        timestamp: Date.now(),
        message: 'Telemetry client unavailable'
      };
    }

    const ack = await activeClient.sendCommand(commandName, targetRobotId, payload);
    setActiveCommands((prev) => [ack, ...prev.slice(0, 20)]);
    return ack;
  };

  const handleEmergencyHalt = async () => {
    setEmergencyHalt((prev) => !prev);
    const activeClient = telemetryMode === 'LIVE' ? wsClientRef.current : mockClientRef.current;
    if (activeClient) {
      await activeClient.emergencyHalt();
    }
  };

  const handleRecalibrate = () => {
    setWorkspace((prev) => ({
      ...prev,
      lastCalibratedTimestamp: Date.now(),
      status: 'CALIBRATED'
    }));
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        source: 'WAREHOUSE_SERVER',
        direction: 'INTERNAL',
        content: '[RECALIBRATION] Recalculated Homography Matrix H from boundary markers ID 9, 10, 11, 12',
        level: 'SUCCESS'
      },
      ...prev
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* System Navigation & Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        telemetryMode={telemetryMode}
        setTelemetryMode={setTelemetryMode}
        backendConnected={backendConnected}
        packetAgeMs={packetAgeMs}
        calibrationStatus={workspace.status}
        emergencyHalt={emergencyHalt}
        onEmergencyHalt={handleEmergencyHalt}
        onRecalibrate={handleRecalibrate}
        onOpenMarkerModal={() => setIsMarkerModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
        {activeTab === 'warehouse' && (
          <div className="space-y-6">
            <WarehouseDigitalTwin
              robots={robots}
              selectedRobotId={selectedRobotId}
              onSelectRobot={setSelectedRobotId}
              tasks={tasks}
              workspace={workspace}
              landmarks={INITIAL_LANDMARKS_50}
              racks={racks}
              onAddTask={(t) => setTasks((prev) => [...prev, t])}
              onEmergencyHalt={handleEmergencyHalt}
            />

            {/* Live Safety & Failsafe Monitor */}
            <SafetyMonitor
              safety={safety}
              robots={robots}
              onEmergencyHalt={handleEmergencyHalt}
            />

            {/* Autonomous Swarm Task Allocation Panel */}
            <TaskAllocationPanel
              taskAllocator={taskAllocator}
              robots={robots}
            />

            {/* 16-Phase Manipulator State Machine Panel */}
            <ClawStateMachinePanel
              clawTelemetry={clawStateMachine}
            />
          </div>
        )}

        {activeTab === 'perception' && (
          <div className="space-y-6">
            <PerceptionView
              calibration={workspace}
              robots={robots}
              landmarks={INITIAL_LANDMARKS_50}
              onRecalibrate={handleRecalibrate}
              onOpenMarkerModal={() => setIsMarkerModalOpen(true)}
            />

            {/* Multi-Sensor Fusion Pipeline (ArUco + RFID + LiDAR) */}
            <SensorFusionPanel perception={perception} />
          </div>
        )}

        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <ArchitectureDiagram />
            <NetworkTopologyView
              nodes={networkNodes}
              backendConnected={backendConnected}
              packetAgeMs={packetAgeMs}
            />
          </div>
        )}

        {activeTab === 'edge' && (
          <EdgeAgentView
            robots={robots}
            selectedRobotId={selectedRobotId}
            onSelectRobot={setSelectedRobotId}
          />
        )}

        {activeTab === 'control' && (
          <div className="space-y-6">
            <HardwareController
              robots={robots}
              selectedRobotId={selectedRobotId}
              onSelectRobot={setSelectedRobotId}
              onSendCommand={handleSendCommand}
              onEmergencyHalt={handleEmergencyHalt}
              activeCommands={activeCommands}
              onAddTask={(t) => setTasks((prev) => [...prev, t])}
            />
            <ClawStateMachinePanel clawTelemetry={clawStateMachine} />
          </div>
        )}

        {activeTab === 'terminal' && (
          <ProtocolTerminal logs={logs} onClearLogs={() => setLogs([])} />
        )}

        {activeTab === 'code' && <CodeViewer />}
      </main>

      {/* ArUco Marker Set Reference Modal */}
      <ArucoMarkerSheetModal
        isOpen={isMarkerModalOpen}
        onClose={() => setIsMarkerModalOpen(false)}
      />
    </div>
  );
}
