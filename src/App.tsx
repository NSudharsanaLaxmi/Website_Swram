import React, { useState, useEffect, useRef } from 'react';
import { SwarmState, RobotTwin, TaskOrder, LogPacket, WorkspaceCalibration, TelemetryMode, CommandAck, NetworkNodeState } from './types';
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
import { INITIAL_LANDMARKS_50, INITIAL_BOUNDARY_CORNERS } from './data/arucoMarkers';
import { WebSocketTelemetryClient } from './services/telemetry/WebSocketTelemetryClient';
import { MockTelemetryClient } from './services/telemetry/MockTelemetryClient';

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

  // Initial Robots State
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
      pose: { x: 25.0, y: 35.0, ang: 45.0 },
      targetPos: [25.0, 30.0],
      missionState: 'IDLE',
      assignedTaskId: null,
      tofDistanceMm: 350,
      ultrasonicCm: 80,
      lastRfidTag: 'RACK_1_TAG_42',
      isYielding: false,
      safetyInterlock: false,
      offlineMode: false,
      offlineQueueCount: 0,
      lastTelemetryTime: Date.now(),
      packetAgeMs: 0,
      distToBoundaryCm: 25.0,
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
      armServos: { base: 300, shoulder: 200, elbow: 200, wrist: 300, gripper: 180 },
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
      pose: { x: 85.0, y: 75.0, ang: -110.0 },
      targetPos: [95.0, 60.0],
      missionState: 'IDLE',
      assignedTaskId: null,
      tofDistanceMm: 480,
      ultrasonicCm: 110,
      lastRfidTag: 'RACK_2_TAG_88',
      isYielding: false,
      safetyInterlock: false,
      offlineMode: false,
      offlineQueueCount: 0,
      lastTelemetryTime: Date.now(),
      packetAgeMs: 0,
      distToBoundaryCm: 35.0,
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
      armServos: { base: 300, shoulder: 200, elbow: 200, wrist: 300, gripper: 180 },
      unoQStatus: { mpuOnline: true, zephyrMcuOnline: true, uartLinkBaud: 115200, uartConnected: true, cpuLoad: 18, ramUsageMb: 530 },
      esp32Status: { rtosOnline: true, wifiSignalDbm: -62, freeHeapBytes: 295100, watchdogStatus: 'OK' }
    }
  ]);

  // Tasks & Network Nodes
  const [tasks, setTasks] = useState<TaskOrder[]>([
    {
      id: 'MISSION_101',
      name: 'RACK_1 (ID 2) -> DELIVERY_ZONE (ID 8)',
      pickTarget: [25.0, 30.0],
      dropTarget: [95.0, 60.0],
      rackMarkerId: 2,
      dropMarkerId: 8,
      status: 'OPEN',
      itemType: 'Electronic Sensor Kit',
      rfidPayloadId: 'TAG_ES_901',
      createdAt: Date.now() - 30000
    }
  ]);

  const [networkNodes] = useState<NetworkNodeState[]>([
    { id: 'n1', name: 'Overhead Vision Server', layer: 'VISION', ip: '172.20.10.2', port: 5005, protocol: 'UDP', status: 'ONLINE', latencyMs: 12, lastHeartbeatMs: Date.now(), dataRateKbps: 450 },
    { id: 'n2', name: 'Swarm Coordinator Node', layer: 'SWARM_COORDINATOR', ip: '172.20.10.2', port: 5005, protocol: 'UDP', status: 'ONLINE', latencyMs: 8, lastHeartbeatMs: Date.now(), dataRateKbps: 120 },
    { id: 'n3', name: 'Robot 1 UNO Q Edge Brain', layer: 'UNO_Q_EDGE', ip: '172.20.10.3', port: 115200, protocol: 'UART', status: 'ONLINE', latencyMs: 5, lastHeartbeatMs: Date.now(), dataRateKbps: 115 },
    { id: 'n4', name: 'Robot 1 ESP32 Controller', layer: 'ESP32_RTOS', ip: '172.20.10.3', port: 8888, protocol: 'UDP', status: 'ONLINE', latencyMs: 15, lastHeartbeatMs: Date.now(), dataRateKbps: 64 },
    { id: 'n5', name: 'Robot 2 ESP32 Controller', layer: 'ESP32_RTOS', ip: '172.20.10.4', port: 8888, protocol: 'UDP', status: 'ONLINE', latencyMs: 18, lastHeartbeatMs: Date.now(), dataRateKbps: 64 }
  ]);

  const [logs, setLogs] = useState<LogPacket[]>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString(),
      source: 'WAREHOUSE_SERVER',
      direction: 'BROADCAST',
      content: '[STEP 5] ArUco Vision Perception online (DICT_4X4_50). Boundary Markers IDs 9-12 detected.',
      level: 'SUCCESS'
    },
    {
      id: 'log-2',
      timestamp: new Date().toLocaleTimeString(),
      source: 'SWARM_COORDINATOR',
      direction: 'INTERNAL',
      content: '[SWARM] Dynamic Homography H-Matrix computed. Workcell Frame: 120.0 x 120.0 cm',
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

    const unsubState = currentClient.onStateUpdate((incoming) => {
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

  // Command Handler
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
          <WarehouseDigitalTwin
            robots={robots}
            selectedRobotId={selectedRobotId}
            onSelectRobot={setSelectedRobotId}
            tasks={tasks}
            workspace={workspace}
            landmarks={INITIAL_LANDMARKS_50}
            onAddTask={(t) => setTasks((prev) => [...prev, t])}
            onEmergencyHalt={handleEmergencyHalt}
          />
        )}

        {activeTab === 'perception' && (
          <PerceptionView
            calibration={workspace}
            robots={robots}
            landmarks={INITIAL_LANDMARKS_50}
            onRecalibrate={handleRecalibrate}
            onOpenMarkerModal={() => setIsMarkerModalOpen(true)}
          />
        )}

        {activeTab === 'architecture' && <ArchitectureDiagram />}

        {activeTab === 'edge' && (
          <EdgeAgentView
            robots={robots}
            selectedRobotId={selectedRobotId}
            onSelectRobot={setSelectedRobotId}
          />
        )}

        {activeTab === 'control' && (
          <HardwareController
            robots={robots}
            selectedRobotId={selectedRobotId}
            onSelectRobot={setSelectedRobotId}
            onSendCommand={handleSendCommand}
            onEmergencyHalt={handleEmergencyHalt}
            activeCommands={activeCommands}
            onAddTask={(t) => setTasks((prev) => [...prev, t])}
          />
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
