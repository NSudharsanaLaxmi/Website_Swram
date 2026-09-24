import React, { useState, useEffect } from 'react';
import { RobotTwin, TaskOrder, LogPacket, WorkspaceCalibration } from './types';
import { Header } from './components/Header';
import { WarehouseDigitalTwin } from './components/WarehouseDigitalTwin';
import { EdgeAgentView } from './components/EdgeAgentView';
import { HardwareController } from './components/HardwareController';
import { ProtocolTerminal } from './components/ProtocolTerminal';
import { CodeViewer } from './components/CodeViewer';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { getDistanceToBoundary, calculateBoundaryRepulsion } from './data/arucoMarkers';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('warehouse');
  const [selectedRobotId, setSelectedRobotId] = useState<string>('robot_0');
  const [wifiOnline, setWifiOnline] = useState<boolean>(true);
  const [emergencyHalt, setEmergencyHalt] = useState<boolean>(false);
  const [schedulerActive, setSchedulerActive] = useState<boolean>(true);

  // Dynamic Workspace Calibration State derived from ArUco Boundary Markers (IDs 9..12)
  const initialCalibration: WorkspaceCalibration = {
    isCalibrated: true,
    dictionary: 'DICT_4X4_50',
    boundaryCorners: {
      tl: [5.0, 5.0],    // ID 9: BOUNDARY_TL
      tr: [115.0, 5.0],  // ID 10: BOUNDARY_TR
      br: [115.0, 115.0],// ID 11: BOUNDARY_BR
      bl: [5.0, 115.0],  // ID 12: BOUNDARY_BL
    },
    rawCornersPx: {
      tl: [35, 35],
      tr: [765, 35],
      br: [765, 765],
      bl: [35, 765],
    },
    widthCm: 120.0,
    heightCm: 120.0,
    scalePxPerCm: 6.67,
    skewAngleDeg: 0,
    perspectiveDistortion: 0,
    boundarySafetyMarginCm: 10.0,
    lastCalibratedTimestamp: Date.now(),
    homographyMatrix: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ]
  };

  const [workspaceCalibration, setWorkspaceCalibration] = useState<WorkspaceCalibration>(initialCalibration);

  // Digital Twins matching Swarm_Major repository and DICT_4X4_50:
  // Robot 1 (Marker 0): IP 192.168.1.50:8888, starting pose near Rack 1 (25.0, 35.0 cm)
  // Robot 2 (Marker 1): IP 192.168.1.51:8888, starting pose near Rack 3 (85.0, 75.0 cm)
  const initialRobots: RobotTwin[] = [
    {
      id: 'robot_0',
      botNum: 0,
      name: 'Robot 1 (Marker ID 0)',
      ip: '192.168.1.50',
      udpPort: 8888,
      battery: 98.0,
      voltage: 12.4,
      health: 100,
      pose: { x: 25.0, y: 35.0, ang: 45.0 },
      targetPos: undefined,
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
      distToBoundaryCm: 25.0,
      boundaryAlert: 'SAFE',
      batteryHistory: [
        { time: 'T-10m', timestamp: Date.now() - 600000, battery: 100.0, voltage: 12.60, dischargeRate: 0.12, currentDraw: 0.85, status: 'IDLE' },
        { time: 'T-8m', timestamp: Date.now() - 480000, battery: 99.4, voltage: 12.54, dischargeRate: 0.28, currentDraw: 1.45, status: 'NAV_TO_PICK' },
        { time: 'T-6m', timestamp: Date.now() - 360000, battery: 98.8, voltage: 12.48, dischargeRate: 0.44, currentDraw: 2.30, status: 'PICK_PAYLOAD' },
        { time: 'T-4m', timestamp: Date.now() - 240000, battery: 98.4, voltage: 12.44, dischargeRate: 0.32, currentDraw: 1.90, status: 'NAV_TO_DROP' },
        { time: 'T-2m', timestamp: Date.now() - 120000, battery: 98.1, voltage: 12.42, dischargeRate: 0.25, currentDraw: 1.60, status: 'IDLE' },
        { time: 'Now', timestamp: Date.now(), battery: 98.0, voltage: 12.40, dischargeRate: 0.22, currentDraw: 1.10, status: 'IDLE' },
      ],
      driveVelocities: { linearX: 0, angularZ: 0 },
      motorPins: {
        pwmaLeft: 4,
        pwmbRight: 5,
        dirs: [25, 26, 27, 14, 12, 13, 32, 33],
      },
      armServos: { base: 300, shoulder: 200, elbow: 200, wrist: 300, gripper: 180 },
    },
    {
      id: 'robot_1',
      botNum: 1,
      name: 'Robot 2 (Marker ID 1)',
      ip: '192.168.1.51',
      udpPort: 8888,
      battery: 92.0,
      voltage: 12.2,
      health: 98,
      pose: { x: 85.0, y: 75.0, ang: -110.0 },
      targetPos: undefined,
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
      distToBoundaryCm: 35.0,
      boundaryAlert: 'SAFE',
      batteryHistory: [
        { time: 'T-10m', timestamp: Date.now() - 600000, battery: 96.0, voltage: 12.45, dischargeRate: 0.20, currentDraw: 1.10, status: 'IDLE' },
        { time: 'T-8m', timestamp: Date.now() - 480000, battery: 95.1, voltage: 12.38, dischargeRate: 0.40, currentDraw: 2.10, status: 'NAV_TO_PICK' },
        { time: 'T-6m', timestamp: Date.now() - 360000, battery: 94.2, voltage: 12.32, dischargeRate: 0.45, currentDraw: 2.45, status: 'PICK_PAYLOAD' },
        { time: 'T-4m', timestamp: Date.now() - 240000, battery: 93.3, voltage: 12.28, dischargeRate: 0.38, currentDraw: 2.05, status: 'NAV_TO_DROP' },
        { time: 'T-2m', timestamp: Date.now() - 120000, battery: 92.6, voltage: 12.24, dischargeRate: 0.30, currentDraw: 1.50, status: 'YIELDING' },
        { time: 'Now', timestamp: Date.now(), battery: 92.0, voltage: 12.20, dischargeRate: 0.28, currentDraw: 1.25, status: 'IDLE' },
      ],
      driveVelocities: { linearX: 0, angularZ: 0 },
      motorPins: {
        pwmaLeft: 4,
        pwmbRight: 5,
        dirs: [25, 26, 27, 14, 12, 13, 32, 33],
      },
      armServos: { base: 300, shoulder: 200, elbow: 200, wrist: 300, gripper: 180 },
    },
  ];

  // Initial Missions matching ArUco racks and delivery zone in DICT_4X4_50
  const initialTasks: TaskOrder[] = [
    {
      id: 'MISSION_101',
      name: 'RACK_1 (ID 2) -> DELIVERY_ZONE (ID 8)',
      pickTarget: [25.0, 25.0],
      dropTarget: [95.0, 60.0],
      rackMarkerId: 2,
      dropMarkerId: 8,
      status: 'OPEN',
      itemType: 'Electronic Sensor Kit',
      rfidPayloadId: 'TAG_ES_901',
      createdAt: Date.now() - 30000,
    },
    {
      id: 'MISSION_102',
      name: 'RACK_2 (ID 3) -> DELIVERY_ZONE (ID 8)',
      pickTarget: [25.0, 55.0],
      dropTarget: [95.0, 60.0],
      rackMarkerId: 3,
      dropMarkerId: 8,
      status: 'OPEN',
      itemType: 'Actuator Servo Pack',
      rfidPayloadId: 'TAG_ACT_404',
      createdAt: Date.now() - 15000,
    },
  ];

  const [robots, setRobots] = useState<RobotTwin[]>(initialRobots);
  const [tasks, setTasks] = useState<TaskOrder[]>(initialTasks);
  const [logs, setLogs] = useState<LogPacket[]>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString(),
      source: 'OVERHEAD_VISION',
      direction: 'BROADCAST',
      content: '[STEP 5] Overhead ArUco Tracker online on UDP 239.255.0.1:5005 (DICT_4X4_100)',
      level: 'SUCCESS',
    },
    {
      id: 'log-2',
      timestamp: new Date().toLocaleTimeString(),
      source: 'SWARM_COORDINATOR',
      direction: 'INTERNAL',
      content: '[COORDINATOR] Swarm Coordinator loop active @ 20Hz. Yield threshold: 28.0 cm',
      level: 'INFO',
    },
    {
      id: 'log-3',
      timestamp: new Date().toLocaleTimeString(),
      source: 'ESP32_AGENT',
      direction: 'RX',
      content: '[ESP32] Listening for velocity commands on UDP port 8888',
      level: 'INFO',
    },
  ]);

  const [agentLogs] = useState<string[]>([
    '[INIT] Arduino UNO Q Linux Agent initialized on /dev/ttyS0 @ 115200',
    '[NET] UDP Multicast subscriber connected to 239.255.0.1:5005',
  ]);

  const addLog = (
    source: LogPacket['source'],
    direction: LogPacket['direction'],
    content: string,
    level: LogPacket['level'] = 'INFO'
  ) => {
    const packet: LogPacket = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      source,
      direction,
      content,
      level,
    };
    setLogs((prev) => [packet, ...prev.slice(0, 150)]);
  };

  const selectedRobot = robots.find((r) => r.id === selectedRobotId) || robots[0];

  const handleUpdateRobot = (updated: RobotTwin) => {
    setRobots((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleAddTask = (newTask: TaskOrder) => {
    setTasks((prev) => [...prev, newTask]);
    addLog(
      'SWARM_COORDINATOR',
      'INTERNAL',
      `[MISSION ENQUEUE] ${newTask.id}: Pick(${newTask.pickTarget[0]}, ${newTask.pickTarget[1]}) -> Drop(${newTask.dropTarget[0]}, ${newTask.dropTarget[1]})`,
      'INFO'
    );
  };

  const handleResetSimulation = () => {
    setRobots(initialRobots);
    setTasks(initialTasks);
    setEmergencyHalt(false);
    setWifiOnline(true);
    addLog('SWARM_COORDINATOR', 'INTERNAL', '[RESET] Swarm reset to baseline arena positions', 'WARN');
  };

  const handleRecalibrateWorkspace = (corners: {
    tl: [number, number];
    tr: [number, number];
    br: [number, number];
    bl: [number, number];
  }) => {
    const rawPx = {
      tl: [Math.round(corners.tl[0] * 6.67), Math.round(corners.tl[1] * 6.67)] as [number, number],
      tr: [Math.round(corners.tr[0] * 6.67), Math.round(corners.tr[1] * 6.67)] as [number, number],
      br: [Math.round(corners.br[0] * 6.67), Math.round(corners.br[1] * 6.67)] as [number, number],
      bl: [Math.round(corners.bl[0] * 6.67), Math.round(corners.bl[1] * 6.67)] as [number, number],
    };

    const deltaX = corners.tr[0] - corners.tl[0];
    const deltaY = corners.tr[1] - corners.tl[1];
    const skew = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    setWorkspaceCalibration({
      isCalibrated: true,
      dictionary: 'DICT_4X4_50',
      boundaryCorners: corners,
      rawCornersPx: rawPx,
      widthCm: 120.0,
      heightCm: 120.0,
      scalePxPerCm: 6.67,
      skewAngleDeg: Number(skew.toFixed(2)),
      perspectiveDistortion: Math.abs(skew) > 1 ? 0.08 : 0.02,
      boundarySafetyMarginCm: 10.0,
      lastCalibratedTimestamp: Date.now(),
      homographyMatrix: [
        [1.0, 0.0, 0.0],
        [0.0, 1.0, 0.0],
        [0.0, 0.0, 1.0],
      ],
    });

    addLog(
      'OVERHEAD_VISION',
      'BROADCAST',
      `[HOMOGRAPHY RE-CALIBRATED] ArUco 4-corner homography updated: TL(${corners.tl.join(',')}) TR(${corners.tr.join(',')}) BR(${corners.br.join(',')}) BL(${corners.bl.join(',')})`,
      'SUCCESS'
    );
  };

  const handleResetCalibration = () => {
    setWorkspaceCalibration(initialCalibration);
    addLog(
      'OVERHEAD_VISION',
      'BROADCAST',
      '[CALIBRATION RESET] Restored standard 120x120cm orthogonal ArUco perimeter boundaries',
      'INFO'
    );
  };

  // Swarm Mission Allocation & Decentralized Yielding
  // Matching standalone_swarm_coordinator.py:
  // - Computes inter-robot distance
  // - If distance < 28.0 cm: Bot 1 (higher ID) yields while Bot 0 proceeds
  // - Navigates waypoint to tolerance <= 8.0 cm
  const triggerSwarmScheduler = () => {
    setTasks((currentTasks) => {
      let updatedRobots = [...robots];
      let hasChanges = false;

      const newTasks = currentTasks.map((task) => {
        if (task.status !== 'OPEN') return task;

        const availableBot = updatedRobots.find(
          (r) => r.missionState === 'IDLE' && !r.safetyInterlock && !emergencyHalt
        );

        if (availableBot) {
          hasChanges = true;
          updatedRobots = updatedRobots.map((r) => {
            if (r.id === availableBot.id) {
              return {
                ...r,
                missionState: 'NAV_TO_PICK' as const,
                assignedTaskId: task.id,
                targetPos: task.pickTarget,
              };
            }
            return r;
          });

          addLog(
            'SWARM_COORDINATOR',
            'INTERNAL',
            `[ASSIGN] Mission ${task.id} assigned to ${availableBot.name}. Navigating to Pick (${task.pickTarget[0]}, ${task.pickTarget[1]} cm)`,
            'SUCCESS'
          );

          return {
            ...task,
            status: 'ASSIGNED' as const,
            assignedTo: availableBot.id,
          };
        }

        return task;
      });

      if (hasChanges) {
        setRobots(updatedRobots);
      }
      return newTasks;
    });
  };

  // Periodic coordination loop (every 2.5s)
  useEffect(() => {
    if (!schedulerActive) return;

    const interval = setInterval(() => {
      triggerSwarmScheduler();
    }, 2500);

    return () => clearInterval(interval);
  }, [schedulerActive, robots]);

  // 20Hz Closed-Loop Navigation Tick matching standalone_swarm_coordinator.py
  // Enforces both ArUco boundary constraints and peer yielding
  useEffect(() => {
    const navInterval = setInterval(() => {
      setRobots((prevRobots) => {
        if (prevRobots.length < 2) return prevRobots;
        const [bot0, bot1] = prevRobots;

        // Calculate Euclidean distance between robots in cm
        const dx = bot0.pose.x - bot1.pose.x;
        const dy = bot0.pose.y - bot1.pose.y;
        const interDist = Math.sqrt(dx * dx + dy * dy);

        // Boundary polygon from dynamic ArUco calibration corners (IDs 9..12)
        const bc = workspaceCalibration.boundaryCorners;
        const boundaryPoly: [number, number][] = [bc.tl, bc.tr, bc.br, bc.bl];

        const nextRobots: RobotTwin[] = prevRobots.map((robot) => {
          // Boundary proximity calculations
          const robotPt: [number, number] = [robot.pose.x, robot.pose.y];
          const { distance: distToBoundary } = getDistanceToBoundary(
            robotPt,
            boundaryPoly
          );

          const repulsion = calculateBoundaryRepulsion(
            robotPt,
            boundaryPoly,
            workspaceCalibration.boundarySafetyMarginCm
          );

          const boundaryAlert: 'SAFE' | 'WARNING' | 'BRAKING_CRITICAL' = repulsion.alertLevel;

          if (robot.safetyInterlock || emergencyHalt) {
            return {
              ...robot,
              distToBoundaryCm: Number(distToBoundary.toFixed(1)),
              boundaryAlert,
              driveVelocities: { linearX: 0, angularZ: 0 },
            };
          }

          // CRITICAL BOUNDARY ENFORCEMENT:
          // If within 5cm of boundary polygon or repulsion requests emergency brake:
          if (repulsion.shouldBrake || distToBoundary < 5.0) {
            // Apply corrective inward rotation towards arena center (60, 60)
            const toCenterX = 60.0 - robot.pose.x;
            const toCenterY = 60.0 - robot.pose.y;
            const centerAngRad = Math.atan2(toCenterY, toCenterX);
            const centerAngDeg = (centerAngRad * 180) / Math.PI;

            let turnErr = centerAngDeg - robot.pose.ang;
            while (turnErr > 180) turnErr -= 360;
            while (turnErr < -180) turnErr += 360;

            return {
              ...robot,
              distToBoundaryCm: Number(distToBoundary.toFixed(1)),
              boundaryAlert: 'BRAKING_CRITICAL',
              pose: {
                ...robot.pose,
                ang: Number((robot.pose.ang + (turnErr > 0 ? 3 : -3)).toFixed(1)),
              },
              driveVelocities: {
                linearX: 0,
                angularZ: turnErr > 0 ? 0.6 : -0.6,
              },
            };
          }

          // Decentralized Collision Avoidance:
          // If distance < 28.0 cm, Robot 1 (higher ID) yields (halts) to Robot 0
          if (interDist < 28.0 && robot.botNum === 1 && bot0.missionState !== 'IDLE') {
            return {
              ...robot,
              distToBoundaryCm: Number(distToBoundary.toFixed(1)),
              boundaryAlert,
              missionState: 'YIELDING' as const,
              isYielding: true,
              driveVelocities: { linearX: 0, angularZ: 0 },
            };
          }

          // Resume navigation if yielding condition cleared
          if (robot.missionState === 'YIELDING' && interDist >= 28.0) {
            return {
              ...robot,
              distToBoundaryCm: Number(distToBoundary.toFixed(1)),
              boundaryAlert,
              isYielding: false,
              missionState: robot.targetPos ? ('NAV_TO_PICK' as const) : ('IDLE' as const),
            };
          }

          if (!robot.targetPos) {
            return {
              ...robot,
              distToBoundaryCm: Number(distToBoundary.toFixed(1)),
              boundaryAlert,
            };
          }

          const [tx, ty] = robot.targetPos;
          const toTargetX = tx - robot.pose.x;
          const toTargetY = ty - robot.pose.y;
          const distToTarget = Math.sqrt(toTargetX * toTargetX + toTargetY * toTargetY);

          // Reached target waypoint (tolerance <= 8.0 cm)
          if (distToTarget <= 8.0) {
            if (robot.missionState === 'NAV_TO_PICK') {
              // Transition to PICK_PAYLOAD
              addLog(
                'SWARM_COORDINATOR',
                'TX',
                `[EVENT] ${robot.name} reached Pick Rack. Clamping gripper & lifting payload...`,
                'SUCCESS'
              );

              // Find active task to get drop target
              const activeTask = tasks.find((t) => t.id === robot.assignedTaskId);
              const dropCoords = activeTask?.dropTarget || [95.0, 60.0];

              return {
                ...robot,
                distToBoundaryCm: Number(distToBoundary.toFixed(1)),
                boundaryAlert,
                missionState: 'NAV_TO_DROP' as const,
                targetPos: dropCoords,
                armServos: { ...robot.armServos, gripper: 85 }, // Clamped
                driveVelocities: { linearX: 0, angularZ: 0 },
              };
            } else if (robot.missionState === 'NAV_TO_DROP') {
              // Mission complete!
              addLog(
                'SWARM_COORDINATOR',
                'TX',
                `[COMPLETE] ${robot.name} delivered payload at Drop bay. Returning to IDLE.`,
                'SUCCESS'
              );

              setTasks((prev) =>
                prev.map((t) =>
                  t.id === robot.assignedTaskId ? { ...t, status: 'COMPLETED' as const } : t
                )
              );

              return {
                ...robot,
                distToBoundaryCm: Number(distToBoundary.toFixed(1)),
                boundaryAlert,
                missionState: 'IDLE' as const,
                assignedTaskId: null,
                targetPos: undefined,
                armServos: { ...robot.armServos, gripper: 180 }, // Open
                driveVelocities: { linearX: 0, angularZ: 0 },
              };
            }
          }

          // Closed loop navigation toward current target
          const targetAngRad = Math.atan2(toTargetY, toTargetX);
          const targetAngDeg = (targetAngRad * 180) / Math.PI;

          let angErr = targetAngDeg - robot.pose.ang;
          while (angErr > 180) angErr -= 360;
          while (angErr < -180) angErr += 360;

          // Velocity scaled by boundary proximity
          const speedScale = Math.min(1.0, Math.max(0.2, distToBoundary / workspaceCalibration.boundarySafetyMarginCm));
          const baseSpeed = 0.8;
          const throttledSpeed = baseSpeed * speedScale;
          const stepX = (toTargetX / distToTarget) * throttledSpeed;
          const stepY = (toTargetY / distToTarget) * throttledSpeed;

          return {
            ...robot,
            distToBoundaryCm: Number(distToBoundary.toFixed(1)),
            boundaryAlert,
            pose: {
              x: Number((robot.pose.x + stepX).toFixed(2)),
              y: Number((robot.pose.y + stepY).toFixed(2)),
              ang: Number((robot.pose.ang + (angErr > 0 ? 3 : -3)).toFixed(1)),
            },
            driveVelocities: {
              linearX: Number(((distToTarget > 10 ? 0.6 : 0.3) * speedScale).toFixed(2)),
              angularZ: Number((angErr * 0.02).toFixed(2)),
            },
          };
        });

        return nextRobots;
      });
    }, 150);

    return () => clearInterval(navInterval);
  }, [emergencyHalt, tasks, workspaceCalibration]);

  // Periodic Telemetry & UDP Broadcast stream generator
  useEffect(() => {
    const telemetryInterval = setInterval(() => {
      const r = selectedRobot;
      if (!wifiOnline) {
        setRobots((prev) =>
          prev.map((robot) =>
            robot.id === r.id
              ? { ...robot, offlineQueueCount: robot.offlineQueueCount + 1 }
              : robot
          )
        );
      } else {
        const velCmd = `${r.driveVelocities.linearX.toFixed(2)},${r.driveVelocities.angularZ.toFixed(2)}`;
        addLog(
          'SWARM_COORDINATOR',
          'TX',
          `UDP :8888 -> ${r.ip} cmd: "${velCmd}"`,
          r.safetyInterlock ? 'ALERT' : 'INFO'
        );

        // Update selected robot battery history occasionally (every 6 seconds or upon active movement)
        setRobots((prev) =>
          prev.map((bot) => {
            const isMoving = bot.driveVelocities.linearX !== 0 || bot.driveVelocities.angularZ !== 0;
            const drop = isMoving ? 0.05 : 0.01;
            const newBatt = Math.max(10.0, Number((bot.battery - drop).toFixed(2)));
            const newVolt = Number((11.1 + (newBatt / 100) * 1.5).toFixed(2));
            const newDischargeRate = Number((isMoving ? 0.35 + Math.random() * 0.15 : 0.12 + Math.random() * 0.05).toFixed(2));
            const newCurrent = Number((isMoving ? 1.8 + Math.random() * 0.8 : 0.7 + Math.random() * 0.2).toFixed(2));

            const newPoint = {
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              timestamp: Date.now(),
              battery: newBatt,
              voltage: newVolt,
              dischargeRate: newDischargeRate,
              currentDraw: newCurrent,
              status: bot.missionState,
            };

            const prevHistory = bot.batteryHistory || [];
            // Keep last 15 points
            const updatedHistory = [...prevHistory.slice(-14), newPoint];

            return {
              ...bot,
              battery: newBatt,
              voltage: newVolt,
              batteryHistory: updatedHistory,
              lastTelemetryTime: Date.now(),
            };
          })
        );
      }
    }, 4000);

    return () => clearInterval(telemetryInterval);
  }, [wifiOnline, selectedRobot]);

  // Command sender handler
  const handleSendCommand = (cmd: string, channel: 'SERIAL' | 'TCP' = 'TCP') => {
    if (channel === 'TCP') {
      addLog('SWARM_COORDINATOR', 'TX', `UDP :8888 -> ${selectedRobot.ip} "${cmd}"`, 'INFO');
      const parts = cmd.split(',');
      if (parts.length >= 2) {
        const lin = parseFloat(parts[0]) || 0;
        const ang = parseFloat(parts[1]) || 0;
        setRobots((prev) =>
          prev.map((r) =>
            r.id === selectedRobotId
              ? { ...r, driveVelocities: { linearX: lin, angularZ: ang } }
              : r
          )
        );
      }
    } else {
      addLog('UNO_Q_BRIDGE', 'TX', `UART >> ${cmd}`, 'INFO');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100/70 text-zinc-900 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        wifiOnline={wifiOnline}
        setWifiOnline={setWifiOnline}
        emergencyHalt={emergencyHalt}
        setEmergencyHalt={setEmergencyHalt}
        onResetSimulation={handleResetSimulation}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'warehouse' && (
          <WarehouseDigitalTwin
            robots={robots}
            tasks={tasks}
            selectedRobotId={selectedRobotId}
            setSelectedRobotId={setSelectedRobotId}
            onUpdateRobot={handleUpdateRobot}
            onAddTask={handleAddTask}
            onTriggerScheduler={triggerSwarmScheduler}
            schedulerActive={schedulerActive}
            setSchedulerActive={setSchedulerActive}
            workspaceCalibration={workspaceCalibration}
            onRecalibrateWorkspace={handleRecalibrateWorkspace}
            onResetCalibration={handleResetCalibration}
          />
        )}

        {activeTab === 'edge-agent' && (
          <EdgeAgentView
            selectedRobot={selectedRobot}
            robots={robots}
            wifiOnline={wifiOnline}
            setWifiOnline={setWifiOnline}
            workspaceCalibration={workspaceCalibration}
            onUpdateRobot={handleUpdateRobot}
            agentLogs={agentLogs}
          />
        )}

        {activeTab === 'actuation' && (
          <HardwareController
            selectedRobot={selectedRobot}
            onUpdateRobot={handleUpdateRobot}
            onSendCommand={(cmd) => handleSendCommand(cmd, 'TCP')}
          />
        )}

        {activeTab === 'packet-bus' && (
          <ProtocolTerminal
            logs={logs}
            onClearLogs={() => setLogs([])}
            onSendCommand={handleSendCommand}
          />
        )}

        {activeTab === 'firmware' && <CodeViewer />}

        {activeTab === 'architecture' && <ArchitectureDiagram />}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-4 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Swarm_Major Physical Architecture: ESP32 + TB6612 + PCA9685 Arm + ArUco Vision</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px] text-zinc-400">
            <span>ESP32 UDP (Port 8888)</span>
            <span>•</span>
            <span>Overhead Vision (Port 5005)</span>
            <span>•</span>
            <span>28cm Decentralized Yielding</span>
            <span>•</span>
            <span>120cm × 120cm Arena</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
